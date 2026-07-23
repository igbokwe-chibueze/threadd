import { describe, expect, it } from "vitest";

import { parseVariantRows } from "@/features/catalogue/validation";

describe("catalogue variant validation", () => {
  it("parses normalized, non-negative variants", () => {
    expect(
      parseVariantRows("thr-tee-blk-m | M | Black | #171713 | 4 | 0"),
    ).toEqual([
      {
        sku: "THR-TEE-BLK-M",
        size: "M",
        colour: "Black",
        colourHex: "#171713",
        inventoryQuantity: 4,
        priceAdjustment: 0,
      },
    ]);
  });

  it("rejects negative stock", () => {
    expect(() =>
      parseVariantRows("THR-TEE-BLK-M | M | Black | #171713 | -1 | 0"),
    ).toThrow(/non-negative/);
  });

  it("rejects duplicate size and colour combinations", () => {
    expect(() =>
      parseVariantRows(
        [
          "THR-TEE-BLK-M | M | Black | #171713 | 2 | 0",
          "THR-TEE-BLK-M-2 | M | Black | #171713 | 2 | 0",
        ].join("\n"),
      ),
    ).toThrow(/size and colour/);
  });
});
