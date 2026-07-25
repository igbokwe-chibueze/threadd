import { z } from "zod";

/*
 * Empty environment assignments are common in example files and hosting
 * dashboards. Normalize them to `undefined` so an empty value cannot satisfy
 * an optional operational control accidentally.
 */
const optionalPositiveInteger = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.coerce.number().int().positive().optional(),
);

const deploymentReadinessSchema = z
  .object({
    APP_ENV: z.literal("production", {
      error: "Deployment preflight must run with APP_ENV=production.",
    }),
    DEPLOYMENT_MODE: z.enum(["portfolio_demo", "customer"], {
      error: "Deployment preflight cannot approve a local deployment.",
    }),
    MONITORING_OWNER: z.string().trim().min(1, {
      error: "Name the active monitoring owner.",
    }),
    RECOVERY_STRATEGY: z.enum(["canonical_reseed", "managed_backup"], {
      error:
        "Record either canonical_reseed or managed_backup as the recovery strategy.",
    }),
    BACKUP_PROVIDER: z.string().trim().min(1).optional(),
    BACKUP_RETENTION_DAYS: optionalPositiveInteger,
    LAST_RESTORE_TEST_AT: z.iso.datetime().optional(),
  })
  .superRefine((readiness, context) => {
    /*
     * Canonical reseeding is intentionally limited to the disposable portfolio
     * deployment. Customer orders, payments, inventory, and personal data must
     * never be treated as recreatable seed content.
     */
    if (
      readiness.RECOVERY_STRATEGY === "canonical_reseed" &&
      readiness.DEPLOYMENT_MODE !== "portfolio_demo"
    ) {
      context.addIssue({
        code: "custom",
        path: ["RECOVERY_STRATEGY"],
        message:
          "Customer deployments require managed backups and cannot use canonical reseeding.",
      });
    }

    if (readiness.RECOVERY_STRATEGY === "managed_backup") {
      if (!readiness.BACKUP_PROVIDER) {
        context.addIssue({
          code: "custom",
          path: ["BACKUP_PROVIDER"],
          message: "Record the managed database backup provider.",
        });
      }

      if (!readiness.BACKUP_RETENTION_DAYS) {
        context.addIssue({
          code: "custom",
          path: ["BACKUP_RETENTION_DAYS"],
          message: "Backup retention must be a positive whole number of days.",
        });
      }

      if (!readiness.LAST_RESTORE_TEST_AT) {
        context.addIssue({
          code: "custom",
          path: ["LAST_RESTORE_TEST_AT"],
          message:
            "Record the latest successful restore test as an ISO timestamp.",
        });
      }
    }
  });

export type DeploymentReadiness = z.infer<typeof deploymentReadinessSchema>;

export function parseDeploymentReadiness(
  source: Record<string, string | undefined>,
  now: Date = new Date(),
): DeploymentReadiness {
  const readiness = deploymentReadinessSchema.parse(source);

  if (
    readiness.LAST_RESTORE_TEST_AT &&
    new Date(readiness.LAST_RESTORE_TEST_AT).getTime() > now.getTime()
  ) {
    throw new Error("LAST_RESTORE_TEST_AT cannot be in the future.");
  }

  return readiness;
}
