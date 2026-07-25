import type { Metadata } from "next";

import { requireAdminPageSession } from "@/features/auth/authorization";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): Promise<React.ReactNode> {
  /*
   * This layout is the shared response boundary for every route below
   * `/admin`. It prevents an unauthorized admin page tree from being returned.
   * Next.js may render the child page in parallel, so every page must still call
   * requireAdminPageSession before reading private data.
   *
   * Existing page-level checks intentionally remain in place. They protect
   * sensitive data queries close to their use and re-check the database-backed
   * session when Next.js reuses a layout during client navigation.
   *
   * Route handlers and Server Actions do not inherit layout authorization.
   * They must continue to perform independent checks at their own entry points.
   */
  await requireAdminPageSession();

  return children;
}
