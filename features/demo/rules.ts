import { createHash, timingSafeEqual } from "node:crypto";

export type DemoResetConfiguration = Readonly<{
  deploymentMode: "local" | "portfolio_demo" | "customer";
  demoMode: boolean;
  providedSecret: string;
  resetSecret?: string;
  databaseUrl?: string;
  demoDatabaseUrl?: string;
  emailProvider: "demo_outbox" | "resend";
  paystackSecret?: string;
  opayEnabled: boolean;
}>;

export class DemoSafetyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DemoSafetyError";
  }
}

function equalSecret(actual: string, expected: string): boolean {
  const actualHash = createHash("sha256").update(actual).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(actualHash, expectedHash);
}

export function assertSafeDemoReset(
  configuration: DemoResetConfiguration,
): void {
  if (
    configuration.deploymentMode !== "portfolio_demo" ||
    !configuration.demoMode
  ) {
    throw new DemoSafetyError(
      "Reset is available only on an explicit portfolio demo deployment.",
    );
  }

  if (
    !configuration.resetSecret ||
    !equalSecret(configuration.providedSecret, configuration.resetSecret)
  ) {
    throw new DemoSafetyError("The reset credential is invalid.");
  }

  if (
    !configuration.databaseUrl ||
    !configuration.demoDatabaseUrl ||
    configuration.databaseUrl !== configuration.demoDatabaseUrl
  ) {
    throw new DemoSafetyError(
      "The active database is not the explicitly assigned demo database.",
    );
  }

  if (
    configuration.emailProvider !== "demo_outbox" ||
    !configuration.paystackSecret?.startsWith("sk_test_") ||
    configuration.opayEnabled
  ) {
    throw new DemoSafetyError(
      "Demo reset requires local email, Paystack test mode, and OPay disabled.",
    );
  }
}
