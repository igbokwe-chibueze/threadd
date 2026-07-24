import "server-only";

import { randomBytes } from "node:crypto";

export { hashEmailPreviewToken } from "@/features/email/access-policy";

export const EMAIL_PREVIEW_COOKIE = "threadd_email_preview";
export const EMAIL_PREVIEW_TTL_SECONDS = 15 * 60;

export function createEmailPreviewToken(): string {
  return randomBytes(32).toString("base64url");
}

export function getPreviewTokenFromCookieHeader(
  cookieHeader: string | null,
): string | undefined {
  if (!cookieHeader) {
    return undefined;
  }

  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${EMAIL_PREVIEW_COOKIE}=`));

  return cookie
    ? decodeURIComponent(cookie.slice(EMAIL_PREVIEW_COOKIE.length + 1))
    : undefined;
}
