import { describe, expect, it } from "vitest";

import { parseServerEnvironment } from "@/lib/env/schema";

describe("server environment", () => {
  it("provides safe demo defaults", () => {
    const environment = parseServerEnvironment({});

    expect(environment.APP_ENV).toBe("development");
    expect(environment.STORE_MODE).toBe("commerce");
    expect(environment.EMAIL_PROVIDER).toBe("demo_outbox");
    expect(environment.DEMO_MODE).toBe(true);
    expect(environment.DEPLOYMENT_MODE).toBe("local");
  });

  it("rejects an invalid application URL", () => {
    expect(() =>
      parseServerEnvironment({ APP_URL: "not-a-url" }),
    ).toThrowError();
  });

  it("refuses demo mode on a customer deployment", () => {
    expect(() =>
      parseServerEnvironment({
        DEPLOYMENT_MODE: "customer",
        DEMO_MODE: "true",
      }),
    ).toThrowError(/Customer deployments cannot enable demo mode/);
  });

  it("requires the private outbox in demo mode", () => {
    expect(() =>
      parseServerEnvironment({
        DEPLOYMENT_MODE: "portfolio_demo",
        DEMO_MODE: "true",
        EMAIL_PROVIDER: "resend",
      }),
    ).toThrowError(/Demo mode must use the private Demo Outbox/);
  });

  it("requires demo mode on a portfolio demo deployment", () => {
    expect(() =>
      parseServerEnvironment({
        DEPLOYMENT_MODE: "portfolio_demo",
        DEMO_MODE: "false",
      }),
    ).toThrowError(/Portfolio demo deployments must enable demo mode/);
  });
});
