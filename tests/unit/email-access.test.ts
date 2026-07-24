import { describe, expect, it } from "vitest";

import {
  buildEmailViewerWhere,
  hashEmailPreviewToken,
} from "@/features/email/access-policy";
import {
  createPasswordResetEmail,
  createVerificationEmail,
} from "@/features/email/templates/authentication";

describe("email outbox access", () => {
  it("scopes a personal outbox to exactly one user", () => {
    expect(buildEmailViewerWhere({ userId: "customer-a" })).toEqual({
      recipientUserId: "customer-a",
      kind: { not: "ADMIN_NOTIFICATION" },
    });
  });

  it("keeps administrator notifications out of personal outboxes", () => {
    expect(buildEmailViewerWhere({ userId: "admin-a" })).toMatchObject({
      kind: { not: "ADMIN_NOTIFICATION" },
    });
  });

  it("requires the hashed guest token and a future expiry", () => {
    const now = new Date("2026-07-24T10:00:00.000Z");
    const where = buildEmailViewerWhere({ previewToken: "private-token" }, now);

    expect(where).toEqual({
      previewTokenHash: hashEmailPreviewToken("private-token"),
      previewExpiresAt: { gt: now },
      kind: { not: "ADMIN_NOTIFICATION" },
    });
    expect(where).not.toHaveProperty("previewTokenHash", "private-token");
  });

  it("denies a viewer without a session or preview token", () => {
    expect(buildEmailViewerWhere({})).toEqual({ id: "__no-access__" });
  });
});

describe("authentication email templates", () => {
  it("preserves the environment-generated verification and reset URLs", () => {
    const verificationUrl =
      "https://demo.threadd.store/verify-email?token=safe-token";
    const resetUrl =
      "https://demo.threadd.store/reset-password?token=safe-token";

    expect(createVerificationEmail("Ada", verificationUrl).textBody).toContain(
      verificationUrl,
    );
    expect(createPasswordResetEmail("Ada", resetUrl).textBody).toContain(
      resetUrl,
    );
  });

  it("produces plain text even when a name contains markup", () => {
    const message = createVerificationEmail(
      "<script>alert(1)</script>",
      "https://demo.threadd.store/verify-email?token=safe-token",
    );

    expect(message.textBody).not.toContain("<html");
    expect(message.textBody).not.toContain("<body");
  });
});
