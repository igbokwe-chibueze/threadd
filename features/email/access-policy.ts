import { createHash } from "node:crypto";

export type EmailViewer = Readonly<{
  userId?: string;
  previewToken?: string;
}>;

export function hashEmailPreviewToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function buildEmailViewerWhere(
  viewer: EmailViewer,
  now: Date = new Date(),
) {
  if (viewer.userId) {
    return {
      recipientUserId: viewer.userId,
      kind: { not: "ADMIN_NOTIFICATION" as const },
    };
  }

  if (viewer.previewToken) {
    return {
      previewTokenHash: hashEmailPreviewToken(viewer.previewToken),
      previewExpiresAt: { gt: now },
      kind: { not: "ADMIN_NOTIFICATION" as const },
    };
  }

  return { id: "__no-access__" };
}
