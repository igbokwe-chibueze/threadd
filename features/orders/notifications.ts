import "server-only";

import { createOrderConfirmationEmail } from "@/features/email/templates/orders";
import { emailService } from "@/lib/email/service";
import { db } from "@/lib/db/client";
import { logger } from "@/lib/logging/logger";

export async function sendOrderConfirmation(
  orderId: string,
  previewAccessToken?: string,
) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (
    !order ||
    order.status !== "PAID" ||
    order.confirmationNotifiedAt ||
    (!order.userId && !previewAccessToken)
  ) {
    return;
  }
  const claimed = await db.order.updateMany({
    where: { id: order.id, confirmationNotifiedAt: null },
    data: { confirmationNotifiedAt: new Date() },
  });
  if (claimed.count !== 1) return;
  try {
    const message = createOrderConfirmationEmail(order);
    await emailService.send({
      recipientEmail: order.email,
      recipientUserId: order.userId ?? undefined,
      subject: message.subject,
      textBody: message.textBody,
      kind: "ORDER_CONFIRMATION",
      previewAccessToken,
    });
  } catch {
    await db.order.update({
      where: { id: order.id },
      data: { confirmationNotifiedAt: null },
    });
    logger.warn("Order confirmation preview could not be created.", {
      orderId: order.id,
    });
  }
}
