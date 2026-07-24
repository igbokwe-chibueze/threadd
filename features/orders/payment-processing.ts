import "server-only";

import { Prisma } from "@/generated/prisma/client";
import type { PaymentVerification } from "@/features/payments/types";
import { db } from "@/lib/db/client";

export async function applySuccessfulPayment(
  verification: PaymentVerification,
) {
  return db.$transaction(
    async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { reference: verification.reference },
        include: {
          order: { include: { items: true } },
        },
      });
      if (!payment)
        throw new Error("Payment reference does not belong to an order.");
      if (payment.status === "SUCCESS") return payment.order;
      if (verification.status !== "success") {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: verification.status === "failed" ? "FAILED" : "PENDING",
            gatewayResponse: verification.gatewayResponse,
          },
        });
        throw new Error("Payment has not been confirmed.");
      }

      const expectedKobo = Math.round(Number(payment.amount) * 100);
      if (
        verification.reference !== payment.reference ||
        verification.amountKobo !== expectedKobo ||
        verification.currency !== payment.currency
      ) {
        throw new Error("Payment verification did not match the order.");
      }

      for (const item of payment.order.items) {
        if (!item.variantId) {
          throw new Error("An order item is no longer linked to inventory.");
        }
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
        });
        if (!variant || variant.inventoryQuantity < item.quantity) {
          throw new Error(`Insufficient stock for ${item.productName}.`);
        }
        const updated = await tx.productVariant.updateMany({
          where: {
            id: variant.id,
            inventoryQuantity: { gte: item.quantity },
          },
          data: { inventoryQuantity: { decrement: item.quantity } },
        });
        if (updated.count !== 1) {
          throw new Error(
            `Stock changed while paying for ${item.productName}.`,
          );
        }
        await tx.inventoryMovement.create({
          data: {
            variantId: variant.id,
            type: "SALE",
            quantityDelta: -item.quantity,
            quantityBefore: variant.inventoryQuantity,
            quantityAfter: variant.inventoryQuantity - item.quantity,
            reason: `Paid order ${payment.order.orderNumber}`,
            referenceType: "Order",
            referenceId: payment.order.id,
          },
        });
      }

      const paidAt = verification.paidAt ?? new Date();
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "SUCCESS",
          providerTransactionId: verification.transactionId,
          channel: verification.channel,
          gatewayResponse: verification.gatewayResponse,
          paidAt,
        },
      });
      await tx.order.update({
        where: { id: payment.order.id },
        data: { status: "PAID", paidAt },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: payment.order.id,
          fromStatus: "PENDING_PAYMENT",
          toStatus: "PAID",
          reason: "Payment verified by provider",
        },
      });
      if (payment.order.cartId) {
        await tx.cart.update({
          where: { id: payment.order.cartId },
          data: { status: "CONVERTED" },
        });
      }
      return payment.order;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 10_000,
      timeout: 15_000,
    },
  );
}
