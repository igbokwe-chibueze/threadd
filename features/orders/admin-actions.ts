"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { requireRole } from "@/features/auth/authorization";
import { getPaymentProvider } from "@/features/payments/provider";
import { db } from "@/lib/db/client";

export type OrderAdminState = { error?: string; success?: string };
const roles = ["ADMIN", "SUPER_ADMIN"] as const;
const transitionSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(["PROCESSING", "PACKED", "DISPATCHED", "DELIVERED"]),
  reason: z.string().trim().max(240).optional(),
});
const allowed: Record<string, string> = {
  PAID: "PROCESSING",
  PROCESSING: "PACKED",
  PACKED: "DISPATCHED",
  DISPATCHED: "DELIVERED",
};

function refresh(orderId: string) {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/orders/${orderId}/confirmation`);
  revalidatePath("/account");
}

export async function advanceOrderAction(
  _state: OrderAdminState,
  formData: FormData,
): Promise<OrderAdminState> {
  try {
    const session = await requireRole(roles);
    const input = transitionSchema.parse(Object.fromEntries(formData));
    const order = await db.order.findUnique({ where: { id: input.orderId } });
    if (!order) throw new Error("Order not found.");
    if (allowed[order.status] !== input.status) {
      throw new Error(
        `An order marked ${order.status.toLowerCase()} cannot move directly to ${input.status.toLowerCase()}.`,
      );
    }
    await db.$transaction([
      db.order.update({
        where: { id: order.id },
        data: {
          status: input.status,
          dispatchedAt: input.status === "DISPATCHED" ? new Date() : undefined,
          deliveredAt: input.status === "DELIVERED" ? new Date() : undefined,
        },
      }),
      db.orderStatusHistory.create({
        data: {
          orderId: order.id,
          actorId: session.user.id,
          fromStatus: order.status,
          toStatus: input.status,
          reason: input.reason,
        },
      }),
      db.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "order.status.update",
          resourceType: "Order",
          resourceId: order.id,
          metadata: { from: order.status, to: input.status },
        },
      }),
    ]);
    refresh(order.id);
    return { success: `Order moved to ${input.status.toLowerCase()}.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Update failed." };
  }
}

export async function reviewCancellationAction(
  decision: "APPROVE" | "REJECT",
  _state: OrderAdminState,
  formData: FormData,
): Promise<OrderAdminState> {
  const orderId = String(formData.get("orderId") ?? "");
  const reviewReason = String(formData.get("reviewReason") ?? "").trim();
  try {
    const session = await requireRole(roles);
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        cancellation: true,
        items: true,
        payments: {
          where: { status: "SUCCESS" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });
    if (!order?.cancellation || order.cancellation.status !== "PENDING") {
      throw new Error("No pending cancellation request was found.");
    }
    if (decision === "REJECT") {
      await db.cancellationRequest.update({
        where: { id: order.cancellation.id },
        data: {
          status: "REJECTED",
          reviewerId: session.user.id,
          reviewReason,
          reviewedAt: new Date(),
        },
      });
      refresh(order.id);
      return { success: "Cancellation request rejected." };
    }
    if (!["PAID", "PROCESSING", "PACKED"].includes(order.status)) {
      throw new Error("Dispatched orders cannot use cancellation.");
    }
    const payment = order.payments[0];
    if (!payment) throw new Error("A successful payment was not found.");
    const refundResult = await getPaymentProvider().refund(
      payment.reference,
      Math.round(Number(payment.amount) * 100),
    );
    await db.$transaction(async (tx) => {
      for (const item of order.items) {
        if (!item.variantId) continue;
        const variant = await tx.productVariant.update({
          where: { id: item.variantId },
          data: { inventoryQuantity: { increment: item.quantity } },
        });
        await tx.inventoryMovement.create({
          data: {
            variantId: variant.id,
            actorId: session.user.id,
            type: "RETURN",
            quantityDelta: item.quantity,
            quantityBefore: variant.inventoryQuantity - item.quantity,
            quantityAfter: variant.inventoryQuantity,
            reason: `Approved cancellation ${order.orderNumber}`,
            referenceType: "Order",
            referenceId: order.id,
          },
        });
      }
      await tx.refund.create({
        data: {
          orderId: order.id,
          paymentId: payment.id,
          initiatedById: session.user.id,
          providerRefundId: refundResult.providerRefundId,
          status:
            refundResult.status === "processed" ? "PROCESSED" : "PROCESSING",
          amount: payment.amount,
          reason: order.cancellation!.reason,
          processedAt:
            refundResult.status === "processed" ? new Date() : undefined,
        },
      });
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: refundResult.status === "processed" ? "REFUNDED" : "SUCCESS",
        },
      });
      await tx.cancellationRequest.update({
        where: { id: order.cancellation!.id },
        data: {
          status: "APPROVED",
          reviewerId: session.user.id,
          reviewReason,
          reviewedAt: new Date(),
        },
      });
      await tx.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          actorId: session.user.id,
          fromStatus: order.status,
          toStatus: "CANCELLED",
          reason: "Cancellation approved",
        },
      });
    });
    refresh(order.id);
    return { success: "Cancellation approved and refund initiated." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Review failed." };
  }
}

export async function progressReturnAction(
  operation:
    "APPROVE" | "REJECT" | "RECEIVE" | "INSPECT_SELLABLE" | "INSPECT_DAMAGED",
  _state: OrderAdminState,
  formData: FormData,
): Promise<OrderAdminState> {
  const orderId = String(formData.get("orderId") ?? "");
  const reviewReason = String(formData.get("reviewReason") ?? "").trim();
  try {
    const session = await requireRole(roles);
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        returnRequest: true,
        items: true,
        payments: {
          where: { status: "SUCCESS" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });
    if (!order?.returnRequest) throw new Error("Return request not found.");
    const request = order.returnRequest;
    if (operation === "APPROVE" || operation === "REJECT") {
      if (request.status !== "REQUESTED") {
        throw new Error("This return has already been reviewed.");
      }
      await db.returnRequest.update({
        where: { id: request.id },
        data: {
          status: operation === "APPROVE" ? "APPROVED" : "REJECTED",
          reviewerId: session.user.id,
          reviewReason,
          reviewedAt: new Date(),
        },
      });
      refresh(order.id);
      return {
        success:
          operation === "APPROVE"
            ? "Return approved; awaiting the item."
            : "Return rejected.",
      };
    }
    if (operation === "RECEIVE") {
      if (request.status !== "APPROVED") {
        throw new Error("Only approved returns can be received.");
      }
      await db.returnRequest.update({
        where: { id: request.id },
        data: { status: "RECEIVED", receivedAt: new Date() },
      });
      refresh(order.id);
      return { success: "Return marked received; inspection is now required." };
    }
    if (request.status !== "RECEIVED") {
      throw new Error("The return must be received before inspection.");
    }
    const payment = order.payments[0];
    if (!payment) throw new Error("Successful payment not found.");
    const sellable = operation === "INSPECT_SELLABLE";
    const refundResult = await getPaymentProvider().refund(
      payment.reference,
      Math.round(Number(payment.amount) * 100),
    );
    await db.$transaction(async (tx) => {
      if (sellable) {
        for (const item of order.items) {
          if (!item.variantId) continue;
          const variant = await tx.productVariant.update({
            where: { id: item.variantId },
            data: { inventoryQuantity: { increment: item.quantity } },
          });
          await tx.inventoryMovement.create({
            data: {
              variantId: variant.id,
              actorId: session.user.id,
              type: "RETURN",
              quantityDelta: item.quantity,
              quantityBefore: variant.inventoryQuantity - item.quantity,
              quantityAfter: variant.inventoryQuantity,
              reason: `Inspected sellable return ${order.orderNumber}`,
              referenceType: "ReturnRequest",
              referenceId: request.id,
            },
          });
        }
      }
      await tx.returnRequest.update({
        where: { id: request.id },
        data: {
          status: "CLOSED",
          sellable,
          inspectedAt: new Date(),
          reviewReason: reviewReason || request.reviewReason,
        },
      });
      await tx.refund.create({
        data: {
          orderId: order.id,
          paymentId: payment.id,
          initiatedById: session.user.id,
          providerRefundId: refundResult.providerRefundId,
          status:
            refundResult.status === "processed" ? "PROCESSED" : "PROCESSING",
          amount: payment.amount,
          reason: request.reason,
          processedAt:
            refundResult.status === "processed" ? new Date() : undefined,
        },
      });
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: refundResult.status === "processed" ? "REFUNDED" : "SUCCESS",
        },
      });
    });
    refresh(order.id);
    return {
      success: sellable
        ? "Inspection complete; stock restored and refund initiated."
        : "Inspection complete; refund initiated without restoring stock.",
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Return update failed.",
    };
  }
}
