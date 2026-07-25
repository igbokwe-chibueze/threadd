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
    DATABASE_URL: z.string().min(1).optional(),
    DEMO_RESET_SECRET: z.string().min(32).optional(),
    EMAIL_PROVIDER: z.enum(["demo_outbox", "resend"]).default("demo_outbox"),
    MEDIA_STORAGE_PROVIDER: z
      .enum(["local_demo", "cloudinary"])
      .default("local_demo"),
    CLOUDINARY_CLOUD_NAME: z.string().trim().min(1).optional(),
    CLOUDINARY_API_KEY: z.string().trim().min(1).optional(),
    CLOUDINARY_API_SECRET: z.string().trim().min(1).optional(),
    CLOUDINARY_FOLDER: z
      .string()
      .trim()
      .regex(/^[a-z0-9][a-z0-9/_-]{2,80}$/i)
      .refine((value) => !value.includes(".."))
      .optional(),
    BETTER_AUTH_SECRET: z.string().min(32).optional(),
    BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
  })
  .superRefine((environment, context) => {
    if (
      environment.APP_ENV === "production" &&
      new URL(environment.APP_URL).protocol !== "https:"
    ) {
      context.addIssue({
        code: "custom",
        path: ["APP_URL"],
        message: "Production application URLs must use HTTPS.",
      });
    }

    if (
      environment.APP_ENV === "production" &&
      new URL(environment.BETTER_AUTH_URL).protocol !== "https:"
    ) {
      context.addIssue({
        code: "custom",
        path: ["BETTER_AUTH_URL"],
        message: "Production authentication URLs must use HTTPS.",
      });
    }

    if (
      environment.APP_ENV === "production" &&
      new URL(environment.APP_URL).origin !==
        new URL(environment.BETTER_AUTH_URL).origin
    ) {
      context.addIssue({
        code: "custom",
        path: ["BETTER_AUTH_URL"],
        message:
          "Production authentication and application URLs must share an origin.",
      });
    }

    if (
      environment.APP_ENV === "production" &&
      !environment.BETTER_AUTH_SECRET
    ) {
      context.addIssue({
        code: "custom",
        path: ["BETTER_AUTH_SECRET"],
        message: "Production requires a Better Auth secret.",
      });
    }

    /*
     * Ordinary PostgreSQL connections must verify both the certificate and
     * hostname explicitly. Prisma Postgres is a managed proxy exception: its
     * provider-issued direct and pooled URLs currently use sslmode=require and
     * reject a client-side rewrite to verify-full. Keep that exception scoped
     * to the exact managed hostnames instead of weakening arbitrary database
     * connections.
     */
    if (environment.APP_ENV === "production") {
      if (!environment.DATABASE_URL) {
        context.addIssue({
          code: "custom",
          path: ["DATABASE_URL"],
          message: "Production requires a PostgreSQL database URL.",
        });
      } else {
        try {
          const databaseUrl = new URL(environment.DATABASE_URL);
          const isPostgreSqlProtocol = ["postgres:", "postgresql:"].includes(
            databaseUrl.protocol,
          );
          const sslMode = databaseUrl.searchParams.get("sslmode");
          const isManagedPrismaPostgres = [
            "db.prisma.io",
            "pooled.db.prisma.io",
          ].includes(databaseUrl.hostname);
          const hasApprovedSslMode =
            sslMode === "verify-full" ||
            (isManagedPrismaPostgres && sslMode === "require");

          if (!isPostgreSqlProtocol || !hasApprovedSslMode) {
            context.addIssue({
              code: "custom",
              path: ["DATABASE_URL"],
              message:
                "Production PostgreSQL connections must use sslmode=verify-full; provider-issued Prisma Postgres hosts may use sslmode=require.",
            });
          }
        } catch {
          context.addIssue({
            code: "custom",
            path: ["DATABASE_URL"],
            message: "Production requires a valid PostgreSQL database URL.",
          });
        }
      }
    }

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

    /*
     * Writing into public/uploads is useful for a disposable demo but is not
     * durable production storage. Fail environment validation before a
     * customer deployment can accidentally launch with that adapter.
     */
    if (
      environment.DEPLOYMENT_MODE === "customer" &&
      environment.MEDIA_STORAGE_PROVIDER !== "cloudinary"
    ) {
      context.addIssue({
        code: "custom",
        path: ["MEDIA_STORAGE_PROVIDER"],
        message: "Customer deployments require Cloudinary catalogue storage.",
      });
    }

    if (environment.MEDIA_STORAGE_PROVIDER === "cloudinary") {
      const requiredCloudinaryFields = [
        ["CLOUDINARY_CLOUD_NAME", environment.CLOUDINARY_CLOUD_NAME],
        ["CLOUDINARY_API_KEY", environment.CLOUDINARY_API_KEY],
        ["CLOUDINARY_API_SECRET", environment.CLOUDINARY_API_SECRET],
        ["CLOUDINARY_FOLDER", environment.CLOUDINARY_FOLDER],
      ] as const;

      for (const [field, value] of requiredCloudinaryFields) {
        if (!value) {
          context.addIssue({
            code: "custom",
            path: [field],
            message: `${field} is required when Cloudinary storage is selected.`,
          });
        }
      }
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
