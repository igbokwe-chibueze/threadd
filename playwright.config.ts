import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3200",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    /*
     * Never reuse port 3000 here. A developer may be running THREADD with real
     * test-provider credentials, which would make automated checkout navigate
     * to a hosted gateway and mutate non-test-isolated state. Port 3200 and a
     * separate Next output directory give Playwright an owned server with a
     * deterministic configuration.
     */
    command:
      "node node_modules/next/dist/bin/next dev --hostname localhost --port 3200",
    url: "http://localhost:3200",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      APP_ENV: "test",
      APP_URL: "http://localhost:3200",
      BETTER_AUTH_URL: "http://localhost:3200",
      NEXT_DIST_DIR: ".next-e2e",

      /*
       * Non-placeholder, non-provider values prevent Next's environment loader
       * from replacing these entries with local credentials. The application
       * then selects its internal DemoPaymentProvider, which performs no
       * external network request and still exercises payment finalization.
       */
      PAYSTACK_SECRET_KEY: "disabled-for-e2e",
      NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: "disabled-for-e2e",
      OPAY_ENABLED: "false",
    },
  },
});
