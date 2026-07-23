import { PrismaPg } from "@prisma/adapter-pg";
import { loadEnvConfig } from "@next/env";
import { hashPassword } from "better-auth/crypto";
import { z } from "zod";

import {
  AuditOutcome,
  PrismaClient,
  UserRole,
} from "../generated/prisma/client";

loadEnvConfig(process.cwd());

const bootstrapEnvironmentSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DEMO_MODE: z.literal("false"),
  ALLOW_SUPER_ADMIN_BOOTSTRAP: z.literal("true"),
  SUPER_ADMIN_EMAIL: z.email(),
  SUPER_ADMIN_NAME: z.string().trim().min(2).max(100),
  SUPER_ADMIN_PASSWORD: z
    .string()
    .min(14)
    .regex(/[a-z]/, "Password must contain a lowercase letter.")
    .regex(/[A-Z]/, "Password must contain an uppercase letter.")
    .regex(/[0-9]/, "Password must contain a number.")
    .regex(/[^a-zA-Z0-9]/, "Password must contain a symbol."),
});

const environment = bootstrapEnvironmentSchema.parse(process.env);
const adapter = new PrismaPg({
  connectionString: environment.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function bootstrapSuperAdmin(): Promise<void> {
  const email = environment.SUPER_ADMIN_EMAIL.toLowerCase();
  const existingSuperAdmin = await prisma.user.findFirst({
    where: {
      role: UserRole.SUPER_ADMIN,
      email: { not: email },
    },
    select: { email: true },
  });

  if (existingSuperAdmin) {
    throw new Error(
      `A different super-administrator already exists (${existingSuperAdmin.email}). Refusing to create another through bootstrap.`,
    );
  }

  const password = await hashPassword(environment.SUPER_ADMIN_PASSWORD);

  await prisma.$transaction(async (transaction) => {
    const user = await transaction.user.upsert({
      where: { email },
      update: {
        name: environment.SUPER_ADMIN_NAME,
        role: UserRole.SUPER_ADMIN,
        emailVerified: true,
        isDemoAccount: false,
      },
      create: {
        name: environment.SUPER_ADMIN_NAME,
        email,
        role: UserRole.SUPER_ADMIN,
        emailVerified: true,
        isDemoAccount: false,
      },
    });

    await transaction.account.upsert({
      where: {
        providerId_accountId: {
          providerId: "credential",
          accountId: user.id,
        },
      },
      update: { password },
      create: {
        providerId: "credential",
        accountId: user.id,
        userId: user.id,
        password,
      },
    });

    await transaction.auditLog.create({
      data: {
        actorId: user.id,
        action: "SUPER_ADMIN_BOOTSTRAPPED",
        resourceType: "User",
        resourceId: user.id,
        outcome: AuditOutcome.SUCCESS,
        metadata: {
          source: "server_cli",
        },
      },
    });
  });

  console.info(`THREADD super-administrator is ready: ${email}`);
}

bootstrapSuperAdmin()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
