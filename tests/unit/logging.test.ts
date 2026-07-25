import { describe, expect, it } from "vitest";

import { sanitizeLogContext, sanitizeLogValue } from "@/lib/logging/logger";

describe("privacy-safe structured logging", () => {
  it("redacts sensitive keys at every nesting level", () => {
    const sanitized = sanitizeLogContext({
      orderId: "order_123",
      authorization: "Bearer secret",
      customer: {
        email: "customer@example.com",
        phoneNumber: "08000000000",
        deliveryAddress: "Private street",
        status: "PENDING",
      },
      provider: [{ accessToken: "token" }, { event: "charge.success" }],
    });

    expect(sanitized).toEqual({
      orderId: "order_123",
      authorization: "[REDACTED]",
      customer: {
        email: "[REDACTED]",
        phoneNumber: "[REDACTED]",
        deliveryAddress: "[REDACTED]",
        status: "PENDING",
      },
      provider: [{ accessToken: "[REDACTED]" }, { event: "charge.success" }],
    });
  });

  it("removes error messages and stacks while preserving the error type", () => {
    const error = new Error(
      "Provider rejected customer@example.com using token=secret",
    );

    expect(sanitizeLogValue(error)).toEqual({ errorType: "Error" });
  });

  it("serializes circular and non-JSON primitive values safely", () => {
    const circular: Record<string, unknown> = { count: BigInt(3) };
    circular.self = circular;

    expect(sanitizeLogValue(circular)).toEqual({
      count: "3",
      self: "[CIRCULAR]",
    });
  });
});
