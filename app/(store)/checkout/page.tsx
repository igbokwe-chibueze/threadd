import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentSession } from "@/features/auth/authorization";
import { cartTotals, findCurrentCart } from "@/features/cart/service";
import { CheckoutForm } from "@/features/checkout/components/checkout-form";
import {
  CheckoutQuoteProvider,
  CheckoutSummary,
} from "@/features/checkout/components/checkout-quote";
import { getActiveShippingZones } from "@/features/shipping/zones";
import { db } from "@/lib/db/client";

export const metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const [cart, session] = await Promise.all([
    findCurrentCart(),
    getCurrentSession(),
  ]);
  if (!cart?.items.length) redirect("/cart");

  const unavailable = cart.items.filter(
    (item) =>
      !item.variant.active ||
      item.variant.product.status !== "ACTIVE" ||
      item.quantity > item.variant.inventoryQuantity,
  );
  const totals = cartTotals(cart);
  const [defaultAddress, zones] = await Promise.all([
    session
      ? db.address.findFirst({
          where: { userId: session.user.id, isDefault: true },
        })
      : null,
    getActiveShippingZones(),
  ]);
  const testMode = !(
    process.env.PAYSTACK_SECRET_KEY?.startsWith("sk_test_") &&
    !process.env.PAYSTACK_SECRET_KEY.includes("replace")
  );
  const summaryItems = cart.items.map((item) => {
    const unitPrice =
      Number(item.variant.product.basePrice) +
      Number(item.variant.priceAdjustment);
    return {
      id: item.id,
      quantity: item.quantity,
      productName: item.variant.product.name,
      lineTotal: unitPrice * item.quantity,
    };
  });

  return (
    <main className="min-h-[calc(100svh-81px)] bg-[#ece8df] px-5 py-12 sm:px-10 lg:px-14">
      <div className="mx-auto max-w-5xl">
        <p className="text-[0.62rem] font-bold tracking-[0.18em] uppercase">
          Checkout / Review
        </p>
        <h1 className="mt-4 text-6xl font-medium tracking-[-0.07em] sm:text-8xl">
          One last look.
        </h1>
        <CheckoutQuoteProvider
          zones={zones}
          initialState={defaultAddress?.state}
        >
          <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_0.7fr]">
            <section>
              <h2 className="text-xl font-medium">Cart validation</h2>
              <p className="mt-3 text-sm leading-6 text-black/55">
                Prices and availability have been re-read directly from
                THREADD’s catalogue. Browser-supplied prices are never accepted.
              </p>
              {unavailable.length ? (
                <div className="mt-6 border border-[#9b2f24] p-5 text-sm text-[#9b2f24]">
                  Some pieces changed or sold out. Return to your cart before
                  continuing.
                </div>
              ) : (
                <div className="mt-6 border border-black/20 p-5 text-sm">
                  All {totals.quantity} pieces are currently available.
                </div>
              )}
              <div className="mt-8 border-t border-black/20 pt-6">
                <p className="text-sm">
                  {session
                    ? `Continuing as ${session.user.email}`
                    : "Guest checkout is available. You may also sign in before continuing."}
                </p>
                {!session ? (
                  <Link
                    href="/sign-in"
                    className="mt-4 inline-flex text-xs font-bold tracking-[0.12em] uppercase underline"
                  >
                    Sign in
                  </Link>
                ) : null}
              </div>
              {!unavailable.length ? (
                <div className="mt-8 border-t border-black/20 pt-6">
                  <h2 className="mb-6 text-xl font-medium">Delivery details</h2>
                  {defaultAddress ? (
                    <p className="mb-5 text-xs text-black/45">
                      Your default “{defaultAddress.label}” address has been
                      filled in. You can change it for this order.
                    </p>
                  ) : null}
                  <CheckoutForm
                    testMode={testMode}
                    defaults={{
                      email: session?.user.email,
                      name: defaultAddress?.recipientName ?? session?.user.name,
                      phone: defaultAddress?.phone,
                      addressLine1: defaultAddress?.line1,
                      addressLine2: defaultAddress?.line2 ?? undefined,
                      city: defaultAddress?.city,
                      state: defaultAddress?.state,
                      postalCode: defaultAddress?.postalCode ?? undefined,
                    }}
                  />
                </div>
              ) : null}
            </section>
            <CheckoutSummary subtotal={totals.subtotal} items={summaryItems} />
          </div>
        </CheckoutQuoteProvider>
      </div>
    </main>
  );
}
