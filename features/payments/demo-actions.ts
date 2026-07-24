"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { DemoPaymentProvider } from "@/features/payments/demo";
import { applySuccessfulPayment } from "@/features/orders/payment-processing";
import { db } from "@/lib/db/client";
import { cookies } from "next/headers";
import {
  createEmailPreviewToken,
  EMAIL_PREVIEW_COOKIE,
  EMAIL_PREVIEW_TTL_SECONDS,
} from "@/lib/email/preview-access";
import { sendOrderConfirmation } from "@/features/orders/notifications";

export async function completeDemoPaymentAction(formData: FormData) {
  const reference = String(formData.get("reference") ?? "");
  const payment = await db.payment.findUnique({
    where: { reference },
    select: { provider: true },
  });
  if (!payment || payment.provider !== "demo") {
    throw new Error("This test payment is not available.");
  }
  const verification = await new DemoPaymentProvider().verify(reference);
  const order = await applySuccessfulPayment(verification);
  const previewToken = order.userId ? undefined : createEmailPreviewToken();
  if (previewToken) {
    (await cookies()).set(EMAIL_PREVIEW_COOKIE, previewToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: EMAIL_PREVIEW_TTL_SECONDS,
      path: "/",
    });
  }
  await sendOrderConfirmation(order.id, previewToken);
  revalidatePath("/", "layout");
  redirect(`/orders/${order.id}/confirmation`);
}
