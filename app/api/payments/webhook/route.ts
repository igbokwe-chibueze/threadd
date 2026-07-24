import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { applySuccessfulPayment } from "@/features/orders/payment-processing";
import type { PaymentVerification } from "@/features/payments/types";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db/client";
import { sendOrderConfirmation } from "@/features/orders/notifications";

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret?.startsWith("sk_test_")) {
    return NextResponse.json({ error: "Webhook unavailable" }, { status: 503 });
  }
  const rawBody = await request.text();
  const supplied = request.headers.get("x-paystack-signature") ?? "";
  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  const valid =
    supplied.length === expected.length &&
    timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as {
    event: string;
    data?: {
      id?: number | string;
      status?: string;
      reference?: string;
      amount?: number;
      currency?: string;
      channel?: string;
      gateway_response?: string;
      paid_at?: string;
      transaction_reference?: string;
    };
  };
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
    const verification: PaymentVerification = {
      reference: payload.data.reference,
      status: payload.data.status === "success" ? "success" : "pending",
      amountKobo: payload.data.amount ?? 0,
      currency: payload.data.currency ?? "",
      transactionId: payload.data.id ? String(payload.data.id) : undefined,
      channel: payload.data.channel,
      gatewayResponse: payload.data.gateway_response,
      paidAt: payload.data.paid_at ? new Date(payload.data.paid_at) : undefined,
    };
    const payment = await db.payment.findUnique({
      where: { reference: verification.reference },
    });
    if (payment) {
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
