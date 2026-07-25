import { describe, expect, it } from "vitest";

import { parseServerEnvironment } from "@/lib/env/schema";

describe("server environment", () => {
  it("provides safe demo defaults", () => {
    const environment = parseServerEnvironment({});

    expect(environment.APP_ENV).toBe("development");
    expect(environment.STORE_MODE).toBe("commerce");
    expect(environment.EMAIL_PROVIDER).toBe("demo_outbox");
    expect(environment.DEMO_MODE).toBe(true);
    expect(environment.DEPLOYMENT_MODE).toBe("local");
    expect(environment.MEDIA_STORAGE_PROVIDER).toBe("local_demo");
  });

  it("rejects an invalid application URL", () => {
    expect(() =>
      parseServerEnvironment({ APP_URL: "not-a-url" }),
    ).toThrowError();
  });

  it("refuses demo mode on a customer deployment", () => {
    expect(() =>
      parseServerEnvironment({
        DEPLOYMENT_MODE: "customer",
        DEMO_MODE: "true",
      }),
    ).toThrowError(/Customer deployments cannot enable demo mode/);
  });

  it("requires the private outbox in demo mode", () => {
    expect(() =>
      parseServerEnvironment({
        DEPLOYMENT_MODE: "portfolio_demo",
        DEMO_MODE: "true",
        EMAIL_PROVIDER: "resend",
      }),
    ).toThrowError(/Demo mode must use the private Demo Outbox/);
  });

  it("requires demo mode on a portfolio demo deployment", () => {
    expect(() =>
      parseServerEnvironment({
        DEPLOYMENT_MODE: "portfolio_demo",
        DEMO_MODE: "false",
      }),
    ).toThrowError(/Portfolio demo deployments must enable demo mode/);
  });

  it("requires HTTPS, matching origins, and an auth secret in production", () => {
    expect(() =>
      parseServerEnvironment({
        APP_ENV: "production",
        APP_URL: "http://shop.example.com",
        BETTER_AUTH_URL: "https://auth.example.com",
      }),
    ).toThrowError();

    expect(() =>
      parseServerEnvironment({
        APP_ENV: "production",
        APP_URL: "https://shop.example.com",
        BETTER_AUTH_URL: "https://shop.example.com",
        BETTER_AUTH_SECRET: "a-production-secret-with-at-least-32-characters",
        DATABASE_URL:
          "postgresql://app:secret@db.example.com/shop?sslmode=verify-full",
      }),
    ).not.toThrow();
  });

  it("requires strict PostgreSQL certificate verification in production", () => {
    const productionEnvironment = {
      APP_ENV: "production",
      APP_URL: "https://shop.example.com",
      BETTER_AUTH_URL: "https://shop.example.com",
      BETTER_AUTH_SECRET: "a-production-secret-with-at-least-32-characters",
    };

    expect(() =>
      parseServerEnvironment({
        ...productionEnvironment,
        DATABASE_URL:
          "postgresql://app:secret@db.example.com/shop?sslmode=require",
      }),
    ).toThrowError(/sslmode=verify-full/);

    expect(() =>
      parseServerEnvironment({
        ...productionEnvironment,
        DATABASE_URL:
          "postgresql://app:secret@db.example.com/shop?sslmode=verify-full",
      }),
    ).not.toThrow();

    /*
     * Prisma Postgres issues managed proxy URLs with sslmode=require. This
     * exception must remain pinned to the exact provider hostname.
     */
    expect(() =>
      parseServerEnvironment({
        ...productionEnvironment,
        DATABASE_URL:
          "postgresql://app:secret@db.prisma.io/shop?sslmode=require",
      }),
    ).not.toThrow();

    expect(() =>
      parseServerEnvironment({
        ...productionEnvironment,
        DATABASE_URL:
          "postgresql://app:secret@pooled.db.prisma.io/shop?sslmode=require",
      }),
    ).not.toThrow();

    expect(() =>
      parseServerEnvironment({
        ...productionEnvironment,
        DATABASE_URL:
          "postgresql://app:secret@not-db.prisma.io/shop?sslmode=require",
      }),
    ).toThrowError(/sslmode=verify-full/);
  });

  it("refuses disposable local media storage for a customer deployment", () => {
    expect(() =>
      parseServerEnvironment({
        DEPLOYMENT_MODE: "customer",
        DEMO_MODE: "false",
        MEDIA_STORAGE_PROVIDER: "local_demo",
      }),
    ).toThrowError(/Customer deployments require Cloudinary catalogue storage/);

    expect(() =>
      parseServerEnvironment({
        DEPLOYMENT_MODE: "customer",
        DEMO_MODE: "false",
        MEDIA_STORAGE_PROVIDER: "cloudinary",
        CLOUDINARY_CLOUD_NAME: "threadd",
        CLOUDINARY_API_KEY: "safe-test-key",
        CLOUDINARY_API_SECRET: "safe-test-secret",
        CLOUDINARY_FOLDER: "threadd/customer-production",
      }),
    ).not.toThrow();
  });

  it("requires complete Cloudinary credentials and a safe folder", () => {
    expect(() =>
      parseServerEnvironment({
        MEDIA_STORAGE_PROVIDER: "cloudinary",
      }),
    ).toThrowError(/CLOUDINARY_CLOUD_NAME is required/);

    expect(() =>
      parseServerEnvironment({
        MEDIA_STORAGE_PROVIDER: "cloudinary",
        CLOUDINARY_CLOUD_NAME: "threadd",
        CLOUDINARY_API_KEY: "safe-test-key",
        CLOUDINARY_API_SECRET: "safe-test-secret",
        CLOUDINARY_FOLDER: "../another-tenant",
      }),
    ).toThrowError();
  });
});
