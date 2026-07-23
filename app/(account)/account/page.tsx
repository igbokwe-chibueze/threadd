import { redirect } from "next/navigation";
import Link from "next/link";

import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { getCurrentSession } from "@/features/auth/authorization";

export const metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <main className="min-h-screen bg-[#ece8df] px-5 py-6 text-[#171713] sm:px-10 lg:px-14">
      <header className="flex items-center justify-between border-b border-black/20 pb-5">
        <p className="text-sm font-bold uppercase">THREADD / Account</p>
        <SignOutButton />
      </header>
      <section className="grid gap-12 py-16 lg:grid-cols-[1.35fr_1fr]">
        <div>
          <p className="text-[0.65rem] font-bold tracking-[0.2em] uppercase">
            Demo customer
          </p>
          <h1 className="mt-4 max-w-3xl text-6xl leading-[0.86] font-medium tracking-[-0.07em] sm:text-8xl">
            Good to see you, {session.user.name.split(" ")[0]}.
          </h1>
        </div>
        <div className="grid content-start gap-3">
          {[
            ["Orders", undefined],
            ["Saved addresses", undefined],
            ["Profile", undefined],
            ["Demo outbox", "/demo-outbox"],
          ].map(([item, href], index) => {
            const content = (
              <>
                <span className="text-sm font-medium">{item}</span>
                <span className="text-xs text-black/45">
                  0{index + 1} / {href ? "Open" : "Coming next"}
                </span>
              </>
            );

            return href ? (
              <Link
                key={item}
                href={href}
                className="flex items-center justify-between border-t border-black/20 py-4"
              >
                {content}
              </Link>
            ) : (
              <div
                key={item}
                className="flex items-center justify-between border-t border-black/20 py-4"
              >
                {content}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
