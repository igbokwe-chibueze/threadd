-- CreateEnum
CREATE TYPE "EmailKind" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET', 'ORDER_CONFIRMATION', 'PAYMENT_CONFIRMATION', 'ORDER_STATUS', 'ENQUIRY_CONFIRMATION', 'ADMIN_NOTIFICATION');

-- CreateEnum
CREATE TYPE "EmailDeliveryStatus" AS ENUM ('PREVIEW_READY', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "EmailMessage" (
    "id" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientUserId" TEXT,
    "subject" TEXT NOT NULL,
    "textBody" TEXT NOT NULL,
    "kind" "EmailKind" NOT NULL,
    "deliveryStatus" "EmailDeliveryStatus" NOT NULL DEFAULT 'PREVIEW_READY',
    "providerMessageId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailMessage_recipientUserId_createdAt_idx" ON "EmailMessage"("recipientUserId", "createdAt");

-- CreateIndex
CREATE INDEX "EmailMessage_recipientEmail_createdAt_idx" ON "EmailMessage"("recipientEmail", "createdAt");

-- CreateIndex
CREATE INDEX "EmailMessage_kind_createdAt_idx" ON "EmailMessage"("kind", "createdAt");

-- CreateIndex
CREATE INDEX "EmailMessage_expiresAt_idx" ON "EmailMessage"("expiresAt");

-- AddForeignKey
ALTER TABLE "EmailMessage" ADD CONSTRAINT "EmailMessage_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
