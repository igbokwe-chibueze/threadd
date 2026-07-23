import { PrismaPg } from "@prisma/adapter-pg";
import { loadEnvConfig } from "@next/env";
import { hashPassword } from "better-auth/crypto";

import { PrismaClient, UserRole } from "../generated/prisma/client";

loadEnvConfig(process.cwd());

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed THREADD.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const demoUsers = [
  {
    name: "THREADD Demo Admin",
    email: "admin@demo.threadd.store",
    password: "DemoAdmin123!",
    role: UserRole.ADMIN,
  },
  {
    name: "THREADD Demo Customer",
    email: "customer@demo.threadd.store",
    password: "DemoShopper123!",
    role: UserRole.CUSTOMER,
  },
] as const;

async function seed(): Promise<void> {
  for (const user of demoUsers) {
    const seededUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        emailVerified: true,
        isDemoAccount: true,
      },
      create: {
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: true,
        isDemoAccount: true,
      },
    });

    const password = await hashPassword(user.password);

    await prisma.account.upsert({
      where: {
        providerId_accountId: {
          providerId: "credential",
          accountId: seededUser.id,
        },
      },
      update: { password },
      create: {
        providerId: "credential",
        accountId: seededUser.id,
        userId: seededUser.id,
        password,
      },
    });
  }
}

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
