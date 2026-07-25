/**
 * Builds the Better Auth rate-limit policy.
 *
 * The boolean is supplied from validated server environment state so this
 * otherwise pure configuration can be tested without importing secrets,
 * database clients, or the server-only authentication instance.
 */
export function createAuthRateLimitPolicy(isTestEnvironment: boolean) {
  return {
    enabled: !isTestEnvironment,
    storage: "database" as const,
    /*
     * Better Auth's database cleanup retains rows for the global window. Keep
     * it at least as long as the strictest custom rule so a shorter generic
     * cleanup cannot erase a 15-minute recovery bucket prematurely.
     */
    window: 15 * 60,
    max: 120,
    customRules: {
      "/sign-in/email": { window: 60, max: 10 },
      "/sign-up/email": { window: 60 * 60, max: 5 },
      "/request-password-reset": { window: 15 * 60, max: 5 },
      "/send-verification-email": { window: 15 * 60, max: 5 },
      "/change-password": { window: 15 * 60, max: 5 },
      "/change-email": { window: 15 * 60, max: 5 },
    },
  };
}
