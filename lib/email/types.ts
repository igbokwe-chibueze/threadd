import type { EmailKind } from "@/generated/prisma/enums";

export type EmailMessageInput = Readonly<{
  recipientEmail: string;
  recipientUserId?: string;
  subject: string;
  textBody: string;
  kind: EmailKind;
  expiresAt?: Date;
  previewAccessToken?: string;
}>;

export type EmailDeliveryResult = Readonly<{
  messageId: string;
  status: "preview_ready" | "sent";
}>;

export interface EmailProvider {
  deliver(message: EmailMessageInput): Promise<EmailDeliveryResult>;
}
