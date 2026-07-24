import "server-only";

import type {
  InitializePaymentInput,
  PaymentInitialization,
  PaymentProvider,
  PaymentVerification,
} from "@/features/payments/types";
import { db } from "@/lib/db/client";

export class DemoPaymentProvider implements PaymentProvider {
  readonly name = "demo" as const;

  async initialize(
    input: InitializePaymentInput,
  ): Promise<PaymentInitialization> {
    return {
      authorizationUrl: `/checkout/test-payment?reference=${encodeURIComponent(input.reference)}`,
      reference: input.reference,
    };
  }

  async verify(reference: string): Promise<PaymentVerification> {
    const payment = await db.payment.findUnique({
      where: { reference },
      select: { amount: true, currency: true },
    });
    if (!payment) throw new Error("Test payment was not found.");
    return {
      reference,
      status: "success",
      amountKobo: Math.round(Number(payment.amount) * 100),
      currency: payment.currency,
      transactionId: `demo-${reference}`,
      channel: "test",
      gatewayResponse: "Approved by THREADD test adapter",
      paidAt: new Date(),
    };
  }

  async refund(reference: string, _amountKobo: number) {
    void _amountKobo;
    return {
      providerRefundId: `demo-refund-${reference}`,
      status: "processed" as const,
    };
  }
}
