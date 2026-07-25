/**
 * THREADD deployment preflight
 *
 * This script validates controls that application startup alone cannot prove:
 * an operator has named the monitoring recipient, configured backup retention,
 * and recorded a completed restore exercise. It never prints environment
 * values because those values can contain infrastructure names or credentials.
 *
 * Usage:
 *   npm run deployment:check
 *
 * Run this with the exact encrypted environment assigned to the target
 * deployment. A passing local shell with different variables is not evidence
 * that the hosted environment is safe.
 */
import { loadEnvConfig } from "@next/env";
import { z } from "zod";

import { parseServerEnvironment } from "../../lib/env/schema";

loadEnvConfig(process.cwd());

const operationalReadinessSchema = z.object({
  APP_ENV: z.literal("production", {
    error: "Deployment preflight must run with APP_ENV=production.",
  }),
  DEPLOYMENT_MODE: z.enum(["portfolio_demo", "customer"], {
    error: "Deployment preflight cannot approve a local deployment.",
  }),
  MONITORING_OWNER: z.string().trim().min(1, {
    error: "Name the active monitoring owner.",
  }),
  BACKUP_PROVIDER: z.string().trim().min(1, {
    error: "Record the managed database backup provider.",
  }),
  BACKUP_RETENTION_DAYS: z.coerce.number().int().positive({
    error: "Backup retention must be a positive whole number of days.",
  }),
  LAST_RESTORE_TEST_AT: z.iso.datetime({
    error: "Record the latest successful restore test as an ISO timestamp.",
  }),
});

function fail(message: string): never {
  console.error(`Deployment preflight failed: ${message}`);
  process.exit(1);
}

try {
  /*
   * Reuse the application's environment parser first. This covers HTTPS,
   * authentication origin/secret, strict database TLS, demo isolation, email,
   * and managed-media rules without duplicating them in an operations script.
   */
  parseServerEnvironment(process.env);

  const readiness = operationalReadinessSchema.parse(process.env);
  const restoreTestAt = new Date(readiness.LAST_RESTORE_TEST_AT);

  if (restoreTestAt.getTime() > Date.now()) {
    fail("LAST_RESTORE_TEST_AT cannot be in the future.");
  }

  /*
   * Output only control state, never values. Provider names, owner identities,
   * connection strings, secrets, and exact infrastructure details stay in the
   * deployment's protected operational record.
   */
  console.info(
    [
      "Deployment preflight passed.",
      `Mode: ${readiness.DEPLOYMENT_MODE}.`,
      "HTTPS/auth/database isolation: validated.",
      "Monitoring ownership: recorded.",
      "Backup retention: recorded.",
      "Restore exercise: recorded.",
    ].join(" "),
  );
} catch (error) {
  if (error instanceof z.ZodError) {
    fail(error.issues.map((issue) => issue.message).join(" "));
  }

  fail("an unexpected validation error occurred.");
}
