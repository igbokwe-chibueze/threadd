import { redirect } from "next/navigation";
import Link from "next/link";

import {
  deleteAddressAction,
  setDefaultAddressAction,
} from "@/features/account/actions";
import {
  AccountMutationButton,
  AddressForm,
  ProfileForm,
} from "@/features/account/components/account-forms";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import {
  canAccessAdmin,
  getCurrentSession,
} from "@/features/auth/authorization";
import type { UserRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db/client";

export const metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");

  const addresses = await db.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  const orders = await db.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { items: true, cancellation: true, returnRequest: true },
  });

  return (
    <main className="min-h-screen bg-[#ece8df] px-5 py-6 text-[#171713] sm:px-10 lg:px-14">
      <header className="flex items-center justify-between border-b border-black/20 pb-5">
        <Link href="/" className="text-sm font-bold uppercase">
          THREADD / Account
        </Link>
        <div className="flex items-center gap-3">
          {canAccessAdmin(session.user.role as UserRole) ? (
            <Link
              href="/admin"
              className="rounded-full border border-black/40 px-4 py-2 text-[0.58rem] font-bold tracking-[0.12em] uppercase transition-colors hover:border-black hover:bg-[#171713] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#171713]"
            >
              Go to admin
            </Link>
          ) : null}
          <SignOutButton />
        </div>
      </header>
      <section className="grid gap-12 py-14 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-[0.65rem] font-bold tracking-[0.2em] uppercase">
            Customer account
          </p>
          <h1 className="mt-4 max-w-3xl text-6xl leading-[0.86] font-medium tracking-[-0.07em] sm:text-8xl">
            Good to see you, {session.user.name.split(" ")[0]}.
          </h1>
          <nav className="mt-10 grid max-w-sm border-t border-black/20">
            <Link
              href="/shop"
              className="flex justify-between border-b border-black/20 py-4 text-sm"
            >
              Continue shopping <span>Shop →</span>
            </Link>
            <Link
              href="/cart"
              className="flex justify-between border-b border-black/20 py-4 text-sm"
            >
              Shopping cart <span>Open →</span>
            </Link>
            <Link
              href="/demo-outbox"
              className="flex justify-between border-b border-black/20 py-4 text-sm"
            >
              Demo outbox <span>Open →</span>
            </Link>
            <a
              href="#orders"
              className="flex justify-between border-b border-black/20 py-4 text-sm"
            >
              Orders <span>{orders.length}</span>
            </a>
          </nav>
        </div>
        <div className="grid content-start gap-12">
          <section
            id="orders"
            className="scroll-mt-8 border-t border-black/20 pt-6"
          >
            <p className="text-[0.6rem] font-bold tracking-[0.15em] uppercase">
              Recent orders
            </p>
            <div className="mt-5 grid gap-3">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}/confirmation`}
                  className="grid grid-cols-[1fr_auto] gap-4 border border-black/20 p-4"
                >
                  <span>
                    <span className="block font-medium">
                      {order.orderNumber}
                    </span>
                    <span className="mt-1 block text-xs text-black/45">
                      {order.items.length} line items /{" "}
                      {order.createdAt.toLocaleDateString("en-NG")}
                    </span>
                  </span>
                  <span className="text-right text-xs font-bold tracking-[0.1em] uppercase">
                    <span className="block">
                      {order.status.replaceAll("_", " ")}
                    </span>
                    {order.cancellation ? (
                      <span className="mt-1 block text-[#9b2f24]">
                        Cancellation {order.cancellation.status.toLowerCase()}
                      </span>
                    ) : null}
                    {order.returnRequest ? (
                      <span className="mt-1 block text-black/50">
                        Return{" "}
                        {order.returnRequest.status
                          .replaceAll("_", " ")
                          .toLowerCase()}
                      </span>
                    ) : null}
                  </span>
                </Link>
              ))}
              {!orders.length ? (
                <p className="text-sm text-black/45">No orders yet.</p>
              ) : null}
            </div>
          </section>
          <section className="border-t border-black/20 pt-6">
            <p className="text-[0.6rem] font-bold tracking-[0.15em] uppercase">
              Profile
            </p>
            <p className="mt-2 text-sm text-black/45">{session.user.email}</p>
            <div className="mt-6 max-w-xl">
              <ProfileForm name={session.user.name} />
            </div>
          </section>
          <section className="border-t border-black/20 pt-6">
            <p className="text-[0.6rem] font-bold tracking-[0.15em] uppercase">
              Saved delivery addresses
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {addresses.map((address) => (
                <article
                  key={address.id}
                  className="border border-black/20 p-5"
                >
                  <div className="flex justify-between gap-4">
                    <h2 className="font-medium">{address.label}</h2>
                    {address.isDefault ? (
                      <span className="text-[0.55rem] font-bold tracking-[0.1em] uppercase">
                        Default
                      </span>
                    ) : null}
                  </div>
                  <address className="mt-4 text-sm leading-6 text-black/55 not-italic">
                    {address.recipientName}
                    <br />
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ""}
                    <br />
                    {address.city}, {address.state}
                    <br />
                    {address.phone}
                  </address>
                  <div className="mt-5 flex flex-wrap gap-4">
                    {!address.isDefault ? (
                      <AccountMutationButton
                        action={setDefaultAddressAction.bind(null, address.id)}
                        label="Make default"
                        pendingLabel="Updating…"
                      />
                    ) : null}
                    <AccountMutationButton
                      action={deleteAddressAction.bind(null, address.id)}
                      label="Remove"
                      pendingLabel="Removing…"
                    />
                  </div>
                </article>
              ))}
              {!addresses.length ? (
                <p className="text-sm text-black/45">
                  No delivery addresses saved yet.
                </p>
              ) : null}
            </div>
            <details className="mt-8 border border-black/20 p-5">
              <summary className="cursor-pointer text-sm font-bold tracking-[0.1em] uppercase">
                Add an address
              </summary>
              <div className="mt-6">
                <AddressForm defaultName={session.user.name} />
              </div>
            </details>
          </section>
        </div>
      </section>
    </main>
  );
}
