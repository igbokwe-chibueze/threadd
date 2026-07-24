import { describe, expect, it } from "vitest";

import { checkoutSchema } from "@/features/checkout/validation";

describe("checkout validation", () => {
  it("accepts Nigerian delivery details without accepting a client price", () => {
    const result = checkoutSchema.safeParse({
      email: "customer@example.com",
      paymentProvider: "paystack",
      recipientName: "Ada Okafor",
      phone: "+234 801 234 5678",
      addressLine1: "12 Market Road",
      addressLine2: "",
      city: "Enugu",
      state: "Enugu",
      postalCode: "",
      total: "1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect("total" in result.data).toBe(false);
    }
  });

  it("rejects incomplete contact and delivery details", () => {
    expect(
      checkoutSchema.safeParse({
        email: "not-email",
        paymentProvider: "paystack",
        recipientName: "",
        phone: "12",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
      }).success,
    ).toBe(false);
  });
});
