import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  canAccessAdmin,
  getCurrentSession,
} from "@/features/auth/authorization";
import { formatNaira } from "@/features/catalogue/format";
import {
  CancellationControl,
  OrderStatusControl,
  ReturnControl,
} from "@/features/orders/components/admin-order-controls";
import type { UserRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db/client";

const nextStatus: Record<string, string> = {
  PAID: "PROCESSING",
  PROCESSING: "PACKED",
  PACKED: "DISPATCHED",
  DISPATCHED: "DELIVERED",
};
type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderPage({ params }: Props) {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");
  if (!canAccessAdmin(session.user.role as UserRole)) redirect("/account");
  const order = await db.order.findUnique({
    where: { id: (await params).id },
    include: {
      items: true,
      payments: { orderBy: { createdAt: "desc" } },
      statusHistory: {
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { name: true } } },
      },
      cancellation: true,
      returnRequest: true,
      refunds: true,
    },
  });
  if (!order) notFound();

  return (
    <main className="min-h-screen bg-[#171713] px-5 py-8 text-[#f4f0e7] sm:px-10 lg:px-14">
      <header className="flex justify-between border-b border-white/20 pb-5">
        <Link href="/admin/orders" className="text-sm font-bold uppercase">
          ← Orders
        </Link>
        <span className="text-xs text-white/45">{order.orderNumber}</span>
      </header>
      <section className="grid gap-10 py-12 lg:grid-cols-[1fr_0.55fr]">
        <div>
          <span className="bg-[#d7ff3f] px-3 py-2 text-[0.58rem] font-bold text-black uppercase">
            {order.status.replaceAll("_", " ")}
          </span>
          {order.cancellation ? (
            <span className="ml-2 border border-white/30 px-3 py-2 text-[0.58rem] font-bold uppercase">
              Cancellation {order.cancellation.status.toLowerCase()}
            </span>
          ) : null}
          {order.returnRequest ? (
            <span className="ml-2 border border-white/30 px-3 py-2 text-[0.58rem] font-bold uppercase">
              {order.returnRequest.status === "CLOSED"
                ? "Return completed"
                : `Return ${order.returnRequest.status.replaceAll("_", " ").toLowerCase()}`}
            </span>
          ) : null}
          <h1 className="mt-7 text-5xl font-medium tracking-[-0.06em]">
            {order.recipientName}
          </h1>
          <p className="mt-3 text-sm text-white/45">
            {order.email} / {order.phone}
          </p>
          <div className="mt-10 grid gap-3">
            {order.items.map((item) => (
              <article
                key={item.id}
                className="flex justify-between border-b border-white/15 pb-4"
              >
                <span>
                  {item.productName}
                  <span className="block text-xs text-white/40">
                    {item.colour} / {item.size} / Qty {item.quantity}
                  </span>
                </span>
                <span>{formatNaira(item.lineTotal.toString())}</span>
              </article>
            ))}
          </div>
          <address className="mt-10 border border-white/15 p-5 text-sm leading-6 text-white/55 not-italic">
            {order.addressLine1}
            {order.addressLine2 ? `, ${order.addressLine2}` : ""}
            <br />
            {order.city}, {order.state}
          </address>
          <section className="mt-10">
            <h2 className="text-xl font-medium">Status history</h2>
            <ol className="mt-5 grid gap-4 border-l border-white/20 pl-5">
              {order.statusHistory.map((item) => (
                <li key={item.id} className="text-xs">
                  {item.fromStatus ? `${item.fromStatus} → ` : ""}
                  {item.toStatus}
                  <span className="mt-1 block text-white/35">
                    {item.actor?.name ?? "System"} /{" "}
                    {item.createdAt.toLocaleString("en-NG")}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>
        <aside className="grid content-start gap-6">
          <section className="border border-white/15 p-5">
            <h2 className="mb-5 text-lg font-medium">Fulfilment</h2>
            <OrderStatusControl
              orderId={order.id}
              nextStatus={nextStatus[order.status]}
            />
            {!nextStatus[order.status] ? (
              <p className="text-sm text-white/45">
                No standard next transition is available.
              </p>
            ) : null}
          </section>
          {order.cancellation?.status === "PENDING" ? (
            <section className="border border-amber-200/40 p-5">
              <h2 className="text-lg font-medium">Cancellation request</h2>
              <p className="my-4 text-sm leading-6 text-white/60">
                {order.cancellation.reason}
              </p>
              <CancellationControl orderId={order.id} />
            </section>
          ) : null}
          {order.returnRequest &&
          !["REJECTED", "CLOSED"].includes(order.returnRequest.status) ? (
            <section className="border border-white/15 p-5">
              <h2 className="text-lg font-medium">Return workflow</h2>
              <p className="my-4 text-sm leading-6 text-white/60">
                {order.returnRequest.reason}
              </p>
              <ReturnControl
                orderId={order.id}
                status={order.returnRequest.status}
              />
            </section>
          ) : null}
          {order.returnRequest &&
          ["REJECTED", "CLOSED"].includes(order.returnRequest.status) ? (
            <section className="border border-white/15 p-5">
              <h2 className="text-lg font-medium">
                {order.returnRequest.status === "CLOSED"
                  ? "Return completed"
                  : "Return rejected"}
              </h2>
              <p className="mt-3 text-sm text-white/50">
                {order.returnRequest.status === "CLOSED"
                  ? order.returnRequest.sellable
                    ? "The item was inspected as sellable and stock was restored."
                    : "The item was not sellable; stock was not restored."
                  : order.returnRequest.reviewReason}
              </p>
            </section>
          ) : null}
          <section className="border border-white/15 p-5 text-sm">
            <div className="flex justify-between">
              <span>Total</span>
              <strong>{formatNaira(order.total.toString())}</strong>
            </div>
            <p className="mt-4 text-xs text-white/40">
              Payment: {order.payments[0]?.status ?? "NONE"}
              <br />
              Refunds: {order.refunds.length}
            </p>
          </section>
        </aside>
      </section>
    </main>
  );
}
