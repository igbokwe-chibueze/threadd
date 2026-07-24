import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { sendOrderConfirmation } from "@/features/orders/notifications";
import { applySuccessfulPayment } from "@/features/orders/payment-processing";
import { getPaymentProvider } from "@/features/payments/provider";
import {
  type OPayCallbackPayload,
  verifyOPayCallbackSignature,
} from "@/features/payments/opay-signature";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db/client";

type OPayCallback = Readonly<{
  payload?: OPayCallbackPayload;
  sha512?: string;
  type?: string;
}>;

export async function POST(request: Request) {
  const secretKey = process.env.OPAY_SECRET_KEY;
  if (!secretKey || secretKey.toLowerCase().includes("replace")) {
    return NextResponse.json({ error: "Webhook unavailable" }, { status: 503 });
  }

  const rawBody = await request.text();
  let callback: OPayCallback;
  try {
    callback = JSON.parse(rawBody) as OPayCallback;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (
    !callback.payload ||
    !callback.sha512 ||
    !verifyOPayCallbackSignature(callback.payload, callback.sha512, secretKey)
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const fingerprint = createHash("sha256").update(rawBody).digest("hex");
  const existing = await db.paymentEvent.findUnique({ where: { fingerprint } });
  if (existing?.processedAt) return NextResponse.json({ received: true });

  const event = await db.paymentEvent.upsert({
    where: { fingerprint },
    update: {},
    create: {
      fingerprint,
      eventType: callback.type ?? "opay.transaction-status",
      reference: callback.payload.reference,
      payload: callback as Prisma.InputJsonValue,
    },
  });

  if (callback.payload.refunded) {
    const refund = await db.refund.findFirst({
      where: { providerRefundId: callback.payload.reference },
    });
    if (refund) {
      const processed = callback.payload.status === "SUCCESS";
      await db.$transaction([
        db.refund.update({
          where: { id: refund.id },
          data: {
            status: processed ? "PROCESSED" : "FAILED",
            processedAt: processed ? new Date() : undefined,
          },
        }),
        ...(processed
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
    return NextResponse.json({ received: true });
  }

  const payment = await db.payment.findUnique({
    where: { reference: callback.payload.reference },
  });
  if (payment?.provider === "opay") {
    const verification = await getPaymentProvider("opay").verify(
      payment.reference,
    );
    if (verification.status === "success") {
      const order = await applySuccessfulPayment(verification);
      await sendOrderConfirmation(order.id);
    }
    await db.paymentEvent.update({
      where: { id: event.id },
      data: { paymentId: payment.id, processedAt: new Date() },
    });
  } else {
    await db.paymentEvent.update({
      where: { id: event.id },
      data: { processedAt: new Date() },
    });
  }
  return NextResponse.json({ received: true });
}
