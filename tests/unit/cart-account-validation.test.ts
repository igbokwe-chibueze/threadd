import { describe, expect, it } from "vitest";

import { addressSchema } from "@/features/account/validation";
import {
  addCartItemSchema,
  updateCartItemSchema,
} from "@/features/cart/validation";

describe("cart validation", () => {
  it("accepts only bounded integer quantities", () => {
    expect(
      addCartItemSchema.safeParse({ variantId: "variant-1", quantity: "2" })
        .success,
    ).toBe(true);
    expect(
      addCartItemSchema.safeParse({ variantId: "variant-1", quantity: "99" })
        .success,
    ).toBe(false);
    expect(
      updateCartItemSchema.safeParse({ itemId: "item-1", quantity: "-1" })
        .success,
    ).toBe(false);
  });
});

describe("address validation", () => {
  it("normalizes optional fields and validates Nigerian delivery details", () => {
    const result = addressSchema.safeParse({
      label: "Home",
      recipientName: "Ada Okafor",
      phone: "+234 801 234 5678",
      line1: "12 Market Road",
      line2: "",
      city: "Enugu",
      state: "Enugu",
      postalCode: "",
      isDefault: "on",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.line2).toBeUndefined();
      expect(result.data.isDefault).toBe(true);
    }
  });

  it("treats an omitted default checkbox as false", () => {
    const result = addressSchema.parse({
      label: "Office",
      recipientName: "Ada Okafor",
      phone: "08012345678",
      line1: "12 Market Road",
      line2: "",
      city: "Enugu",
      state: "Enugu",
      postalCode: "",
    });
    expect(result.isDefault).toBe(false);
  });
});
