import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { applySuccessfulPayment } from "@/features/orders/payment-processing";
import {
  hasValidPaystackSignature,
  parsePaystackWebhook,
} from "@/features/payments/paystack-webhook";
import { getPaymentProvider } from "@/features/payments/provider";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db/client";
import { sendOrderConfirmation } from "@/features/orders/notifications";

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret?.startsWith("sk_") || secret.toLowerCase().includes("replace")) {
    return NextResponse.json({ error: "Webhook unavailable" }, { status: 503 });
  }
  const rawBody = await request.text();
  const supplied = request.headers.get("x-paystack-signature") ?? "";
  if (!hasValidPaystackSignature(rawBody, supplied, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload;
  try {
    payload = parsePaystackWebhook(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const fingerprint = createHash("sha256").update(rawBody).digest("hex");
  const existing = await db.paymentEvent.findUnique({ where: { fingerprint } });
  if (existing?.processedAt) return NextResponse.json({ received: true });

  const event = await db.paymentEvent.upsert({
    where: { fingerprint },
    update: {},
    create: {
      fingerprint,
      eventType: payload.event,
      reference: payload.data?.reference,
      payload: payload as Prisma.InputJsonValue,
    },
  });
  if (payload.event === "charge.success" && payload.data?.reference) {
    const payment = await db.payment.findUnique({
      where: { reference: payload.data.reference },
    });
    if (payment?.provider === "paystack") {
      /*
       * The HMAC authenticates that Paystack sent the event; it does not make
       * every event field authoritative. Verify server-to-server and let the
       * shared transition compare reference, amount, and currency with the
       * database-owned payment before changing stock or order state.
       */
      const verification = await getPaymentProvider("paystack").verify(
        payment.reference,
      );
      const order = await applySuccessfulPayment(verification);
      await sendOrderConfirmation(order.id);
      await db.paymentEvent.update({
        where: { id: event.id },
        data: { paymentId: payment.id, processedAt: new Date() },
      });
    }
  } else if (payload.event.startsWith("refund.") && payload.data?.id) {
    const providerRefundId = String(payload.data.id);
    const refund = await db.refund.findFirst({
      where: { providerRefundId },
    });
    if (refund) {
      const status =
        payload.event === "refund.processed"
          ? "PROCESSED"
          : payload.event === "refund.failed"
            ? "FAILED"
            : "PROCESSING";
      await db.$transaction([
        db.refund.update({
          where: { id: refund.id },
          data: {
            status,
            processedAt: status === "PROCESSED" ? new Date() : undefined,
          },
        }),
        ...(status === "PROCESSED"
          ? [
              db.payment.update({
                where: { id: refund.paymentId },
                data: { status: "REFUNDED" },
              }),
            ]
          : []),
        db.paymentEvent.update({
          where: { id: event.id },
          data: { paymentId: refund.paymentId, processedAt: new Date() },
        }),
      ]);
    } else {
      await db.paymentEvent.update({
        where: { id: event.id },
        data: { processedAt: new Date() },
      });
    }
  } else {
    await db.paymentEvent.update({
      where: { id: event.id },
      data: { processedAt: new Date() },
    });
  }
  return NextResponse.json({ received: true });
}
