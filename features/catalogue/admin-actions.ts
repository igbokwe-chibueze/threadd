"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";

import { requireRole } from "@/features/auth/authorization";
import { storeCatalogueImage } from "@/features/catalogue/media-storage";
import {
  parseVariantRows,
  productInputSchema,
} from "@/features/catalogue/validation";
import type { ProductStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db/client";

export type ProductFormState = {
  error?: string;
};

const allowedRoles = ["ADMIN", "SUPER_ADMIN"] as const;

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

type ResolvedImage = { url: string; altText: string };

async function resolveImages(
  formData: FormData,
  imageAlt: string,
  existingImages: ResolvedImage[] = [],
) {
  const files = formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);
  const replaceExisting =
    formData.get("replaceImages") === "on" && files.length > 0;
  const retainedImages = replaceExisting ? [] : existingImages;

  if (retainedImages.length + files.length === 0) {
    throw new Error("Add at least one product photo.");
  }
  if (retainedImages.length + files.length > 6) {
    throw new Error("A product can have up to 6 photos.");
  }

  const uploadedUrls = await Promise.all(files.map(storeCatalogueImage));
  return [
    ...retainedImages,
    ...uploadedUrls.map((url, index) => ({
      url,
      altText:
        uploadedUrls.length > 1
          ? `${imageAlt} — view ${retainedImages.length + index + 1}`
          : imageAlt,
    })),
  ];
}

function publicPaths(slug: string) {
  revalidatePath("/shop");
  revalidatePath(`/products/${slug}`);
  revalidatePath("/collections/[slug]", "page");
  revalidatePath("/admin/catalogue");
}

function message(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues.map((issue) => issue.message).join(" ");
  }

  return error instanceof Error
    ? error.message
    : "The product could not be saved.";
}

export async function createProductAction(
  _state: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  try {
    const session = await requireRole(allowedRoles);
    const input = readProductInput(formData);
    const variants = parseVariantRows(String(formData.get("variants") ?? ""));
    const { collectionId, imageAlt, ...productData } = input;
    const images = await resolveImages(formData, imageAlt);

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
    return { error: message(error) };
  }

  redirect("/admin/catalogue?created=1");
}

export async function updateProductAction(
  productId: string,
  _state: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
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
    const { collectionId, imageAlt, ...productData } = input;
    const images = await resolveImages(
      formData,
      imageAlt,
      existing.images.map((image) => ({
        url: image.url,
        altText: image.altText,
      })),
    );

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

    publicPaths(existing.slug);
    publicPaths(input.slug);
  } catch (error) {
    return { error: message(error) };
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
