import "server-only";

import { createOPaySignature } from "@/features/payments/opay-signature";
import type {
  InitializePaymentInput,
  PaymentInitialization,
  PaymentProvider,
  PaymentVerification,
  RefundInitialization,
} from "@/features/payments/types";

type OPayConfig = Readonly<{
  merchantId: string;
  publicKey: string;
  secretKey: string;
  environment: "test" | "live";
}>;

type OPayResponse<T> = {
  code: string;
  message: string;
  data?: T;
};

export class OPayProvider implements PaymentProvider {
  readonly name = "opay" as const;
  private readonly baseUrl: string;

  constructor(private readonly config: OPayConfig) {
    this.baseUrl =
      config.environment === "live"
        ? "https://liveapi.opaycheckout.com"
        : "https://testapi.opaycheckout.com";
  }

  private async request<T>(
    path: string,
    body: Record<string, unknown>,
    authentication: "public" | "signature",
  ): Promise<T> {
    const rawBody = JSON.stringify(body);
    const authorization =
      authentication === "public"
        ? this.config.publicKey
        : createOPaySignature(rawBody, this.config.secretKey);
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authorization}`,
        MerchantId: this.config.merchantId,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: rawBody,
      cache: "no-store",
    });
    const payload = (await response.json()) as OPayResponse<T>;
    if (!response.ok || payload.code !== "00000" || !payload.data) {
      throw new Error(payload.message || "OPay could not process the request.");
    }
    return payload.data;
  }

  async initialize(
    input: InitializePaymentInput,
  ): Promise<PaymentInitialization> {
    const data = await this.request<{
      reference: string;
      orderNo: string;
      cashierUrl: string;
    }>(
      "/api/v1/international/cashier/create",
      {
        country: "NG",
        reference: input.reference,
        amount: { total: input.amountKobo, currency: "NGN" },
        returnUrl: input.callbackUrl,
        callbackUrl: input.webhookUrl,
        cancelUrl: input.cancelUrl,
        displayName: "THREADD",
        customerVisitSource: "BROWSER",
        expireAt: 30,
        userInfo: {
          userEmail: input.email,
          userId: input.orderId,
          userMobile: input.phone,
          userName: input.recipientName,
        },
        product: {
          name: `THREADD order ${input.orderId.slice(-8).toUpperCase()}`,
          description: "Fashion order from THREADD",
        },
      },
      "public",
    );
    return {
      authorizationUrl: data.cashierUrl,
      reference: data.reference,
      accessCode: data.orderNo,
    };
  }

  async verify(reference: string): Promise<PaymentVerification> {
    const data = await this.request<{
      reference: string;
      orderNo: string;
      status: "INITIAL" | "PENDING" | "SUCCESS" | "FAIL" | "CLOSE";
      amount: { total: number; currency: string };
      createTime?: number;
      failureReason?: string;
    }>(
      "/api/v1/international/cashier/status",
      { reference, country: "NG" },
      "signature",
    );
    return {
      reference: data.reference,
      status:
        data.status === "SUCCESS"
          ? "success"
          : data.status === "FAIL" || data.status === "CLOSE"
            ? "failed"
            : "pending",
      amountKobo: Number(data.amount.total),
      currency: data.amount.currency,
      transactionId: data.orderNo,
      channel: "opay",
      gatewayResponse: data.failureReason ?? data.status,
    };
  }

  async refund(
    reference: string,
    amountKobo: number,
  ): Promise<RefundInitialization> {
    const refundReference = `REF-${Date.now()}-${reference.slice(-12)}`;
    const appUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(
      /\/$/,
      "",
    );
    const data = await this.request<{
      reference: string;
      orderNo: string;
      orderStatus?: string;
    }>(
      "/api/v1/international/payment/refund/create",
      {
        amount: { currency: "NGN", total: amountKobo },
        callbackUrl: `${appUrl}/api/payments/opay/webhook`,
        country: "NG",
        originalReference: reference,
        reference: refundReference,
        refundWay: "Original",
      },
      "signature",
    );
    return {
      providerRefundId: data.reference || data.orderNo,
      status: data.orderStatus === "SUCCESS" ? "processed" : "pending",
    };
  }
}
