import { describe, expect, it } from "vitest";

import { parseDeploymentReadiness } from "@/lib/env/deployment-readiness";

const NOW = new Date("2026-07-25T12:00:00.000Z");

describe("deployment operational readiness", () => {
  it("accepts canonical reseeding only for the disposable portfolio demo", () => {
    expect(() =>
      parseDeploymentReadiness(
        {
          APP_ENV: "production",
          DEPLOYMENT_MODE: "portfolio_demo",
          MONITORING_OWNER: "portfolio-owner",
          RECOVERY_STRATEGY: "canonical_reseed",
        },
        NOW,
      ),
    ).not.toThrow();

    expect(() =>
      parseDeploymentReadiness(
        {
          APP_ENV: "production",
          DEPLOYMENT_MODE: "customer",
          MONITORING_OWNER: "merchant-operations",
          RECOVERY_STRATEGY: "canonical_reseed",
        },
        NOW,
      ),
    ).toThrowError(/Customer deployments require managed backups/);
  });

  it("requires complete managed-backup evidence for customer deployments", () => {
    const customer = {
      APP_ENV: "production",
      DEPLOYMENT_MODE: "customer",
      MONITORING_OWNER: "merchant-operations",
      RECOVERY_STRATEGY: "managed_backup",
    };

    expect(() => parseDeploymentReadiness(customer, NOW)).toThrowError(
      /managed database backup provider/,
    );

    expect(() =>
      parseDeploymentReadiness(
        {
          ...customer,
          BACKUP_PROVIDER: "approved-managed-provider",
          BACKUP_RETENTION_DAYS: "30",
          LAST_RESTORE_TEST_AT: "2026-07-24T12:00:00.000Z",
        },
        NOW,
      ),
    ).not.toThrow();
  });

  it("rejects future restore evidence and missing monitoring ownership", () => {
    expect(() =>
      parseDeploymentReadiness(
        {
          APP_ENV: "production",
          DEPLOYMENT_MODE: "portfolio_demo",
          MONITORING_OWNER: "",
          RECOVERY_STRATEGY: "canonical_reseed",
        },
        NOW,
      ),
    ).toThrowError(/monitoring owner/);

    expect(() =>
      parseDeploymentReadiness(
        {
          APP_ENV: "production",
          DEPLOYMENT_MODE: "customer",
          MONITORING_OWNER: "merchant-operations",
          RECOVERY_STRATEGY: "managed_backup",
          BACKUP_PROVIDER: "approved-managed-provider",
          BACKUP_RETENTION_DAYS: "30",
          LAST_RESTORE_TEST_AT: "2026-07-26T12:00:00.000Z",
        },
        NOW,
      ),
    ).toThrowError(/cannot be in the future/);
  });
});
