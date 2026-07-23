import type { UserRole } from "@/generated/prisma/enums";

export function canAccessAdmin(role: UserRole): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function canManageAdministrators(role: UserRole): boolean {
  return role === "SUPER_ADMIN";
}
