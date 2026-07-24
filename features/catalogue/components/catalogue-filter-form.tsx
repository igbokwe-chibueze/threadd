"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";

import type { CatalogueFilters } from "@/features/catalogue/queries";

type CatalogueFilterFormProps = Readonly<{
  filters: CatalogueFilters;
  preserve?: Readonly<Record<string, string | undefined>>;
  categories: readonly (readonly [string, string])[];
  sizes: readonly (readonly [string, string])[];
  colours: readonly (readonly [string, string])[];
}>;

const selectClass =
  "h-11 border border-black/25 bg-transparent px-2 text-sm font-normal tracking-normal normal-case outline-none focus:border-black";

export function CatalogueFilterForm({
  filters,
  preserve,
  categories,
  sizes,
  colours,
}: CatalogueFilterFormProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function navigate(form: HTMLFormElement, clear = false) {
    const params = new URLSearchParams();
    if (!clear) {
      for (const [key, value] of new FormData(form).entries()) {
        if (typeof value === "string" && value) params.set(key, value);
      }
    } else if (preserve) {
      for (const [key, value] of Object.entries(preserve)) {
        if (value) params.set(key, value);
      }
    }

    startTransition(() => {
      router.push(params.size ? `${pathname}?${params}` : pathname);
    });
  }

  return (
    <form
      className="grid gap-3 border-b border-black/20 pb-8 sm:grid-cols-2 lg:grid-cols-6"
      aria-busy={isPending}
      onSubmit={(event) => {
        event.preventDefault();
        navigate(event.currentTarget);
      }}
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
        options={categories}
      />
      <FilterSelect
        label="Size"
        name="size"
        value={filters.size}
        options={sizes}
      />
      <FilterSelect
        label="Colour"
        name="colour"
        value={filters.colour}
        options={colours}
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
      <div className="flex min-h-11 items-end gap-2 sm:col-span-2 lg:col-span-6 lg:justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="h-11 min-w-36 bg-[#171713] px-6 text-[0.62rem] font-bold tracking-[0.16em] text-white uppercase disabled:cursor-wait disabled:opacity-55"
        >
          {isPending ? "Applying filters…" : "Apply filters"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={(event) => navigate(event.currentTarget.form!, true)}
          className="grid h-11 min-w-24 place-items-center border border-black/25 px-5 text-[0.62rem] font-bold tracking-[0.16em] uppercase disabled:cursor-wait disabled:opacity-55"
        >
          Clear
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        {isPending ? "Applying catalogue filters…" : ""}
      </p>
    </form>
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
      <select name={name} defaultValue={value ?? ""} className={selectClass}>
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
