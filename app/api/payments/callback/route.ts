import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { applySuccessfulPayment } from "@/features/orders/payment-processing";
import { getPaymentProvider } from "@/features/payments/provider";
import { sendOrderConfirmation } from "@/features/orders/notifications";
import {
  createEmailPreviewToken,
  EMAIL_PREVIEW_COOKIE,
  EMAIL_PREVIEW_TTL_SECONDS,
} from "@/lib/email/preview-access";
import { db } from "@/lib/db/client";
import { serverEnvironment } from "@/lib/env/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  /*
   * Redirect destinations use the configured application origin rather than
   * the request Host header. This prevents a forged Host/X-Forwarded-Host from
   * turning the payment callback into an open redirect.
   */
  const applicationUrl = new URL(serverEnvironment.APP_URL);
  const reference = url.searchParams.get("reference");
  if (!reference) {
    return NextResponse.redirect(
      new URL("/checkout?payment=missing", applicationUrl),
    );
  }
  try {
    const payment = await db.payment.findUnique({ where: { reference } });
    if (!payment || payment.provider === "demo") {
      throw new Error("The test adapter does not accept callback completion.");
    }
    const provider = getPaymentProvider(payment.provider);
    const verification = await provider.verify(reference);
    const order = await applySuccessfulPayment(verification);
    const previewToken = order.userId ? undefined : createEmailPreviewToken();
    await sendOrderConfirmation(order.id, previewToken);
    revalidatePath("/", "layout");
    const response = NextResponse.redirect(
      new URL(`/orders/${order.id}/confirmation`, applicationUrl),
    );
    if (previewToken) {
      response.cookies.set(EMAIL_PREVIEW_COOKIE, previewToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: EMAIL_PREVIEW_TTL_SECONDS,
        path: "/",
      });
    }
    return response;
  } catch {
    return NextResponse.redirect(
      new URL("/checkout?payment=failed", applicationUrl),
    );
  }
}
