import type { Metadata } from "next";

import { CatalogueView } from "@/features/catalogue/components/catalogue-view";
import type {
  CatalogueFilters,
  CatalogueSort,
} from "@/features/catalogue/queries";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Shop THREADD's unisex collection of considered layers, tops, and trousers.",
};

type ShopPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

function first(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : value?.[0];
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const query = await searchParams;
  const filters: CatalogueFilters = {
    query: first(query.q),
    category: first(query.category),
    size: first(query.size),
    colour: first(query.colour),
    sort: first(query.sort) as CatalogueSort | undefined,
    page: Number(first(query.page)) || 1,
  };

  return <CatalogueView filters={filters} />;
}
