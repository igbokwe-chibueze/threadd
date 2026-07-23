import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/features/auth/authorization";
import {
  archiveProductAction,
  updateProductAction,
} from "@/features/catalogue/admin-actions";
import { ProductForm } from "@/features/catalogue/components/product-form";
import { db } from "@/lib/db/client";

export const metadata = {
  title: "Edit product / Studio",
  robots: { index: false },
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const { id } = await params;
  const [product, categories, collections] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { position: "asc" }, take: 1 },
        variants: { orderBy: [{ colour: "asc" }, { size: "asc" }] },
        collections: { take: 1 },
      },
    }),
    db.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.collection.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  if (!product) notFound();
  const action = updateProductAction.bind(null, product.id);
  const archive = archiveProductAction.bind(null, product.id);
  const value = {
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    status: product.status,
    basePrice: product.basePrice.toString(),
    compareAtPrice: product.compareAtPrice?.toString() ?? "",
    categoryId: product.categoryId,
    collectionId: product.collections[0]?.collectionId ?? "",
    featured: product.featured,
    seoTitle: product.seoTitle ?? "",
    seoDescription: product.seoDescription ?? "",
    imageAlt: product.images[0]?.altText ?? "",
    imageUrl: product.images[0]?.url,
    variants: product.variants
      .map((variant) =>
        [
          variant.sku,
          variant.size,
          variant.colour,
          variant.colourHex ?? "",
          variant.inventoryQuantity,
          variant.priceAdjustment,
        ].join(" | "),
      )
      .join("\n"),
  };
  return (
    <main className="min-h-screen bg-[#171713] px-5 py-8 text-white sm:px-10 lg:px-14">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/catalogue"
          className="text-xs text-[#d7ff3f] uppercase"
        >
          ← Catalogue
        </Link>
        {product.status !== "ARCHIVED" ? (
          <form action={archive}>
            <button className="text-xs text-red-200 uppercase">
              Archive product
            </button>
          </form>
        ) : null}
      </div>
      <h1 className="mt-8 text-6xl font-medium tracking-[-0.07em]">
        Edit the piece.
      </h1>
      <ProductForm
        action={action}
        categories={categories}
        collections={collections}
        product={value}
      />
    </main>
  );
}
