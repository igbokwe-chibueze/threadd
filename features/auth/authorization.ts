import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  canAccessAdmin,
  canManageAdministrators,
} from "@/features/auth/permissions";
import type { UserRole } from "@/generated/prisma/enums";
import { auth, type AuthSession } from "@/lib/auth/server";
import { logger } from "@/lib/logging/logger";

export { canAccessAdmin, canManageAdministrators };

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Authentication is required.");
    this.name = "AuthenticationRequiredError";
  }
}

export class PermissionDeniedError extends Error {
  constructor() {
    super("You do not have permission to perform this action.");
    this.name = "PermissionDeniedError";
  }
}

export async function getCurrentSession(): Promise<AuthSession | null> {
  return auth.api.getSession({
    headers: await headers(),
    query: {
      disableCookieCache: true,
    },
  });
}

export async function requireSession(): Promise<AuthSession> {
  const session = await getCurrentSession();

  if (!session) {
    /*
     * Record only the category of failure. Request headers, cookies, email
     * addresses, and attempted credentials are intentionally excluded.
     */
    logger.warn("Authenticated boundary rejected an anonymous request.");
    throw new AuthenticationRequiredError();
  }

  return session;
}

/**
 * Authorize a Server Component that renders an administrator page.
 *
 * Next.js can render a layout and its child page in parallel. The shared admin
 * layout is therefore a useful response-level boundary, but it cannot replace
 * a check beside each page's private query. Admin pages call this helper before
 * reading data so unauthorized requests take a consistent, user-safe redirect
 * path without producing an expected permission failure in error monitoring.
 *
 * Do not use this helper in Server Actions or route handlers. Redirects are a
 * page-navigation concern; mutation and API boundaries must independently call
 * `requireRole` or return an explicit safe HTTP response.
 */
export async function requireAdminPageSession(): Promise<AuthSession> {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/sign-in");
  }

  if (!canAccessAdmin(session.user.role as UserRole)) {
    redirect("/account");
  }

  return session;
}

export async function requireRole(
  allowedRoles: readonly UserRole[],
): Promise<AuthSession> {
  const session = await requireSession();
  const role = session.user.role as UserRole;

  if (!allowedRoles.includes(role)) {
    logger.warn("Authenticated boundary rejected an unauthorized role.", {
      role,
      allowedRoles,
    });
    throw new PermissionDeniedError();
  }

  return session;
}
