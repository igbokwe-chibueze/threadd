-- Preserve the managed provider identity beside each catalogue image.
--
-- The public delivery URL is not a safe deletion authority: parsing arbitrary
-- URLs can target an unintended asset or tenant. The application instead
-- stores the provider-issued public ID and validates its configured folder
-- prefix before requesting deletion.
ALTER TABLE "ProductImage"
ADD COLUMN "storageProvider" TEXT,
ADD COLUMN "storageKey" TEXT;

CREATE INDEX "ProductImage_storageProvider_storageKey_idx"
ON "ProductImage"("storageProvider", "storageKey");
