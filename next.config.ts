import type { NextConfig } from "next";

import { securityHeaders } from "./lib/security/headers";

const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME;

const nextConfig: NextConfig = {
  /*
   * Playwright starts an isolated development server so it cannot inherit a
   * developer's already-running server or payment-provider configuration. Next
   * permits only one development lock per output directory, therefore the E2E
   * server supplies NEXT_DIST_DIR=.next-e2e. Normal development and production
   * builds do not set the variable and continue to use the standard `.next`
   * directory.
   *
   * NEXT_DIST_DIR is controlled only by repository scripts/configuration. It
   * must never be populated from a request or other untrusted input.
   */
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    /*
     * Restrict optimized remote images to this deployment's Cloudinary cloud.
     * Without Cloudinary configuration the local/demo build allows no remote
     * image path, preserving the existing repository-hosted catalogue.
     */
    remotePatterns: cloudinaryCloudName
      ? [
          {
            protocol: "https",
            hostname: "res.cloudinary.com",
            pathname: `/${cloudinaryCloudName}/image/upload/**`,
          },
        ]
      : [],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
