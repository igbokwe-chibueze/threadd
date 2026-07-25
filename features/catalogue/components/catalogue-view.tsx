import Link from "next/link";

import { CatalogueFilterForm } from "@/features/catalogue/components/catalogue-filter-form";
import { ProductCard } from "@/features/catalogue/components/product-card";
import {
  getCatalogueFacets,
  getCatalogueProducts,
  type CatalogueFilters,
} from "@/features/catalogue/queries";

type CatalogueViewProps = Readonly<{
  filters: CatalogueFilters;
  heading?: string;
  introduction?: string | null;
  preserve?: Readonly<Record<string, string | undefined>>;
}>;

function pageHref(
  filters: CatalogueFilters,
  page: number,
  preserve?: Readonly<Record<string, string | undefined>>,
): string {
  const params = new URLSearchParams();
  const values = {
    ...preserve,
    q: filters.query,
    category: filters.category,
    size: filters.size,
    colour: filters.colour,
    sort: filters.sort,
    page,
  };

  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== "" && value !== 1) {
      params.set(key, String(value));
    }
  }

  return `?${params.toString()}`;
}

export async function CatalogueView({
  filters,
  heading = "The full study.",
  introduction,
  preserve,
}: CatalogueViewProps) {
  const [{ products, total, page, pageCount }, facets] = await Promise.all([
    getCatalogueProducts(filters),
    getCatalogueFacets(),
  ]);

  return (
    <>
      <section className="border-b border-black/20 px-5 py-16 sm:px-10 lg:px-14 lg:py-24">
        <p className="text-[0.62rem] font-bold tracking-[0.24em] uppercase">
          Shop / {total} pieces
        </p>
        <h1 className="mt-5 max-w-6xl text-[clamp(4rem,10vw,9rem)] leading-[0.8] font-medium tracking-[-0.075em]">
          {heading}
        </h1>
        {introduction ? (
          <p className="mt-8 max-w-2xl text-sm leading-6 text-black/60">
            {introduction}
          </p>
        ) : null}
      </section>

      <section className="px-5 py-8 sm:px-10 lg:px-14">
        <CatalogueFilterForm
          filters={filters}
          preserve={preserve}
          categories={facets.categories.map((item) => [item.slug, item.name])}
          sizes={facets.sizes.map((item) => [item, item])}
          colours={facets.colours.map((item) => [item, item])}
        />

        {products.length ? (
          <div className="grid gap-x-5 gap-y-12 pt-10 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index < 3}
              />
            ))}
          </div>
        ) : (
          <div className="grid min-h-80 place-items-center border-b border-black/20 text-center">
            <div>
              <p className="text-3xl font-medium tracking-[-0.04em]">
                Nothing in this cut.
              </p>
              <p className="mt-3 text-sm text-black/55">
                Clear a filter and try the collection again.
              </p>
            </div>
          </div>
        )}

        {pageCount > 1 ? (
          <nav
            aria-label="Catalogue pagination"
            className="mt-14 flex items-center justify-between border-t border-black/20 pt-6"
          >
            {page > 1 ? (
              <Link href={pageHref(filters, page - 1, preserve)}>
                ← Previous
              </Link>
            ) : (
              <span className="text-black/60">← Previous</span>
            )}
            <span className="text-xs tracking-[0.15em] uppercase">
              {page} / {pageCount}
            </span>
            {page < pageCount ? (
              <Link href={pageHref(filters, page + 1, preserve)}>Next →</Link>
            ) : (
              <span className="text-black/60">Next →</span>
            )}
          </nav>
        ) : null}
      </section>
    </>
  );
}
