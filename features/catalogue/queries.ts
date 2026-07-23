import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db/client";

export const CATALOGUE_PAGE_SIZE = 6;

export type CatalogueSort =
  "featured" | "newest" | "price-asc" | "price-desc" | "name";

export type CatalogueFilters = Readonly<{
  query?: string;
  category?: string;
  collection?: string;
  size?: string;
  colour?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: CatalogueSort;
  page?: number;
}>;

function productWhere(filters: CatalogueFilters): Prisma.ProductWhereInput {
  const query = filters.query?.trim();

  return {
    status: "ACTIVE",
    publishedAt: { not: null, lte: new Date() },
    category: filters.category ? { slug: filters.category } : undefined,
    collections: filters.collection
      ? { some: { collection: { slug: filters.collection } } }
      : undefined,
    variants:
      filters.size || filters.colour
        ? {
            some: {
              active: true,
              size: filters.size,
              colour: filters.colour,
            },
          }
        : undefined,
    basePrice: {
      gte: filters.minPrice,
      lte: filters.maxPrice,
    },
    OR: query
      ? [
          { name: { contains: query, mode: "insensitive" } },
          { shortDescription: { contains: query, mode: "insensitive" } },
          { category: { name: { contains: query, mode: "insensitive" } } },
          {
            variants: {
              some: { sku: { contains: query, mode: "insensitive" } },
            },
          },
        ]
      : undefined,
  };
}

function productOrderBy(
  sort: CatalogueSort = "featured",
): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "newest":
      return [{ publishedAt: "desc" }, { createdAt: "desc" }];
    case "price-asc":
      return [{ basePrice: "asc" }, { name: "asc" }];
    case "price-desc":
      return [{ basePrice: "desc" }, { name: "asc" }];
    case "name":
      return [{ name: "asc" }];
    default:
      return [{ featured: "desc" }, { publishedAt: "desc" }];
  }
}

export async function getCatalogueProducts(filters: CatalogueFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const where = productWhere(filters);

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: productOrderBy(filters.sort),
      skip: (page - 1) * CATALOGUE_PAGE_SIZE,
      take: CATALOGUE_PAGE_SIZE,
      include: {
        category: true,
        images: { orderBy: { position: "asc" }, take: 1 },
        variants: {
          where: { active: true },
          select: {
            size: true,
            colour: true,
            inventoryQuantity: true,
          },
        },
      },
    }),
    db.product.count({ where }),
  ]);

  return {
    products,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / CATALOGUE_PAGE_SIZE)),
  };
}

export async function getCatalogueFacets() {
  const [categories, collections, sizes, colours] = await Promise.all([
    db.category.findMany({
      where: { products: { some: { status: "ACTIVE" } } },
      orderBy: [{ position: "asc" }, { name: "asc" }],
    }),
    db.collection.findMany({
      where: {
        products: { some: { product: { status: "ACTIVE" } } },
      },
      orderBy: [{ position: "asc" }, { name: "asc" }],
    }),
    db.productVariant.findMany({
      where: { active: true, product: { status: "ACTIVE" } },
      distinct: ["size"],
      orderBy: { size: "asc" },
      select: { size: true },
    }),
    db.productVariant.findMany({
      where: { active: true, product: { status: "ACTIVE" } },
      distinct: ["colour"],
      orderBy: { colour: "asc" },
      select: { colour: true },
    }),
  ]);

  return {
    categories,
    collections,
    sizes: sizes.map((item) => item.size),
    colours: colours.map((item) => item.colour),
  };
}

export async function getPublicProduct(slug: string) {
  return db.product.findFirst({
    where: {
      slug,
      status: "ACTIVE",
      publishedAt: { not: null, lte: new Date() },
    },
    include: {
      category: true,
      images: { orderBy: { position: "asc" } },
      variants: {
        where: { active: true },
        orderBy: [{ colour: "asc" }, { size: "asc" }],
      },
      collections: {
        include: { collection: true },
        orderBy: { position: "asc" },
      },
    },
  });
}

export async function getPublicCollection(slug: string) {
  return db.collection.findUnique({
    where: { slug },
  });
}

export async function getPublicProductSlugs() {
  return db.product.findMany({
    where: { status: "ACTIVE", publishedAt: { not: null } },
    select: { slug: true },
  });
}

export async function getPublicCollectionSlugs() {
  return db.collection.findMany({
    where: { products: { some: { product: { status: "ACTIVE" } } } },
    select: { slug: true },
  });
}
