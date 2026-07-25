import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to initialize Prisma.");
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString,

    /*
     * Every Vercel function instance owns a separate node-postgres pool.
     * THREADD uses Prisma Postgres' external pooled endpoint in production, and
     * one local connection per function prevents a burst of instances from
     * multiplying the provider connection demand. Local tooling keeps pg's
     * ordinary capacity for migrations, seeding, and development.
     */
    max: process.env.VERCEL ? 1 : 10,
    connectionTimeoutMillis: 15_000,
  });

  return new PrismaClient({
    adapter,
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
