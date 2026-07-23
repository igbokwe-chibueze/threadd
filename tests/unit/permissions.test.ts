import { describe, expect, it } from "vitest";

import {
  canAccessAdmin,
  canManageAdministrators,
} from "@/features/auth/permissions";

describe("authentication permissions", () => {
  it("allows normal administrators into the studio without owner controls", () => {
    expect(canAccessAdmin("ADMIN")).toBe(true);
    expect(canManageAdministrators("ADMIN")).toBe(false);
  });

  it("reserves administrator management for the super-administrator", () => {
    expect(canManageAdministrators("SUPER_ADMIN")).toBe(true);
    expect(canAccessAdmin("CUSTOMER")).toBe(false);
  });
});
