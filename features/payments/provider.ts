import "server-only";

import { DemoPaymentProvider } from "@/features/payments/demo";
import { PaystackProvider } from "@/features/payments/paystack";

export function getPaymentProvider() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (key?.startsWith("sk_test_") && !key.includes("replace")) {
    return new PaystackProvider(key);
  }
  return new DemoPaymentProvider();
}
