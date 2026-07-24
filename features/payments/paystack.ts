import "server-only";

import type {
  InitializePaymentInput,
  PaymentInitialization,
  PaymentProvider,
  PaymentVerification,
} from "@/features/payments/types";

const BASE_URL = "https://api.paystack.co";

type PaystackResponse<T> = { status: boolean; message: string; data: T };

export class PaystackProvider implements PaymentProvider {
  readonly name = "paystack" as const;

  constructor(private readonly secretKey: string) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
      cache: "no-store",
    });
    const payload = (await response.json()) as PaystackResponse<T>;
    if (!response.ok || !payload.status) {
      throw new Error(
        payload.message || "Paystack could not process the request.",
      );
    }
    return payload.data;
  }

  async initialize(
    input: InitializePaymentInput,
  ): Promise<PaymentInitialization> {
    const data = await this.request<{
      authorization_url: string;
      access_code: string;
      reference: string;
    }>("/transaction/initialize", {
      method: "POST",
      body: JSON.stringify({
        email: input.email,
        amount: String(input.amountKobo),
        currency: "NGN",
        reference: input.reference,
        callback_url: input.callbackUrl,
        metadata: JSON.stringify({ orderId: input.orderId }),
      }),
    });
    return {
      authorizationUrl: data.authorization_url,
      accessCode: data.access_code,
      reference: data.reference,
    };
  }

  async verify(reference: string): Promise<PaymentVerification> {
    const data = await this.request<{
      id: number | string;
      status: string;
      reference: string;
      amount: number;
      currency: string;
      channel?: string;
      gateway_response?: string;
      paid_at?: string;
    }>(`/transaction/verify/${encodeURIComponent(reference)}`);
    return {
      reference: data.reference,
      status:
        data.status === "success"
          ? "success"
          : data.status === "failed"
            ? "failed"
            : "pending",
      amountKobo: data.amount,
      currency: data.currency,
      transactionId: String(data.id),
      channel: data.channel,
      gatewayResponse: data.gateway_response,
      paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
    };
  }

  async refund(reference: string, amountKobo: number) {
    const data = await this.request<{
      id?: number | string;
      status?: string;
    }>("/refund", {
      method: "POST",
      body: JSON.stringify({
        transaction: reference,
        amount: amountKobo,
        currency: "NGN",
      }),
    });
    return {
      providerRefundId: data.id ? String(data.id) : undefined,
      status:
        data.status === "processed"
          ? ("processed" as const)
          : ("pending" as const),
    };
  }
}
