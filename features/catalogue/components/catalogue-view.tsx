import Link from "next/link";

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
        <form
          action=""
          className="grid gap-3 border-b border-black/20 pb-8 sm:grid-cols-2 lg:grid-cols-6"
        >
          {preserve
            ? Object.entries(preserve).map(([key, value]) =>
                value ? (
                  <input key={key} type="hidden" name={key} value={value} />
                ) : null,
              )
            : null}
          <label className="grid gap-2 text-[0.58rem] font-bold tracking-[0.14em] uppercase lg:col-span-2">
            Search
            <input
              type="search"
              name="q"
              defaultValue={filters.query}
              placeholder="Name, category, or SKU"
              className="h-11 border border-black/25 bg-transparent px-3 text-sm font-normal tracking-normal normal-case outline-none focus:border-black"
            />
          </label>
          <FilterSelect
            label="Category"
            name="category"
            value={filters.category}
            options={facets.categories.map((item) => [item.slug, item.name])}
          />
          <FilterSelect
            label="Size"
            name="size"
            value={filters.size}
            options={facets.sizes.map((item) => [item, item])}
          />
          <FilterSelect
            label="Colour"
            name="colour"
            value={filters.colour}
            options={facets.colours.map((item) => [item, item])}
          />
          <FilterSelect
            label="Sort"
            name="sort"
            value={filters.sort}
            options={[
              ["featured", "Featured"],
              ["newest", "Newest"],
              ["price-asc", "Price: low to high"],
              ["price-desc", "Price: high to low"],
              ["name", "Name"],
            ]}
          />
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-6 lg:justify-end">
            <button
              type="submit"
              className="h-11 bg-[#171713] px-6 text-[0.62rem] font-bold tracking-[0.16em] text-white uppercase"
            >
              Apply filters
            </button>
            <Link
              href={
                preserve?.collection
                  ? `/collections/${preserve.collection}`
                  : "/shop"
              }
              className="grid h-11 place-items-center border border-black/25 px-5 text-[0.62rem] font-bold tracking-[0.16em] uppercase"
            >
              Clear
            </Link>
          </div>
        </form>

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
              <span className="text-black/30">← Previous</span>
            )}
            <span className="text-xs tracking-[0.15em] uppercase">
              {page} / {pageCount}
            </span>
            {page < pageCount ? (
              <Link href={pageHref(filters, page + 1, preserve)}>Next →</Link>
            ) : (
              <span className="text-black/30">Next →</span>
            )}
          </nav>
        ) : null}
      </section>
    </>
  );
}

type FilterSelectProps = Readonly<{
  label: string;
  name: string;
  value?: string;
  options: readonly (readonly [string, string])[];
}>;

function FilterSelect({ label, name, value, options }: FilterSelectProps) {
  return (
    <label className="grid gap-2 text-[0.58rem] font-bold tracking-[0.14em] uppercase">
      {label}
      <select
        name={name}
        defaultValue={value ?? ""}
        className="h-11 border border-black/25 bg-transparent px-2 text-sm font-normal tracking-normal normal-case outline-none focus:border-black"
      >
        <option value="">All</option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
