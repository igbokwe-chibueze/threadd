import "server-only";

import { assertSafeDemoReset, DemoSafetyError } from "@/features/demo/rules";
import { serverEnvironment } from "@/lib/env/server";

export { DemoSafetyError };

export function isDemoDeployment(): boolean {
  return (
    serverEnvironment.DEMO_MODE &&
    serverEnvironment.DEPLOYMENT_MODE !== "customer"
  );
}

export function assertDemoResetAllowed(providedSecret: string): void {
  assertSafeDemoReset({
    deploymentMode: serverEnvironment.DEPLOYMENT_MODE,
    demoMode: serverEnvironment.DEMO_MODE,
    providedSecret,
    resetSecret: serverEnvironment.DEMO_RESET_SECRET,
    databaseUrl: process.env.DATABASE_URL,
    demoDatabaseUrl: serverEnvironment.DEMO_DATABASE_URL,
    emailProvider: serverEnvironment.EMAIL_PROVIDER,
    paystackSecret: process.env.PAYSTACK_SECRET_KEY,
    opayEnabled: process.env.OPAY_ENABLED === "true",
  });
}
