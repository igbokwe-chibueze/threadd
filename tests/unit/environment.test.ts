import { describe, expect, it } from "vitest";

import { parseServerEnvironment } from "@/lib/env/schema";

describe("server environment", () => {
  it("provides safe demo defaults", () => {
    const environment = parseServerEnvironment({});

    expect(environment.APP_ENV).toBe("development");
    expect(environment.STORE_MODE).toBe("commerce");
    expect(environment.EMAIL_PROVIDER).toBe("demo_outbox");
    expect(environment.DEMO_MODE).toBe(true);
  });

  it("rejects an invalid application URL", () => {
    expect(() =>
      parseServerEnvironment({ APP_URL: "not-a-url" }),
    ).toThrowError();
  });
});
