import { redirect } from "next/navigation";

import {
  canAccessAdmin,
  getCurrentSession,
} from "@/features/auth/authorization";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import type { UserRole } from "@/generated/prisma/enums";

export const metadata = {
  title: "Studio",
  robots: { index: false, follow: false },
};

const modules = [
  ["Catalogue", "Products, categories, collections"],
  ["Inventory", "Variant stock and movement history"],
  ["Orders", "Payment and fulfilment workflow"],
  ["Customers", "Profiles, history, and support"],
] as const;

export default async function AdminPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/sign-in");
  }

  if (!canAccessAdmin(session.user.role as UserRole)) {
    redirect("/account");
  }

  return (
    <main className="min-h-screen bg-[#171713] px-5 py-6 text-[#f4f0e7] sm:px-10 lg:px-14">
      <header className="flex items-center justify-between border-b border-white/20 pb-5">
        <p className="text-sm font-bold uppercase">THREADD / Studio</p>
        <div className="flex items-center gap-3">
          <span className="hidden rounded-full bg-[#d7ff3f] px-3 py-2 text-[0.58rem] font-bold tracking-[0.12em] text-[#171713] uppercase sm:block">
            Demo mode
          </span>
          <SignOutButton />
        </div>
      </header>

      <section className="grid gap-12 py-16 lg:grid-cols-[1.25fr_1fr]">
        <div>
          <p className="text-[0.65rem] font-bold tracking-[0.2em] text-[#d7ff3f] uppercase">
            Store overview
          </p>
          <h1 className="mt-4 max-w-3xl text-6xl leading-[0.86] font-medium tracking-[-0.07em] sm:text-8xl">
            The collection starts here.
          </h1>
          <p className="mt-8 max-w-md text-sm leading-6 text-white/55">
            Signed in as {session.user.email}. The working management modules
            arrive in the next implementation slice.
          </p>
        </div>

        <div className="grid content-start">
          {modules.map(([name, description], index) => (
            <div
              key={name}
              className="group grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 border-t border-white/20 py-5"
            >
              <span className="text-[0.6rem] text-white/40">0{index + 1}</span>
              <span>
                <span className="block text-lg font-medium">{name}</span>
                <span className="mt-1 block text-xs text-white/45">
                  {description}
                </span>
              </span>
              <span className="text-[#d7ff3f]">→</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
