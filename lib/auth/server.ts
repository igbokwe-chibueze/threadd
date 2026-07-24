import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { getAuthSecret } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { getEmailPreviewToken } from "@/lib/email/preview-context";
import { getPreviewTokenFromCookieHeader } from "@/lib/email/preview-access";
import { emailService } from "@/lib/email/service";
import {
  createPasswordResetEmail,
  createVerificationEmail,
} from "@/features/email/templates/authentication";

export const auth = betterAuth({
  appName: "THREADD",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  trustedOrigins: [
    new URL(process.env.BETTER_AUTH_URL ?? "http://localhost:3000").origin,
  ],
  secret: getAuthSecret(),
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url }, request) => {
      const message = createPasswordResetEmail(user.name, url);

      await emailService.send({
        recipientEmail: user.email,
        recipientUserId: user.id,
        subject: message.subject,
        textBody: message.textBody,
        kind: "PASSWORD_RESET",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        previewAccessToken:
          getEmailPreviewToken() ??
          getPreviewTokenFromCookieHeader(
            request?.headers.get("cookie") ?? null,
          ),
      });
    },
  },
  emailVerification: {
    expiresIn: 60 * 60,
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }, request) => {
      const message = createVerificationEmail(user.name, url);

      await emailService.send({
        recipientEmail: user.email,
        recipientUserId: user.id,
        subject: message.subject,
        textBody: message.textBody,
        kind: "EMAIL_VERIFICATION",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        previewAccessToken:
          getEmailPreviewToken() ??
          getPreviewTokenFromCookieHeader(
            request?.headers.get("cookie") ?? null,
          ),
      });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: false,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: ["CUSTOMER", "ADMIN", "SUPER_ADMIN"],
        required: false,
        defaultValue: "CUSTOMER",
        input: false,
      },
      isDemoAccount: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
        returned: false,
      },
    },
  },
  advanced: {
    cookiePrefix: "threadd",
    useSecureCookies: process.env.NODE_ENV === "production",
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
  },
  plugins: [nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;
