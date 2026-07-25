import type { PaymentStatus } from "@/generated/prisma/enums";

/**
 * These states all mean the successful-payment side effects have already run.
 *
 * Refund events can arrive before a delayed/replayed charge-success event.
 * Treating only SUCCESS as finalized would let that later event deduct stock a
 * second time and move the order back to PAID.
 */
export function hasAppliedSuccessfulPayment(status: PaymentStatus): boolean {
  return ["SUCCESS", "PARTIALLY_REFUNDED", "REFUNDED"].includes(status);
}
