import Link from "next/link";
import { notFound } from "next/navigation";

import { formatNaira } from "@/features/catalogue/format";
import { getAccessibleOrder } from "@/features/orders/queries";
import {
  requestCancellationAction,
  requestReturnAction,
} from "@/features/orders/customer-actions";
import { OrderRequestForm } from "@/features/orders/components/order-request-form";

type Props = { params: Promise<{ id: string }> };

export default async function OrderConfirmationPage({ params }: Props) {
  const order = await getAccessibleOrder((await params).id);
  if (!order) notFound();

  return (
    <main className="min-h-[calc(100svh-81px)] bg-[#ece8df] px-5 py-12 sm:px-10 lg:px-14">
      <div className="mx-auto max-w-5xl">
        <p className="text-[0.62rem] font-bold tracking-[0.18em] text-black/50 uppercase">
          Order confirmed / {order.orderNumber}
        </p>
        <h1 className="mt-5 max-w-4xl text-6xl leading-[0.88] font-medium tracking-[-0.07em] sm:text-8xl">
          The thread is yours.
        </h1>
        <p className="mt-7 max-w-xl text-sm leading-6 text-black/55">
          Payment has been verified on the server. We’ll use the contact and
          delivery details below as this order moves through fulfilment.
        </p>
        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_0.7fr]">
          <section className="grid gap-4">
            {order.items.map((item) => (
              <article
                key={item.id}
                className="flex justify-between gap-5 border-b border-black/20 pb-4"
              >
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="mt-1 text-xs text-black/45">
                    {item.colour} / {item.size} / Qty {item.quantity}
                  </p>
                </div>
                <p>{formatNaira(item.lineTotal.toString())}</p>
              </article>
            ))}
          </section>
          <aside className="border border-black/20 p-6">
            <p className="text-[0.58rem] font-bold tracking-[0.14em] uppercase">
              Status
            </p>
            <p className="mt-3 text-2xl font-medium">
              {order.status.replaceAll("_", " ")}
            </p>
            <address className="mt-7 border-t border-black/20 pt-5 text-sm leading-6 text-black/55 not-italic">
              {order.recipientName}
              <br />
              {order.addressLine1}
              {order.addressLine2 ? `, ${order.addressLine2}` : ""}
              <br />
              {order.city}, {order.state}
              <br />
              {order.phone}
            </address>
            <div className="mt-7 grid gap-2 border-t border-black/20 pt-5 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatNaira(order.subtotal.toString())}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span>{formatNaira(order.shippingFee.toString())}</span>
              </div>
              <div className="mt-2 flex justify-between text-lg font-medium">
                <span>Total</span>
                <span>{formatNaira(order.total.toString())}</span>
              </div>
            </div>
          </aside>
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/account"
            className="bg-[#171713] px-6 py-3 text-[0.6rem] font-bold tracking-[0.14em] text-white uppercase"
          >
            View account
          </Link>
          <Link
            href="/shop"
            className="border border-black/25 px-6 py-3 text-[0.6rem] font-bold tracking-[0.14em] uppercase"
          >
            Continue shopping
          </Link>
        </div>
        <section className="mt-10 grid gap-3 sm:grid-cols-2">
          {["PAID", "PROCESSING", "PACKED"].includes(order.status) &&
          !order.cancellation ? (
            <OrderRequestForm
              orderId={order.id}
              action={requestCancellationAction}
              label="Request cancellation"
            />
          ) : null}
          {order.status === "DELIVERED" && !order.returnRequest ? (
            <OrderRequestForm
              orderId={order.id}
              action={requestReturnAction}
              label="Request return"
            />
          ) : null}
          {order.cancellation ? (
            <p className="border border-black/20 p-5 text-sm">
              Cancellation request: {order.cancellation.status.toLowerCase()}
            </p>
          ) : null}
          {order.returnRequest ? (
            <p className="border border-black/20 p-5 text-sm">
              Return request:{" "}
              {order.returnRequest.status.replaceAll("_", " ").toLowerCase()}
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
