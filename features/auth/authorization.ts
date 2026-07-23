import "server-only";

import { headers } from "next/headers";

import type { UserRole } from "@/generated/prisma/enums";
import { auth, type AuthSession } from "@/lib/auth/server";

export {
  canAccessAdmin,
  canManageAdministrators,
} from "@/features/auth/permissions";

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
    throw new AuthenticationRequiredError();
  }

  return session;
}

export async function requireRole(
  allowedRoles: readonly UserRole[],
): Promise<AuthSession> {
  const session = await requireSession();
  const role = session.user.role as UserRole;

  if (!allowedRoles.includes(role)) {
    throw new PermissionDeniedError();
  }

  return session;
}
