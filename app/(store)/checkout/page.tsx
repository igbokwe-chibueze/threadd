import Link from "next/link";
import { redirect } from "next/navigation";

import { cartTotals, findCurrentCart } from "@/features/cart/service";
import { formatNaira } from "@/features/catalogue/format";
import { getCurrentSession } from "@/features/auth/authorization";

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

  return (
    <main className="min-h-[calc(100svh-81px)] bg-[#ece8df] px-5 py-12 sm:px-10 lg:px-14">
      <div className="mx-auto max-w-5xl">
        <p className="text-[0.62rem] font-bold tracking-[0.18em] uppercase">
          Checkout / Review
        </p>
        <h1 className="mt-4 text-6xl font-medium tracking-[-0.07em] sm:text-8xl">
          One last look.
        </h1>
        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_0.7fr]">
          <section>
            <h2 className="text-xl font-medium">Cart validation</h2>
            <p className="mt-3 text-sm leading-6 text-black/55">
              Prices and availability have been re-read directly from THREADD’s
              catalogue. Browser-supplied prices are never accepted.
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
          </section>
          <aside className="border border-black/20 p-6">
            <p className="text-[0.6rem] font-bold tracking-[0.15em] uppercase">
              Order summary
            </p>
            <div className="mt-6 grid gap-3 text-sm">
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-4">
                  <span>
                    {item.quantity} × {item.variant.product.name}
                  </span>
                  <span>
                    {formatNaira(
                      String(
                        (Number(item.variant.product.basePrice) +
                          Number(item.variant.priceAdjustment)) *
                          item.quantity,
                      ),
                    )}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-between border-t border-black/20 pt-5 text-lg">
              <span>Subtotal</span>
              <span>{formatNaira(String(totals.subtotal))}</span>
            </div>
            <p className="mt-6 bg-[#171713] p-4 text-xs leading-5 text-white/65">
              Address, shipping, order creation, and Paystack payment are
              activated in Phase 7. This review gate intentionally cannot create
              an unpaid or incomplete order yet.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
