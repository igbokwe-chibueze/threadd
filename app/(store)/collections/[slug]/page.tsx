import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CatalogueView } from "@/features/catalogue/components/catalogue-view";
import {
  getPublicCollection,
  getPublicCollectionSlugs,
  type CatalogueSort,
} from "@/features/catalogue/queries";

type CollectionPageProps = Readonly<{
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

function first(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : value?.[0];
}

export async function generateStaticParams() {
  return getPublicCollectionSlugs();
}

export async function generateMetadata({
  params,
}: CollectionPageProps): Promise<Metadata> {
  const collection = await getPublicCollection((await params).slug);

  return collection
    ? {
        title: collection.name,
        description: collection.description,
      }
    : {};
}

export default async function CollectionPage({
  params,
  searchParams,
}: CollectionPageProps) {
  const { slug } = await params;
  const [collection, query] = await Promise.all([
    getPublicCollection(slug),
    searchParams,
  ]);

  if (!collection) {
    notFound();
  }

  return (
    <CatalogueView
      heading={collection.name}
      introduction={collection.description}
      preserve={{ collection: slug }}
      filters={{
        collection: slug,
        query: first(query.q),
        category: first(query.category),
        size: first(query.size),
        colour: first(query.colour),
        sort: first(query.sort) as CatalogueSort | undefined,
        page: Number(first(query.page)) || 1,
      }}
    />
  );
}
