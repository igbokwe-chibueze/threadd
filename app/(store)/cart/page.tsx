import Image from "next/image";
import Link from "next/link";

import { CartItemControl } from "@/features/cart/components/cart-item-control";
import { cartTotals, findCurrentCart } from "@/features/cart/service";
import { formatNaira } from "@/features/catalogue/format";

export const metadata = { title: "Your cart", robots: { index: false } };

export default async function CartPage() {
  const cart = await findCurrentCart();
  const totals = cart ? cartTotals(cart) : { quantity: 0, subtotal: 0 };

  return (
    <main className="min-h-[calc(100svh-81px)] bg-[#ece8df] px-5 py-10 text-[#171713] sm:px-10 lg:px-14">
      <div className="flex items-end justify-between border-b border-black/20 pb-6">
        <div>
          <p className="text-[0.62rem] font-bold tracking-[0.18em] uppercase">
            Shopping cart
          </p>
          <h1 className="mt-3 text-5xl font-medium tracking-[-0.06em] sm:text-7xl">
            Your edit.
          </h1>
        </div>
        <span className="text-sm text-black/50">{totals.quantity} pieces</span>
      </div>
      {cart?.items.length ? (
        <div className="grid gap-12 py-10 lg:grid-cols-[1.35fr_0.65fr]">
          <section className="grid content-start gap-5">
            {cart.items.map((item) => {
              const image = item.variant.product.images[0];
              const unitPrice =
                Number(item.variant.product.basePrice) +
                Number(item.variant.priceAdjustment);
              return (
                <article
                  key={item.id}
                  className="grid grid-cols-[7rem_1fr] gap-5 border-b border-black/20 pb-5 sm:grid-cols-[10rem_1fr]"
                >
                  <Link
                    href={`/products/${item.variant.product.slug}`}
                    className="relative aspect-[4/5] overflow-hidden bg-[#d8d2c8]"
                  >
                    {image ? (
                      <Image
                        src={image.url}
                        alt={image.altText}
                        fill
                        sizes="160px"
                        className="object-cover object-top"
                      />
                    ) : null}
                  </Link>
                  <div className="flex flex-col justify-between gap-5">
                    <div className="flex justify-between gap-4">
                      <div>
                        <Link
                          href={`/products/${item.variant.product.slug}`}
                          className="text-xl font-medium"
                        >
                          {item.variant.product.name}
                        </Link>
                        <p className="mt-2 text-xs text-black/50">
                          {item.variant.colour} / {item.variant.size}
                        </p>
                      </div>
                      <p>{formatNaira(String(unitPrice * item.quantity))}</p>
                    </div>
                    <CartItemControl
                      itemId={item.id}
                      quantity={item.quantity}
                      available={item.variant.inventoryQuantity}
                    />
                  </div>
                </article>
              );
            })}
          </section>
          <aside className="h-fit border border-black/20 p-6 lg:sticky lg:top-8">
            <p className="text-[0.6rem] font-bold tracking-[0.15em] uppercase">
              Summary
            </p>
            <div className="mt-6 flex justify-between border-b border-black/20 pb-5">
              <span>Subtotal</span>
              <span>{formatNaira(String(totals.subtotal))}</span>
            </div>
            <p className="mt-4 text-xs leading-5 text-black/50">
              Delivery is calculated from the destination state during checkout.
            </p>
            <Link
              href="/checkout"
              className="mt-6 block bg-[#171713] px-6 py-4 text-center text-[0.62rem] font-bold tracking-[0.15em] text-white uppercase"
            >
              Continue to checkout
            </Link>
          </aside>
        </div>
      ) : (
        <section className="grid min-h-[55svh] place-items-center text-center">
          <div>
            <p className="text-2xl font-medium">Your cart is waiting.</p>
            <p className="mt-2 text-sm text-black/50">
              Add a piece from the current collection.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex bg-[#171713] px-6 py-3 text-[0.62rem] font-bold tracking-[0.15em] text-white uppercase"
            >
              Explore the shop
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
