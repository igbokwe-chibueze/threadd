import { describe, expect, it } from "vitest";

import { createAuthRateLimitPolicy } from "@/features/auth/rate-limit-policy";

describe("authentication rate-limit policy", () => {
  it("uses shared database storage and enables production-facing throttles", () => {
    const policy = createAuthRateLimitPolicy(false);

    expect(policy.enabled).toBe(true);
    expect(policy.storage).toBe("database");
    expect(policy.customRules["/sign-in/email"]).toEqual({
      window: 60,
      max: 10,
    });
  });

  it("applies stricter limits to password recovery and verification delivery", () => {
    const policy = createAuthRateLimitPolicy(false);

    expect(policy.customRules["/request-password-reset"]).toEqual({
      window: 900,
      max: 5,
    });
    expect(policy.customRules["/send-verification-email"]).toEqual({
      window: 900,
      max: 5,
    });
  });

  it("disables throttling only in the validated automated-test environment", () => {
    expect(createAuthRateLimitPolicy(true).enabled).toBe(false);
  });
});
