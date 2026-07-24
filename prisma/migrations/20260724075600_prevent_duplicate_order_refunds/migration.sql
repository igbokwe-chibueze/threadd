-- A full order payment may have only one refund workflow. This database guard
-- prevents concurrent administrator actions or provider retries from creating
-- duplicate refunds.
CREATE UNIQUE INDEX "Refund_orderId_paymentId_key"
ON "Refund"("orderId", "paymentId");
