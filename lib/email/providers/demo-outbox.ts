import "server-only";

import type {
  EmailDeliveryResult,
  EmailMessageInput,
  EmailProvider,
} from "@/lib/email/types";
import {
  EMAIL_PREVIEW_TTL_SECONDS,
  hashEmailPreviewToken,
} from "@/lib/email/preview-access";
import { db } from "@/lib/db/client";

export class DemoOutboxEmailProvider implements EmailProvider {
  async deliver(message: EmailMessageInput): Promise<EmailDeliveryResult> {
    const previewExpiresAt = message.previewAccessToken
      ? new Date(Date.now() + EMAIL_PREVIEW_TTL_SECONDS * 1000)
      : undefined;

    const storedMessage = await db.emailMessage.create({
      data: {
        recipientEmail: message.recipientEmail,
        recipientUserId: message.recipientUserId,
        subject: message.subject,
        textBody: message.textBody,
        kind: message.kind,
        expiresAt: message.expiresAt,
        previewTokenHash: message.previewAccessToken
          ? hashEmailPreviewToken(message.previewAccessToken)
          : undefined,
        previewExpiresAt,
      },
      select: { id: true },
    });

    return {
      messageId: storedMessage.id,
      status: "preview_ready",
    };
  }
}
