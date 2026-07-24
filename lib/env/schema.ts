import { z } from "zod";

const booleanFromString = z
  .enum(["true", "false"])
  .default("true")
  .transform((value) => value === "true");

const serverEnvironmentSchema = z
  .object({
    APP_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    APP_URL: z.url().default("http://localhost:3000"),
    STORE_MODE: z.enum(["catalogue", "commerce"]).default("commerce"),
    DEPLOYMENT_MODE: z
      .enum(["local", "portfolio_demo", "customer"])
      .default("local"),
    DEMO_MODE: booleanFromString,
    DEMO_DATABASE_URL: z.string().min(1).optional(),
    DEMO_RESET_SECRET: z.string().min(32).optional(),
    EMAIL_PROVIDER: z.enum(["demo_outbox", "resend"]).default("demo_outbox"),
    BETTER_AUTH_SECRET: z.string().min(32).optional(),
    BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
  })
  .superRefine((environment, context) => {
    if (
      environment.DEPLOYMENT_MODE === "portfolio_demo" &&
      !environment.DEMO_MODE
    ) {
      context.addIssue({
        code: "custom",
        path: ["DEMO_MODE"],
        message: "Portfolio demo deployments must enable demo mode.",
      });
    }

    if (environment.DEPLOYMENT_MODE === "customer" && environment.DEMO_MODE) {
      context.addIssue({
        code: "custom",
        path: ["DEMO_MODE"],
        message: "Customer deployments cannot enable demo mode.",
      });
    }

    if (environment.DEMO_MODE && environment.EMAIL_PROVIDER !== "demo_outbox") {
      context.addIssue({
        code: "custom",
        path: ["EMAIL_PROVIDER"],
        message: "Demo mode must use the private Demo Outbox.",
      });
    }
  });

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

export function parseServerEnvironment(
  source: Record<string, string | undefined>,
): ServerEnvironment {
  return serverEnvironmentSchema.parse(source);
}
