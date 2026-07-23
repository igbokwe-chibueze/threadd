import type { MetadataRoute } from "next";

import { db } from "@/lib/db/client";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
  const [products, collections] = await Promise.all([
    db.product.findMany({
      where: {
        status: "ACTIVE",
        publishedAt: { not: null, lte: new Date() },
      },
      select: {
        slug: true,
        updatedAt: true,
        images: {
          orderBy: { position: "asc" },
          take: 1,
          select: { url: true },
        },
      },
    }),
    db.collection.findMany({
      where: { products: { some: { product: { status: "ACTIVE" } } } },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const staticPages = [
    "",
    "/shop",
    "/about",
    "/contact",
    "/delivery",
    "/returns",
    "/privacy",
    "/terms",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    changeFrequency:
      path === "/shop" ? ("daily" as const) : ("monthly" as const),
    priority: path === "" ? 1 : path === "/shop" ? 0.9 : 0.5,
  }));

  return [
    ...staticPages,
    ...collections.map((collection) => ({
      url: `${baseUrl}/collections/${collection.slug}`,
      lastModified: collection.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...products.map((product) => ({
      url: `${baseUrl}/products/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      images: product.images.map((image) => new URL(image.url, baseUrl).href),
    })),
  ];
}
