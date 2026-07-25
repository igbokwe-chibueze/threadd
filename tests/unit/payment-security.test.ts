import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import { decimalNairaToKobo } from "@/features/payments/money";
import { hasAppliedSuccessfulPayment } from "@/features/payments/payment-state";
import {
  hasValidPaystackSignature,
  parsePaystackWebhook,
} from "@/features/payments/paystack-webhook";

describe("payment security boundaries", () => {
  it("converts decimal money to kobo without floating-point arithmetic", () => {
    expect(decimalNairaToKobo("0")).toBe(0);
    expect(decimalNairaToKobo("19.9")).toBe(1_990);
    expect(decimalNairaToKobo("123456789.01")).toBe(12_345_678_901);
    expect(() => decimalNairaToKobo("1.001")).toThrow(/represented safely/);
  });

  it("accepts only the HMAC of the exact raw Paystack body", () => {
    const secret = "sk_test_unit-only-secret";
    const rawBody = '{"event":"charge.success","data":{"reference":"THR-1"}}';
    const signature = createHmac("sha512", secret)
      .update(rawBody)
      .digest("hex");

    expect(hasValidPaystackSignature(rawBody, signature, secret)).toBe(true);
    expect(hasValidPaystackSignature(`${rawBody} `, signature, secret)).toBe(
      false,
    );
    expect(hasValidPaystackSignature(rawBody, "not-hex", secret)).toBe(false);
  });

  it("retains only payment correlation fields from provider events", () => {
    const parsed = parsePaystackWebhook(
      JSON.stringify({
        event: "charge.success",
        data: {
          id: 42,
          reference: "THR-1",
          customer: { email: "private@example.com" },
          authorization: { last4: "4081", card_type: "visa" },
        },
      }),
    );

    expect(parsed).toEqual({
      event: "charge.success",
      data: { id: 42, reference: "THR-1" },
    });
    expect(JSON.stringify(parsed)).not.toContain("private@example.com");
    expect(JSON.stringify(parsed)).not.toContain("4081");
  });

  it("does not reapply delayed success events after refund transitions", () => {
    expect(hasAppliedSuccessfulPayment("SUCCESS")).toBe(true);
    expect(hasAppliedSuccessfulPayment("PARTIALLY_REFUNDED")).toBe(true);
    expect(hasAppliedSuccessfulPayment("REFUNDED")).toBe(true);
    expect(hasAppliedSuccessfulPayment("PENDING")).toBe(false);
    expect(hasAppliedSuccessfulPayment("FAILED")).toBe(false);
  });
});
