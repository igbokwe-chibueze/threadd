"use server";

import { createHmac } from "node:crypto";

import { cookies, headers } from "next/headers";

import { Prisma } from "@/generated/prisma/client";
import { getCurrentSession } from "@/features/auth/authorization";
import {
  createAdminEnquiryEmail,
  createEnquiryConfirmationEmail,
} from "@/features/email/templates/enquiries";
import { publicEnquirySchema } from "@/features/enquiries/validation";
import { db } from "@/lib/db/client";
import {
  createEmailPreviewToken,
  EMAIL_PREVIEW_COOKIE,
  EMAIL_PREVIEW_TTL_SECONDS,
} from "@/lib/email/preview-access";
import { emailService } from "@/lib/email/service";
import { logger } from "@/lib/logging/logger";

export type EnquiryActionState = Readonly<{
  error?: string;
  success?: string;
  reference?: string;
  outboxUrl?: string;
}>;

async function getRequestFingerprint() {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0];
  const ip = forwardedFor?.trim() || requestHeaders.get("x-real-ip") || "local";
  const secret =
    process.env.BETTER_AUTH_SECRET ??
    "threadd-development-enquiry-rate-limit-secret";

  return createHmac("sha256", secret).update(ip).digest("hex");
}

export async function submitEnquiryAction(
  _previousState: EnquiryActionState,
  formData: FormData,
): Promise<EnquiryActionState> {
  if (String(formData.get("companyWebsite") ?? "").trim()) {
    return { success: "Thanks — your message has been received." };
  }

  const result = publicEnquirySchema.safeParse({
    kind: formData.get("kind"),
    productId: String(formData.get("productId") ?? "") || undefined,
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    message: formData.get("message"),
  });

  if (!result.success) {
    return {
      error:
        result.error.issues[0]?.message ??
        "Please check the form and try again.",
    };
  }

  const session = await getCurrentSession();
  const ipHash = await getRequestFingerprint();
  const cutoff = new Date(Date.now() - 60 * 60 * 1_000);
  /*
   * Count and insertion share a serializable transaction. Keeping them
   * separate would allow a burst of concurrent requests to observe the same
   * stale count and all pass before any enquiry was inserted.
   *
   * PostgreSQL may cancel one participant to preserve serializability. Retry
   * that transaction once; the second read then observes the winning insert.
   */
  const createRateLimitedEnquiry = () =>
    db.$transaction(
      async (tx) => {
        const [ipCount, emailCount] = await Promise.all([
          tx.enquiry.count({
            where: { ipHash, createdAt: { gte: cutoff } },
          }),
          tx.enquiry.count({
            where: { email: result.data.email, createdAt: { gte: cutoff } },
          }),
        ]);

        if (ipCount >= 8 || emailCount >= 4) {
          return { outcome: "RATE_LIMITED" as const };
        }

        const product =
          result.data.kind === "PRODUCT"
            ? await tx.product.findFirst({
                where: { id: result.data.productId, status: "ACTIVE" },
                select: { id: true, name: true, slug: true },
              })
            : null;

        if (result.data.kind === "PRODUCT" && !product) {
          return { outcome: "PRODUCT_UNAVAILABLE" as const };
        }

        const enquiry = await tx.enquiry.create({
          data: {
            kind: result.data.kind,
            name: result.data.name,
            email: result.data.email,
            phone: result.data.phone,
            message: result.data.message,
            productId: product?.id,
            customerId: session?.user.id,
            ipHash,
            statusHistory: {
              create: { toStatus: "NEW", reason: "Enquiry received" },
            },
          },
          select: { id: true },
        });
        return { outcome: "CREATED" as const, enquiry, product };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5_000,
        timeout: 10_000,
      },
    );

  let stored;
  try {
    stored = await createRateLimitedEnquiry();
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      stored = await createRateLimitedEnquiry();
    } else {
      throw error;
    }
  }

  if (stored.outcome === "RATE_LIMITED") {
    return {
      error:
        "You have sent several messages recently. Please wait a while before trying again.",
    };
  }
  if (stored.outcome === "PRODUCT_UNAVAILABLE") {
    return {
      error:
        "This product is no longer available. Please refresh and try again.",
    };
  }
  const { enquiry, product } = stored;

  const reference = `ENQ-${enquiry.id.slice(-8).toUpperCase()}`;
  const appUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  const productUrl = product ? `${appUrl}/products/${product.slug}` : undefined;
  const previewToken = session ? undefined : createEmailPreviewToken();

  if (previewToken) {
    (await cookies()).set(EMAIL_PREVIEW_COOKIE, previewToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: EMAIL_PREVIEW_TTL_SECONDS,
      path: "/",
    });
  }

  const customerMessage = createEnquiryConfirmationEmail({
    reference,
    name: result.data.name,
    message: result.data.message,
    productName: product?.name,
    productUrl,
  });
  const adminMessage = createAdminEnquiryEmail({
    reference,
    name: result.data.name,
    email: result.data.email,
    phone: result.data.phone,
    message: result.data.message,
    productName: product?.name,
    productUrl,
  });
  const adminEmail =
    process.env.ADMIN_NOTIFICATION_EMAIL ?? "admin@demo.threadd.store";
  const admin = await db.user.findUnique({
    where: { email: adminEmail },
    select: { id: true },
  });
  const deliveries = await Promise.allSettled([
    emailService.send({
      recipientEmail: result.data.email,
      recipientUserId: session?.user.id,
      subject: customerMessage.subject,
      textBody: customerMessage.textBody,
      kind: "ENQUIRY_CONFIRMATION",
      previewAccessToken: previewToken,
    }),
    emailService.send({
      recipientEmail: adminEmail,
      recipientUserId: admin?.id,
      subject: adminMessage.subject,
      textBody: adminMessage.textBody,
      kind: "ADMIN_NOTIFICATION",
    }),
  ]);
  const now = new Date();
  const failed = deliveries
    .map((delivery, index) =>
      delivery.status === "rejected"
        ? index === 0
          ? "customer"
          : "admin"
        : "",
    )
    .filter(Boolean);

  await db.enquiry.update({
    where: { id: enquiry.id },
    data: {
      customerNotifiedAt:
        deliveries[0].status === "fulfilled" ? now : undefined,
      adminNotifiedAt: deliveries[1].status === "fulfilled" ? now : undefined,
      notificationError: failed.length ? failed.join(",") : null,
    },
  });

  if (failed.length) {
    logger.warn("Enquiry stored but a preview could not be created.", {
      enquiryId: enquiry.id,
      failedDeliveries: failed,
    });
  }

  return {
    success: "Thanks — your message is now in the THREADD inbox.",
    reference,
    outboxUrl: "/demo-outbox",
  };
}
