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

async function resolveImage(formData: FormData, existingImage?: string) {
  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    return storeCatalogueImage(image);
  }
  if (existingImage) {
    return existingImage;
  }
  throw new Error("Add a product image.");
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
    const imageUrl = await resolveImage(formData);
    const { collectionId, imageAlt, ...productData } = input;

    const product = await db.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          ...productData,
          status: input.status as ProductStatus,
          publishedAt: input.status === "ACTIVE" ? new Date() : null,
          collections: collectionId ? { create: { collectionId } } : undefined,
          images: {
            create: { url: imageUrl, altText: imageAlt, position: 0 },
          },
          variants: { create: variants },
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
      include: { images: { orderBy: { position: "asc" }, take: 1 } },
    });
    if (!existing) {
      throw new Error("Product not found.");
    }

    const input = readProductInput(formData);
    const variants = parseVariantRows(String(formData.get("variants") ?? ""));
    const imageUrl = await resolveImage(formData, existing.images[0]?.url);
    const { collectionId, imageAlt, ...productData } = input;

    await db.$transaction(async (tx) => {
      await tx.productVariant.deleteMany({ where: { productId } });
      await tx.productCollection.deleteMany({ where: { productId } });
      await tx.productImage.deleteMany({ where: { productId } });
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
            create: { url: imageUrl, altText: imageAlt, position: 0 },
          },
          variants: { create: variants },
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
