import { describe, expect, it } from "vitest";

import { safeReturnTo } from "@/features/auth/return-to";

describe("post-authentication return paths", () => {
  it("preserves a local checkout path", () => {
    expect(safeReturnTo("/checkout")).toBe("/checkout");
  });

  it("rejects external and malformed destinations", () => {
    expect(safeReturnTo("//malicious.example")).toBe("/account");
    expect(safeReturnTo("https://malicious.example")).toBe("/account");
    expect(safeReturnTo("/\\malicious.example")).toBe("/account");
  });
});
