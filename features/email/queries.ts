import "server-only";

import {
  buildEmailViewerWhere,
  type EmailViewer,
} from "@/features/email/access-policy";
import { db } from "@/lib/db/client";

export async function getAccessibleEmailMessages(viewer: EmailViewer) {
  return db.emailMessage.findMany({
    where: buildEmailViewerWhere(viewer),
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function getUnreadEmailMessageCount(userId?: string) {
  if (!userId) return 0;

  return db.emailMessage.count({
    where: {
      recipientUserId: userId,
      readAt: null,
    },
  });
}

export async function getAdminEmailMessages(
  userId: string,
  recipientEmail: string,
) {
  return db.emailMessage.findMany({
    where: {
      kind: "ADMIN_NOTIFICATION",
      OR: [
        { recipientUserId: userId },
        { recipientEmail: recipientEmail.toLowerCase() },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getAdminEmailMessage(
  id: string,
  userId: string,
  recipientEmail: string,
) {
  return db.emailMessage.findFirst({
    where: {
      id,
      kind: "ADMIN_NOTIFICATION",
      OR: [
        { recipientUserId: userId },
        { recipientEmail: recipientEmail.toLowerCase() },
      ],
    },
  });
}

export async function getAccessibleEmailMessage(
  id: string,
  viewer: EmailViewer,
) {
  return db.emailMessage.findFirst({
    where: {
      id,
      ...buildEmailViewerWhere(viewer),
    },
  });
}

export function extractActionUrl(textBody: string): string | undefined {
  return textBody.match(/https?:\/\/[^\s]+/)?.[0];
}
