import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.APP_URL ?? "http://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/account/",
        "/api/",
        "/sign-in",
        "/forgot-password",
        "/reset-password",
        "/demo-outbox",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
