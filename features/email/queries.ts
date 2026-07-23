import "server-only";

import { db } from "@/lib/db/client";
import { hashEmailPreviewToken } from "@/lib/email/preview-access";

type EmailViewer = Readonly<{
  userId?: string;
  previewToken?: string;
}>;

function viewerWhere(viewer: EmailViewer) {
  if (viewer.userId) {
    return { recipientUserId: viewer.userId };
  }

  if (viewer.previewToken) {
    return {
      previewTokenHash: hashEmailPreviewToken(viewer.previewToken),
      previewExpiresAt: { gt: new Date() },
    };
  }

  return { id: "__no-access__" };
}

export async function getAccessibleEmailMessages(viewer: EmailViewer) {
  return db.emailMessage.findMany({
    where: viewerWhere(viewer),
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function getAccessibleEmailMessage(
  id: string,
  viewer: EmailViewer,
) {
  return db.emailMessage.findFirst({
    where: {
      id,
      ...viewerWhere(viewer),
    },
  });
}

export function extractActionUrl(textBody: string): string | undefined {
  return textBody.match(/https?:\/\/[^\s]+/)?.[0];
}
