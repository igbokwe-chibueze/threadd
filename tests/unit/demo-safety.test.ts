import { describe, expect, it } from "vitest";

import {
  assertSafeDemoReset,
  type DemoResetConfiguration,
} from "@/features/demo/rules";

const safeConfiguration: DemoResetConfiguration = {
  deploymentMode: "portfolio_demo",
  demoMode: true,
  providedSecret: "a-secure-reset-secret-that-is-long",
  resetSecret: "a-secure-reset-secret-that-is-long",
  databaseUrl: "postgresql://isolated/demo",
  demoDatabaseUrl: "postgresql://isolated/demo",
  emailProvider: "demo_outbox",
  paystackSecret: "sk_test_safe",
  opayEnabled: false,
};

describe("demo reset safety", () => {
  it("accepts an explicitly isolated test-only demo", () => {
    expect(() => assertSafeDemoReset(safeConfiguration)).not.toThrow();
  });

  it.each([
    { deploymentMode: "customer" as const },
    { demoMode: false },
    { providedSecret: "wrong" },
    { demoDatabaseUrl: "postgresql://production/store" },
    { emailProvider: "resend" as const },
    { paystackSecret: "sk_live_unsafe" },
    { opayEnabled: true },
  ])("refuses unsafe configuration %#", (unsafeOverride) => {
    expect(() =>
      assertSafeDemoReset({ ...safeConfiguration, ...unsafeOverride }),
    ).toThrow();
  });
});
