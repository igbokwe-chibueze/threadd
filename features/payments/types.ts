export type InitializePaymentInput = Readonly<{
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  orderId: string;
}>;

export type PaymentInitialization = Readonly<{
  authorizationUrl: string;
  reference: string;
  accessCode?: string;
}>;

export type PaymentVerification = Readonly<{
  reference: string;
  status: "success" | "failed" | "pending";
  amountKobo: number;
  currency: string;
  transactionId?: string;
  channel?: string;
  gatewayResponse?: string;
  paidAt?: Date;
}>;

export type RefundInitialization = Readonly<{
  providerRefundId?: string;
  status: "pending" | "processed";
}>;

export interface PaymentProvider {
  readonly name: "paystack" | "demo";
  initialize(input: InitializePaymentInput): Promise<PaymentInitialization>;
  verify(reference: string): Promise<PaymentVerification>;
  refund(reference: string, amountKobo: number): Promise<RefundInitialization>;
}
