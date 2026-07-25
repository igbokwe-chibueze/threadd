"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";

import { requireRole } from "@/features/auth/authorization";
import {
  removeCatalogueImage,
  storeCatalogueImage,
} from "@/features/catalogue/media-storage";
import {
  parseVariantRows,
  productInputSchema,
} from "@/features/catalogue/validation";
import type { ParsedVariant } from "@/features/catalogue/validation";
import { Prisma } from "@/generated/prisma/client";
import type { ProductStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db/client";
import { logger } from "@/lib/logging/logger";

export type ProductFormState = {
  error?: string;
  field?: string;
  values?: Record<string, string | boolean>;
  submissionId?: string;
};

const allowedRoles = ["ADMIN", "SUPER_ADMIN"] as const;

class CatalogueFieldError extends Error {
  constructor(
    message: string,
    readonly field: string,
  ) {
    super(message);
    this.name = "CatalogueFieldError";
  }
}

function readSubmittedValues(formData: FormData) {
  const fields = [
    "name",
    "slug",
    "shortDescription",
    "description",
    "status",
    "basePrice",
    "compareAtPrice",
    "categoryId",
    "collectionId",
    "seoTitle",
    "seoDescription",
    "imageAlt",
    "variants",
  ] as const;

  return {
    ...Object.fromEntries(
      fields.map((fieldName) => [
        fieldName,
        String(formData.get(fieldName) ?? ""),
      ]),
    ),
    featured: formData.get("featured") === "on",
    replaceImages: formData.get("replaceImages") === "on",
  };
}

function readProductInput(formData: FormData) {
  return productInputSchema.parse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    shortDescription: formData.get("shortDescription"),
    description: formData.get("description"),
    status: formData.get("status"),
    basePrice: formData.get("basePrice"),
    compareAtPrice: formData.get("compareAtPrice"),
    categoryId: formData.get("categoryId"),
    collectionId: String(formData.get("collectionId") ?? "") || undefined,
    featured: formData.get("featured") === "on",
    seoTitle: String(formData.get("seoTitle") ?? "") || undefined,
    seoDescription: String(formData.get("seoDescription") ?? "") || undefined,
    imageAlt: formData.get("imageAlt"),
  });
}

type ResolvedImage = {
  url: string;
  altText: string;
  width?: number | null;
  height?: number | null;
  storageProvider?: string | null;
  storageKey?: string | null;
};

async function cleanupStoredImages(
  images: readonly {
    storageProvider?: string | null;
    storageKey?: string | null;
  }[],
) {
  const removable = images.filter(
    (
      image,
    ): image is ResolvedImage & {
      storageProvider: "local_demo" | "cloudinary";
      storageKey: string;
    } =>
      (image.storageProvider === "local_demo" ||
        image.storageProvider === "cloudinary") &&
      Boolean(image.storageKey),
  );
  const results = await Promise.allSettled(removable.map(removeCatalogueImage));
  return results.filter((result) => result.status === "rejected").length;
}

async function resolveImages(
  formData: FormData,
  imageAlt: string,
  existingImages: ResolvedImage[] = [],
): Promise<{
  images: ResolvedImage[];
  uploadedImages: ResolvedImage[];
}> {
  const files = formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);
  const replaceExisting =
    formData.get("replaceImages") === "on" && files.length > 0;
  const retainedImages = replaceExisting ? [] : existingImages;

  if (retainedImages.length + files.length === 0) {
    throw new CatalogueFieldError("Add at least one product photo.", "images");
  }
  if (retainedImages.length + files.length > 6) {
    throw new CatalogueFieldError(
      "A product can have up to 6 photos.",
      "images",
    );
  }

  /*
   * Upload sequentially so a failure can deterministically clean every asset
   * already created during this submission. With Promise.all, another upload
   * could succeed after the first rejection and become an untracked orphan.
   */
  const uploaded = [];
  try {
    for (const file of files) {
      uploaded.push(await storeCatalogueImage(file));
    }
  } catch (error) {
    await cleanupStoredImages(uploaded);
    throw error;
  }

  const uploadedImages = uploaded.map((image, index) => ({
    ...image,
    altText:
      uploaded.length > 1
        ? `${imageAlt} — view ${retainedImages.length + index + 1}`
        : imageAlt,
  }));

  return {
    images: [...retainedImages, ...uploadedImages],
    uploadedImages,
  };
}

function publicPaths(slug: string) {
  revalidatePath("/shop");
  revalidatePath(`/products/${slug}`);
  revalidatePath("/collections/[slug]", "page");
  revalidatePath("/admin/catalogue");
}

async function assertSkusAvailable(
  variants: readonly ParsedVariant[],
  excludeProductId?: string,
) {
  const conflicts = await db.productVariant.findMany({
    where: {
      sku: { in: variants.map((variant) => variant.sku) },
      ...(excludeProductId ? { productId: { not: excludeProductId } } : {}),
    },
    select: {
      sku: true,
      size: true,
      colour: true,
      product: { select: { name: true, status: true } },
    },
    orderBy: { sku: "asc" },
  });

  if (!conflicts.length) return;

  const details = conflicts
    .slice(0, 3)
    .map(
      (conflict) =>
        `"${conflict.sku}" is already used by ${conflict.product.name} (${conflict.size} / ${conflict.colour}, ${conflict.product.status.toLowerCase()})`,
    )
    .join("; ");
  const remaining =
    conflicts.length > 3 ? `, plus ${conflicts.length - 3} more` : "";

  throw new CatalogueFieldError(
    `${details}${remaining}. Change the conflicting SKU or edit the existing product.`,
    "variants",
  );
}

function message(error: unknown) {
  if (error instanceof ZodError) {
    return {
      error: error.issues.map((issue) => issue.message).join(" "),
      field: String(error.issues[0]?.path[0] ?? ""),
    };
  }

  if (error instanceof CatalogueFieldError) {
    return { error: error.message, field: error.field };
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const target = Array.isArray(error.meta?.target)
      ? error.meta.target.join(",")
      : String(error.meta?.target ?? "");

    if (target.includes("sku")) {
      return {
        error:
          "One of these SKUs was just used by another product. Review the variant SKUs and try again.",
        field: "variants",
      };
    }
    if (target.includes("slug")) {
      return {
        error:
          "Another product already uses this URL. Change the product name or URL slug and try again.",
        field: "name",
      };
    }
    return {
      error:
        "A product with one of these unique details already exists. Review the URL and variant details.",
    };
  }

  if (error instanceof Error && !error.name.startsWith("Prisma")) {
    return { error: error.message };
  }

  logger.error("Catalogue product save failed.", { error });
  return { error: "The product could not be saved. Please try again." };
}

export async function createProductAction(
  _state: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const values = readSubmittedValues(formData);
  let uploadedImages: ResolvedImage[] = [];
  try {
    const session = await requireRole(allowedRoles);
    const input = readProductInput(formData);
    const variants = parseVariantRows(String(formData.get("variants") ?? ""));
    await assertSkusAvailable(variants);
    const { collectionId, imageAlt, ...productData } = input;
    const resolvedImages = await resolveImages(formData, imageAlt);
    const images = resolvedImages.images;
    uploadedImages = resolvedImages.uploadedImages;

    const product = await db.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          ...productData,
          status: input.status as ProductStatus,
          publishedAt: input.status === "ACTIVE" ? new Date() : null,
          collections: collectionId ? { create: { collectionId } } : undefined,
          images: {
            create: images.map((image, position) => ({ ...image, position })),
          },
          variants: {
            create: variants.map((variant) => ({
              ...variant,
              inventoryMovements: {
                create: {
                  actorId: session.user.id,
                  type: "INITIAL_STOCK",
                  quantityDelta: variant.inventoryQuantity,
                  quantityBefore: 0,
                  quantityAfter: variant.inventoryQuantity,
                  reason: "Initial stock entered during product creation",
                },
              },
            })),
          },
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "catalogue.product.create",
          resourceType: "Product",
          resourceId: created.id,
          metadata: { slug: created.slug, status: created.status },
        },
      });
      return created;
    });

    publicPaths(product.slug);
  } catch (error) {
    const failedDeletions = await cleanupStoredImages(uploadedImages);
    if (failedDeletions > 0) {
      logger.warn("Failed catalogue creation left stored media to reconcile.", {
        failedDeletions,
      });
    }
    return {
      ...message(error),
      values,
      submissionId: crypto.randomUUID(),
    };
  }

  redirect("/admin/catalogue?created=1");
}

export async function updateProductAction(
  productId: string,
  _state: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const values = readSubmittedValues(formData);
  let uploadedImages: ResolvedImage[] = [];
  try {
    const session = await requireRole(allowedRoles);
    const existing = await db.product.findUnique({
      where: { id: productId },
      include: { images: { orderBy: { position: "asc" } } },
    });
    if (!existing) {
      throw new Error("Product not found.");
    }

    const input = readProductInput(formData);
    const variants = parseVariantRows(String(formData.get("variants") ?? ""));
    await assertSkusAvailable(variants, productId);
    const { collectionId, imageAlt, ...productData } = input;
    const resolvedImages = await resolveImages(
      formData,
      imageAlt,
      existing.images.map((image) => ({
        url: image.url,
        altText: image.altText,
        width: image.width,
        height: image.height,
        storageProvider: image.storageProvider,
        storageKey: image.storageKey,
      })),
    );
    const images = resolvedImages.images;
    uploadedImages = resolvedImages.uploadedImages;

    await db.$transaction(async (tx) => {
      await tx.productCollection.deleteMany({ where: { productId } });
      await tx.productImage.deleteMany({ where: { productId } });
      const existingVariants = await tx.productVariant.findMany({
        where: { productId },
      });
      await tx.productVariant.updateMany({
        where: { productId },
        data: { active: false },
      });
      for (const variant of variants) {
        const existingVariant = existingVariants.find(
          (candidate) => candidate.sku === variant.sku,
        );
        if (existingVariant) {
          await tx.productVariant.update({
            where: { id: existingVariant.id },
            data: {
              size: variant.size,
              colour: variant.colour,
              colourHex: variant.colourHex,
              priceAdjustment: variant.priceAdjustment,
              active: true,
            },
          });
        } else {
          await tx.productVariant.create({
            data: {
              ...variant,
              productId,
              active: true,
              inventoryMovements: {
                create: {
                  actorId: session.user.id,
                  type: "INITIAL_STOCK",
                  quantityDelta: variant.inventoryQuantity,
                  quantityBefore: 0,
                  quantityAfter: variant.inventoryQuantity,
                  reason: "New variant added in catalogue",
                },
              },
            },
          });
        }
      }
      await tx.product.update({
        where: { id: productId },
        data: {
          ...productData,
          status: input.status as ProductStatus,
          publishedAt:
            input.status === "ACTIVE"
              ? (existing.publishedAt ?? new Date())
              : null,
          collections: collectionId ? { create: { collectionId } } : undefined,
          images: {
            create: images.map((image, position) => ({ ...image, position })),
          },
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "catalogue.product.update",
          resourceType: "Product",
          resourceId: productId,
          metadata: {
            previousSlug: existing.slug,
            slug: input.slug,
            status: input.status,
          },
        },
      });
    });

    /*
     * Database replacement succeeds before remote deletion. This ordering
     * prevents a Cloudinary outage from removing the only copy while the
     * product still references it. Deletion is restricted by the provider and
     * configured folder prefix inside `removeCatalogueImage`.
     */
    const removedStoredImages = existing.images.filter(
      (
        image,
      ): image is typeof image & {
        storageProvider: "local_demo" | "cloudinary";
        storageKey: string;
      } =>
        (image.storageProvider === "local_demo" ||
          image.storageProvider === "cloudinary") &&
        Boolean(image.storageKey) &&
        !images.some((retained) => retained.url === image.url),
    );
    const failedDeletions = await cleanupStoredImages(removedStoredImages);
    if (failedDeletions > 0) {
      logger.warn("Replaced catalogue media could not be removed.", {
        productId,
        failedDeletions,
      });
    }

    publicPaths(existing.slug);
    publicPaths(input.slug);
  } catch (error) {
    const failedDeletions = await cleanupStoredImages(uploadedImages);
    if (failedDeletions > 0) {
      logger.warn("Failed catalogue update left stored media to reconcile.", {
        productId,
        failedDeletions,
      });
    }
    return {
      ...message(error),
      values,
      submissionId: crypto.randomUUID(),
    };
  }

  redirect("/admin/catalogue?updated=1");
}

export async function archiveProductAction(productId: string) {
  const session = await requireRole(allowedRoles);
  const product = await db.product.update({
    where: { id: productId },
    data: { status: "ARCHIVED", publishedAt: null },
  });
  await db.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "catalogue.product.archive",
      resourceType: "Product",
      resourceId: productId,
      metadata: { slug: product.slug },
    },
  });
  publicPaths(product.slug);
  redirect("/admin/catalogue?archived=1");
}
