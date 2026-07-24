import { describe, expect, it } from "vitest";

import {
  calculateStockAfter,
  stockAdjustmentSchema,
} from "@/features/inventory/validation";

describe("inventory rules", () => {
  it("calculates valid stock adjustments", () => {
    expect(calculateStockAfter(5, 3)).toBe(8);
    expect(calculateStockAfter(5, -5)).toBe(0);
  });

  it("rejects adjustments that make stock negative", () => {
    expect(() => calculateStockAfter(2, -3)).toThrow(/negative/);
  });

  it("requires a useful adjustment reason", () => {
    expect(
      stockAdjustmentSchema.safeParse({
        direction: "ADD",
        quantity: 2,
        reason: "test",
      }).success,
    ).toBe(false);
  });
});
