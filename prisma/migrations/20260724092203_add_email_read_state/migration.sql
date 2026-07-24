-- AlterTable
ALTER TABLE "EmailMessage" ADD COLUMN     "readAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "EmailMessage_recipientUserId_readAt_idx" ON "EmailMessage"("recipientUserId", "readAt");
