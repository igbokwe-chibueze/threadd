import Link from "next/link";

import { requireRole } from "@/features/auth/authorization";
import { createProductAction } from "@/features/catalogue/admin-actions";
import { ProductForm } from "@/features/catalogue/components/product-form";
import { db } from "@/lib/db/client";

export const metadata = {
  title: "New product / Studio",
  robots: { index: false },
};

export default async function NewProductPage() {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const [categories, collections] = await Promise.all([
    db.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.collection.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  return (
    <main className="min-h-screen bg-[#171713] px-5 py-8 text-white sm:px-10 lg:px-14">
      <Link
        href="/admin/catalogue"
        className="text-xs text-[#d7ff3f] uppercase"
      >
        ← Catalogue
      </Link>
      <h1 className="mt-8 text-6xl font-medium tracking-[-0.07em]">
        Add a piece.
      </h1>
      <ProductForm
        action={createProductAction}
        categories={categories}
        collections={collections}
      />
    </main>
  );
}
