import Link from "next/link";
import { redirect } from "next/navigation";

import {
  canAccessAdmin,
  getCurrentSession,
} from "@/features/auth/authorization";
import { ShippingFeeForm } from "@/features/shipping/shipping-fee-form";
import { ensureDefaultShippingZones } from "@/features/shipping/zones";
import type { UserRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db/client";

export default async function ShippingPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");
  if (!canAccessAdmin(session.user.role as UserRole)) redirect("/account");
  await ensureDefaultShippingZones();
  const zones = await db.shippingZone.findMany({
    orderBy: { position: "asc" },
  });

  return (
    <main className="min-h-screen bg-[#171713] px-5 py-8 text-[#f4f0e7] sm:px-10 lg:px-14">
      <header className="flex justify-between border-b border-white/20 pb-5">
        <Link href="/admin" className="text-sm font-bold uppercase">
          THREADD / Studio
        </Link>
        <Link href="/admin/orders" className="text-xs text-[#d7ff3f]">
          Orders →
        </Link>
      </header>
      <section className="py-14">
        <p className="text-[0.62rem] font-bold tracking-[0.2em] text-[#d7ff3f] uppercase">
          Phase 7 / Delivery
        </p>
        <h1 className="mt-4 text-6xl font-medium tracking-[-0.07em] sm:text-8xl">
          Nigeria, zoned.
        </h1>
      </section>
      <div className="grid gap-4 lg:grid-cols-3">
        {zones.map((zone) => (
          <article key={zone.id} className="border border-white/15 p-5">
            <h2 className="text-xl font-medium">{zone.name}</h2>
            <p className="mt-3 text-xs leading-5 text-white/45">
              {Array.isArray(zone.states)
                ? zone.states.join(", ")
                : "States require configuration"}
            </p>
            <ShippingFeeForm zoneId={zone.id} fee={Number(zone.fee)} />
          </article>
        ))}
      </div>
    </main>
  );
}
