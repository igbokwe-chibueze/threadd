import { describe, expect, it } from "vitest";

import { buildSecurityHeaders, securityHeaders } from "@/lib/security/headers";

describe("security headers", () => {
  const headers = new Map(
    securityHeaders.map(({ key, value }) => [key.toLowerCase(), value]),
  );

  it("sets browser isolation and content-sniffing protections", () => {
    expect(headers.get("x-content-type-options")).toBe("nosniff");
    expect(headers.get("x-frame-options")).toBe("DENY");
    expect(headers.get("referrer-policy")).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(headers.get("permissions-policy")).toContain("camera=()");
    expect(headers.get("cross-origin-opener-policy")).toBe("same-origin");
  });

  it("restricts active content, framing, objects, and form targets", () => {
    const policy = headers.get("content-security-policy");

    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("base-uri 'self'");
    expect(policy).toContain("form-action 'self'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).not.toContain("https:");
  });

  it("enforces transport security only in production", () => {
    const productionHeaders = new Map(
      buildSecurityHeaders("production").map(({ key, value }) => [
        key.toLowerCase(),
        value,
      ]),
    );
    const developmentHeaders = new Map(
      buildSecurityHeaders("development").map(({ key, value }) => [
        key.toLowerCase(),
        value,
      ]),
    );

    expect(productionHeaders.get("strict-transport-security")).toBe(
      "max-age=31536000; includeSubDomains",
    );
    expect(productionHeaders.get("content-security-policy")).toContain(
      "upgrade-insecure-requests",
    );
    expect(developmentHeaders.has("strict-transport-security")).toBe(false);
  });
});
