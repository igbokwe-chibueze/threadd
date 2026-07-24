import { notFound } from "next/navigation";

import { completeDemoPaymentAction } from "@/features/payments/demo-actions";
import { formatNaira } from "@/features/catalogue/format";
import { db } from "@/lib/db/client";

type Props = { searchParams: Promise<{ reference?: string }> };

export default async function TestPaymentPage({ searchParams }: Props) {
  const reference = (await searchParams).reference;
  if (!reference) notFound();
  const payment = await db.payment.findUnique({
    where: { reference },
    include: { order: true },
  });
  if (!payment || payment.provider !== "demo") notFound();

  return (
    <main className="grid min-h-[calc(100svh-81px)] place-items-center bg-[#d7ff3f] px-5 py-12">
      <section className="w-full max-w-xl border border-black/25 bg-[#ece8df] p-7 sm:p-10">
        <p className="text-[0.62rem] font-bold tracking-[0.18em] uppercase">
          THREADD / Test payment
        </p>
        <h1 className="mt-5 text-5xl font-medium tracking-[-0.06em]">
          Simulate Paystack.
        </h1>
        <p className="mt-5 text-sm leading-6 text-black/55">
          This screen exists only while Paystack test credentials are absent. It
          follows the same verification and order-finalization path without
          charging a card.
        </p>
        <div className="mt-8 grid gap-3 border-y border-black/20 py-5 text-sm">
          <div className="mb-2 flex justify-between">
            <span>{payment.order.orderNumber}</span>
            <span>NGN</span>
          </div>
          <div className="flex justify-between">
            <span>Products subtotal</span>
            <span>{formatNaira(payment.order.subtotal.toString())}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery / {payment.order.shippingZoneName}</span>
            <span>{formatNaira(payment.order.shippingFee.toString())}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-black/20 pt-4 text-lg">
            <strong>Total to pay</strong>
            <strong>{formatNaira(payment.amount.toString())}</strong>
          </div>
        </div>
        <form action={completeDemoPaymentAction}>
          <input type="hidden" name="reference" value={reference} />
          <button className="mt-7 w-full bg-[#171713] px-6 py-4 text-[0.62rem] font-bold tracking-[0.15em] text-white uppercase">
            Complete successful test payment
          </button>
        </form>
      </section>
    </main>
  );
}
