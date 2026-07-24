"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { getAccessibleOrder } from "@/features/orders/queries";
import { db } from "@/lib/db/client";

export type OrderRequestState = { error?: string; success?: string };
const requestSchema = z.object({
  orderId: z.string().min(1),
  reason: z
    .string()
    .trim()
    .min(10, "Please explain in at least 10 characters.")
    .max(500),
});

export async function requestCancellationAction(
  _state: OrderRequestState,
  formData: FormData,
): Promise<OrderRequestState> {
  const result = requestSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) return { error: result.error.issues[0]?.message };
  const order = await getAccessibleOrder(result.data.orderId);
  if (!order) return { error: "Order not found." };
  if (!["PAID", "PROCESSING", "PACKED"].includes(order.status)) {
    return {
      error:
        order.status === "DISPATCHED" || order.status === "DELIVERED"
          ? "Dispatched orders must use the return process."
          : "This order cannot be cancelled at its current stage.",
    };
  }
  try {
    await db.cancellationRequest.create({
      data: { orderId: order.id, reason: result.data.reason },
    });
    revalidatePath(`/orders/${order.id}/confirmation`);
    return { success: "Cancellation request sent for staff review." };
  } catch {
    return { error: "A cancellation request already exists for this order." };
  }
}

export async function requestReturnAction(
  _state: OrderRequestState,
  formData: FormData,
): Promise<OrderRequestState> {
  const result = requestSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) return { error: result.error.issues[0]?.message };
  const order = await getAccessibleOrder(result.data.orderId);
  if (!order) return { error: "Order not found." };
  const deliveredAt = order.deliveredAt?.getTime() ?? 0;
  if (
    order.status !== "DELIVERED" ||
    !deliveredAt ||
    Date.now() - deliveredAt > 7 * 24 * 60 * 60 * 1_000
  ) {
    return { error: "This order is outside the seven-day return window." };
  }
  try {
    await db.returnRequest.create({
      data: { orderId: order.id, reason: result.data.reason },
    });
    revalidatePath(`/orders/${order.id}/confirmation`);
    return { success: "Return request sent for staff review." };
  } catch {
    return { error: "A return request already exists for this order." };
  }
}
