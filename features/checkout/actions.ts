"use server";

import { randomBytes } from "node:crypto";

import { redirect } from "next/navigation";

import { getCurrentSession } from "@/features/auth/authorization";
import { findCurrentCart, cartTotals } from "@/features/cart/service";
import { checkoutSchema } from "@/features/checkout/validation";
import { getPaymentProvider } from "@/features/payments/provider";
import { decimalNairaToKobo } from "@/features/payments/money";
import { getShippingQuote } from "@/features/shipping/zones";
import { db } from "@/lib/db/client";

export type CheckoutActionState = { error?: string };

function reference(prefix: string) {
  return `${prefix}-${Date.now()}-${randomBytes(6).toString("hex")}`;
}

export async function beginCheckoutAction(
  _state: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  const result = checkoutSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    return {
      error: result.error.issues[0]?.message ?? "Check your delivery details.",
    };
  }

  try {
    const [cart, session, shipping] = await Promise.all([
      findCurrentCart(),
      getCurrentSession(),
      getShippingQuote(result.data.state),
    ]);
    if (!cart?.items.length) throw new Error("Your cart is empty.");

    for (const item of cart.items) {
      if (
        !item.variant.active ||
        item.variant.product.status !== "ACTIVE" ||
        item.quantity > item.variant.inventoryQuantity
      ) {
        throw new Error(
          `${item.variant.product.name} changed or sold out. Review your cart and try again.`,
        );
      }
    }
    const existing = await db.order.findUnique({
      where: { cartId: cart.id },
      include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    const provider = getPaymentProvider(result.data.paymentProvider);
    let order = existing;
    let payment =
      existing?.payments[0]?.provider === provider.name &&
      ["INITIALIZED", "PENDING"].includes(existing.payments[0].status)
        ? existing.payments[0]
        : undefined;

    if (!order) {
      const totals = cartTotals(cart);
      const total = totals.subtotal + shipping.fee;
      const paymentReference = reference("THR");
      order = await db.order.create({
        data: {
          orderNumber: reference("ORDER"),
          userId: session?.user.id,
          cartId: cart.id,
          email: result.data.email,
          recipientName: result.data.recipientName,
          phone: result.data.phone,
          addressLine1: result.data.addressLine1,
          addressLine2: result.data.addressLine2,
          city: result.data.city,
          state: result.data.state,
          postalCode: result.data.postalCode,
          shippingZoneName: shipping.name,
          subtotal: totals.subtotal,
          shippingFee: shipping.fee,
          total,
          items: {
            create: cart.items.map((item) => {
              const unitPrice =
                Number(item.variant.product.basePrice) +
                Number(item.variant.priceAdjustment);
              return {
                variantId: item.variant.id,
                productName: item.variant.product.name,
                productSlug: item.variant.product.slug,
                sku: item.variant.sku,
                size: item.variant.size,
                colour: item.variant.colour,
                unitPrice,
                quantity: item.quantity,
                lineTotal: unitPrice * item.quantity,
              };
            }),
          },
          statusHistory: {
            create: {
              toStatus: "PENDING_PAYMENT",
              reason: "Checkout created",
            },
          },
          payments: {
            create: {
              provider: provider.name,
              reference: paymentReference,
              amount: total,
            },
          },
        },
        include: { payments: true },
      });
      payment = order.payments[0];
    } else if (!payment) {
      payment = await db.$transaction(async (tx) => {
        await tx.payment.updateMany({
          where: {
            orderId: order!.id,
            status: { in: ["INITIALIZED", "PENDING"] },
          },
          data: { status: "FAILED" },
        });
        return tx.payment.create({
          data: {
            orderId: order!.id,
            provider: provider.name,
            reference: reference("THR"),
            amount: order!.total,
          },
        });
      });
    }
    if (!payment) throw new Error("Payment could not be prepared.");
    if (order.status !== "PENDING_PAYMENT") {
      throw new Error("This cart has already been checked out.");
    }
    /*
     * A payment reference is reused while it remains pending, but repeatedly
     * invoking provider initialization can still consume provider resources
     * and generate multiple hosted-checkout sessions. The database timestamp
     * supplies a shared per-payment cooldown across application instances.
     * INITIALIZED payments are exempt so a failed first provider request can
     * be retried immediately.
     */
    if (
      payment.status === "PENDING" &&
      Date.now() - payment.updatedAt.getTime() < 60_000
    ) {
      throw new Error(
        "This payment was prepared recently. Please wait a minute before trying again.",
      );
    }

    const appUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(
      /\/$/,
      "",
    );
    const initialized = await provider.initialize({
      email: order.email,
      recipientName: order.recipientName,
      phone: order.phone,
      amountKobo: decimalNairaToKobo(order.total),
      reference: payment.reference,
      callbackUrl:
        provider.name === "paystack"
          ? `${appUrl}/api/payments/callback`
          : `${appUrl}/api/payments/callback?provider=${provider.name}&reference=${encodeURIComponent(payment.reference)}`,
      webhookUrl:
        provider.name === "opay"
          ? `${appUrl}/api/payments/opay/webhook`
          : `${appUrl}/api/payments/webhook`,
      cancelUrl: `${appUrl}/checkout?payment=cancelled`,
      orderId: order.id,
    });
    /*
     * Provider initialization is not proof of payment, but accepting a
     * different reference here would sever the later verification from the
     * database-owned payment. Fail before redirecting if the provider response
     * does not echo the exact server-generated reference.
     */
    if (initialized.reference !== payment.reference) {
      throw new Error("The payment provider returned an invalid reference.");
    }
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: "PENDING",
        providerTransactionId: initialized.accessCode,
      },
    });
    redirect(initialized.authorizationUrl);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "NEXT_REDIRECT" ||
        error.message.startsWith("NEXT_REDIRECT;"))
    ) {
      throw error;
    }
    return {
      error:
        error instanceof Error
          ? error.message
          : "Checkout could not be started.",
    };
  }
}
