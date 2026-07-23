import { z } from "zod";

const booleanFromString = z
  .enum(["true", "false"])
  .default("true")
  .transform((value) => value === "true");

const serverEnvironmentSchema = z.object({
  APP_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.url().default("http://localhost:3000"),
  STORE_MODE: z.enum(["catalogue", "commerce"]).default("commerce"),
  DEMO_MODE: booleanFromString,
  EMAIL_PROVIDER: z.enum(["demo_outbox", "resend"]).default("demo_outbox"),
  BETTER_AUTH_SECRET: z.string().min(32).optional(),
  BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
});

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

export function parseServerEnvironment(
  source: Record<string, string | undefined>,
): ServerEnvironment {
  return serverEnvironmentSchema.parse(source);
}
