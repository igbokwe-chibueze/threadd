import "server-only";

import { isDemoDeployment } from "@/features/demo/policy";
import { DemoPaymentProvider } from "@/features/payments/demo";
import { OPayProvider } from "@/features/payments/opay";
import { PaystackProvider } from "@/features/payments/paystack";
import type {
  PaymentProvider,
  PaymentProviderName,
  PaymentProviderOption,
} from "@/features/payments/types";

function hasValue(value: string | undefined) {
  return Boolean(value && !value.toLowerCase().includes("replace"));
}

function paystackProvider(): PaystackProvider | undefined {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (isDemoDeployment() && !key?.startsWith("sk_test_")) return;
  if (key?.startsWith("sk_") && hasValue(key)) {
    return new PaystackProvider(key);
  }
}

function opayProvider(): OPayProvider | undefined {
  if (isDemoDeployment()) return;
  if (process.env.OPAY_ENABLED !== "true") return;
  const merchantId = process.env.OPAY_MERCHANT_ID;
  const publicKey = process.env.OPAY_PUBLIC_KEY;
  const secretKey = process.env.OPAY_SECRET_KEY;
  if (!hasValue(merchantId) || !hasValue(publicKey) || !hasValue(secretKey)) {
    return;
  }
  return new OPayProvider({
    merchantId: merchantId!,
    publicKey: publicKey!,
    secretKey: secretKey!,
    environment: process.env.OPAY_ENVIRONMENT === "live" ? "live" : "test",
  });
}

export function getPaymentProvider(
  name?: PaymentProviderName | string,
): PaymentProvider {
  const providers: Partial<Record<PaymentProviderName, PaymentProvider>> = {
    paystack: paystackProvider(),
    opay: opayProvider(),
  };
  if (!providers.paystack && !providers.opay) {
    providers.demo = new DemoPaymentProvider();
  }

  const selected = name ? providers[name as PaymentProviderName] : undefined;
  if (selected) return selected;
  if (name) throw new Error("That payment method is not currently available.");

  const fallback = providers.paystack ?? providers.opay ?? providers.demo;
  if (!fallback) throw new Error("No payment method is configured.");
  return fallback;
}

export function getPaymentProviderOptions(): PaymentProviderOption[] {
  const options: PaymentProviderOption[] = [];
  if (paystackProvider()) {
    options.push({
      id: "paystack",
      label: "Paystack",
      description: "Pay securely by card, bank transfer, or USSD.",
      testMode:
        process.env.PAYSTACK_SECRET_KEY?.startsWith("sk_test_") ?? false,
    });
  }
  if (opayProvider()) {
    options.push({
      id: "opay",
      label: "OPay",
      description: "Continue to OPay’s secure hosted checkout.",
      testMode: process.env.OPAY_ENVIRONMENT !== "live",
    });
  }
  if (!options.length) {
    options.push({
      id: "demo",
      label: "Demo payment",
      description: "Portfolio-safe simulated checkout. No money is moved.",
      testMode: true,
    });
  }
  return options;
}
