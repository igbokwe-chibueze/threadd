import "server-only";

import { Prisma } from "@/generated/prisma/client";

import { getPaymentProvider } from "@/features/payments/provider";
import { decimalNairaToKobo } from "@/features/payments/money";
import { db } from "@/lib/db/client";
import { logger } from "@/lib/logging/logger";

type RefundPayment = {
  id: string;
  orderId: string;
  provider: string;
  reference: string;
  amount: { toString(): string };
};

type InitiateFullRefundInput = {
  payment: RefundPayment;
  initiatedById: string;
  reason: string;
};

/**
 * Claims and initiates the one supported full refund for an order/payment.
 *
 * The database claim deliberately happens before the external provider call.
 * Without that ordering, two near-simultaneous administrator requests could
 * both reach the provider before the Refund unique constraint was evaluated,
 * causing an irreversible double refund. The unique `(orderId, paymentId)`
 * record is therefore the idempotency key for this application boundary.
 *
 * Provider APIs and the database cannot share a transaction. If the process
 * stops after the provider accepts the refund, the retained PENDING record is
 * reconciliation evidence and prevents an automatic retry from issuing money
 * twice. An operator must verify that record with the provider before retrying.
 */
export async function initiateFullRefund({
  payment,
  initiatedById,
  reason,
}: InitiateFullRefundInput): Promise<{
  refundId: string;
  status: "PROCESSING" | "PROCESSED";
}> {
  let refund;
  try {
    refund = await db.refund.create({
      data: {
        orderId: payment.orderId,
        paymentId: payment.id,
        initiatedById,
        amount: payment.amount.toString(),
        reason,
        status: "PENDING",
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("A refund has already been initiated for this payment.");
    }
    throw error;
  }

  try {
    const result = await getPaymentProvider(payment.provider).refund(
      payment.reference,
      decimalNairaToKobo(payment.amount),
    );
    const status =
      result.status === "processed"
        ? ("PROCESSED" as const)
        : ("PROCESSING" as const);
    await db.refund.update({
      where: { id: refund.id },
      data: {
        providerRefundId: result.providerRefundId,
        status,
        processedAt: status === "PROCESSED" ? new Date() : undefined,
      },
    });
    return { refundId: refund.id, status };
  } catch (error) {
    /*
     * FAILED means the provider explicitly rejected/threw during this attempt.
     * It is still not retried automatically because a network failure can be
     * ambiguous: the provider may have accepted the request before disconnect.
     */
    await db.refund.update({
      where: { id: refund.id },
      data: { status: "FAILED" },
    });
    logger.error("Refund provider request failed.", {
      orderId: payment.orderId,
      paymentId: payment.id,
      refundId: refund.id,
      provider: payment.provider,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    throw new Error(
      "The refund could not be confirmed with the payment provider. Verify it with the provider before retrying.",
    );
  }
}
