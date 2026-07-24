import Link from "next/link";
import { redirect } from "next/navigation";

import {
  canAccessAdmin,
  getCurrentSession,
} from "@/features/auth/authorization";
import { formatNaira } from "@/features/catalogue/format";
import type { UserRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db/client";

export const metadata = { title: "Orders / Admin", robots: { index: false } };

export default async function AdminOrdersPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");
  if (!canAccessAdmin(session.user.role as UserRole)) redirect("/account");
  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      items: true,
      cancellation: true,
      returnRequest: true,
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return (
    <main className="min-h-screen bg-[#171713] px-5 py-8 text-[#f4f0e7] sm:px-10 lg:px-14">
      <header className="flex justify-between border-b border-white/20 pb-5">
        <Link href="/admin" className="text-sm font-bold uppercase">
          THREADD / Admin
        </Link>
        <span className="text-xs text-[#d7ff3f]">Orders</span>
      </header>
      <section className="py-14">
        <p className="text-[0.62rem] font-bold tracking-[0.2em] text-[#d7ff3f] uppercase">
          Phase 7 / Orders
        </p>
        <h1 className="mt-4 text-6xl font-medium tracking-[-0.07em] sm:text-8xl">
          Paid to delivered.
        </h1>
      </section>
      <div className="grid gap-3">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/admin/orders/${order.id}`}
            className="grid gap-3 border border-white/15 p-5 hover:border-[#d7ff3f] md:grid-cols-[10rem_1fr_10rem_10rem]"
          >
            <span className="text-xs font-bold text-[#d7ff3f]">
              {order.status.replaceAll("_", " ")}
            </span>
            <span>
              <span className="block font-medium">{order.orderNumber}</span>
              <span className="mt-1 block text-xs text-white/45">
                {order.recipientName} / {order.items.length} line items
              </span>
            </span>
            <span>{formatNaira(order.total.toString())}</span>
            <span className="text-xs text-white/40">
              {workflowLabel(order) ??
                order.createdAt.toLocaleDateString("en-NG")}
            </span>
          </Link>
        ))}
        {!orders.length ? (
          <div className="grid min-h-56 place-items-center border border-dashed border-white/20 text-white/45">
            No orders yet.
          </div>
        ) : null}
      </div>
    </main>
  );
}

function workflowLabel(order: {
  cancellation: { status: string } | null;
  returnRequest: { status: string } | null;
}) {
  if (order.cancellation) {
    return `Cancellation ${order.cancellation.status.toLowerCase()}`;
  }
  if (order.returnRequest) {
    const status = order.returnRequest.status;
    if (status === "CLOSED") return "Return completed";
    if (status === "RECEIVED") return "Return received — inspect";
    return `Return ${status.replaceAll("_", " ").toLowerCase()}`;
  }
  return null;
}
