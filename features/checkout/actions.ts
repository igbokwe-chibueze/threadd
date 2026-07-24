"use server";

import { randomBytes } from "node:crypto";

import { redirect } from "next/navigation";

import { getCurrentSession } from "@/features/auth/authorization";
import { findCurrentCart, cartTotals } from "@/features/cart/service";
import { checkoutSchema } from "@/features/checkout/validation";
import { getPaymentProvider } from "@/features/payments/provider";
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
    const provider = getPaymentProvider();
    let order = existing;
    let payment = existing?.payments[0];

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
    }
    if (!payment) throw new Error("Payment could not be prepared.");
    if (order.status !== "PENDING_PAYMENT") {
      throw new Error("This cart has already been checked out.");
    }

    const appUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(
      /\/$/,
      "",
    );
    const initialized = await provider.initialize({
      email: order.email,
      amountKobo: Math.round(Number(order.total) * 100),
      reference: payment.reference,
      callbackUrl: `${appUrl}/api/payments/callback`,
      orderId: order.id,
    });
    await db.payment.update({
      where: { id: payment.id },
      data: { status: "PENDING" },
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
