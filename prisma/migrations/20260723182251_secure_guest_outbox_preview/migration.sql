-- AlterTable
ALTER TABLE "EmailMessage" ADD COLUMN     "previewExpiresAt" TIMESTAMP(3),
ADD COLUMN     "previewTokenHash" TEXT;

-- CreateIndex
CREATE INDEX "EmailMessage_previewTokenHash_previewExpiresAt_idx" ON "EmailMessage"("previewTokenHash", "previewExpiresAt");
