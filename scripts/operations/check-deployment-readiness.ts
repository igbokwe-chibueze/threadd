/**
 * THREADD deployment preflight
 *
 * This script validates controls that application startup alone cannot prove:
 * an operator has named the monitoring recipient and recorded the correct
 * recovery controls for the deployment mode. Disposable portfolio demos may
 * use canonical migration-and-reseed recovery; customer deployments still
 * require managed retention and restore evidence. It never prints environment
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

import { parseDeploymentReadiness } from "../../lib/env/deployment-readiness";
import { parseServerEnvironment } from "../../lib/env/schema";

loadEnvConfig(process.cwd());

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

  const readiness = parseDeploymentReadiness(process.env);

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
      readiness.RECOVERY_STRATEGY === "canonical_reseed"
        ? "Recovery: canonical migrations and seed selected for disposable demo."
        : "Recovery: managed backup retention and restore exercise recorded.",
    ].join(" "),
  );
} catch (error) {
  if (error instanceof z.ZodError) {
    fail(error.issues.map((issue) => issue.message).join(" "));
  }

  fail("an unexpected validation error occurred.");
}
