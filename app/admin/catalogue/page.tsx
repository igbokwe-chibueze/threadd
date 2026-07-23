import Link from "next/link";

import { requireRole } from "@/features/auth/authorization";
import { formatNaira } from "@/features/catalogue/format";
import { db } from "@/lib/db/client";

export const metadata = {
  title: "Catalogue / Studio",
  robots: { index: false },
};

export default async function AdminCataloguePage() {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const products = await db.product.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      category: true,
      variants: { select: { inventoryQuantity: true } },
    },
  });

  return (
    <main className="min-h-screen bg-[#171713] px-5 py-8 text-[#f4f0e7] sm:px-10 lg:px-14">
      <header className="flex items-center justify-between border-b border-white/20 pb-5">
        <Link href="/admin" className="text-sm font-bold uppercase">
          THREADD / Studio
        </Link>
        <Link
          href="/admin/catalogue/new"
          className="bg-[#d7ff3f] px-5 py-3 text-[0.62rem] font-bold tracking-[0.16em] text-black uppercase"
        >
          New product
        </Link>
      </header>
      <section className="py-14">
        <p className="text-[0.62rem] font-bold tracking-[0.2em] text-[#d7ff3f] uppercase">
          Phase 4 / Catalogue
        </p>
        <h1 className="mt-4 text-6xl font-medium tracking-[-0.07em] sm:text-8xl">
          Every piece.
        </h1>
        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-180 text-left text-sm">
            <thead className="border-b border-white/30 text-[0.58rem] tracking-[0.16em] text-white/45 uppercase">
              <tr>
                <th className="py-4">Product</th>
                <th>Status</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Price</th>
                <th>
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-white/15">
                  <td className="py-5 font-medium">
                    {product.name}
                    <span className="mt-1 block text-xs text-white/35">
                      /{product.slug}
                    </span>
                  </td>
                  <td>{product.status}</td>
                  <td>{product.category.name}</td>
                  <td>
                    {product.variants.reduce(
                      (sum, variant) => sum + variant.inventoryQuantity,
                      0,
                    )}
                  </td>
                  <td>{formatNaira(Number(product.basePrice))}</td>
                  <td className="text-right">
                    <Link
                      href={`/admin/catalogue/${product.id}/edit`}
                      className="text-[#d7ff3f]"
                    >
                      Edit →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
