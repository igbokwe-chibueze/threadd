import Link from "next/link";
import { redirect } from "next/navigation";

import {
  canAccessAdmin,
  getCurrentSession,
} from "@/features/auth/authorization";
import { getAdminEmailMessages } from "@/features/email/queries";
import type { UserRole } from "@/generated/prisma/enums";

export const metadata = {
  title: "Notification outbox",
  robots: { index: false, follow: false },
};

export default async function AdminOutboxPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");
  if (!canAccessAdmin(session.user.role as UserRole)) redirect("/account");

  const recipientEmail = (
    process.env.ADMIN_NOTIFICATION_EMAIL ?? "admin@demo.threadd.store"
  ).toLowerCase();
  const messages = await getAdminEmailMessages(session.user.id, recipientEmail);

  return (
    <main className="min-h-screen bg-[#171713] px-5 py-6 text-[#f4f0e7] sm:px-10 lg:px-14">
      <header className="flex items-center justify-between border-b border-white/20 pb-5">
        <Link href="/admin" className="text-sm font-bold uppercase">
          THREADD / Admin
        </Link>
        <span className="rounded-full bg-[#d7ff3f] px-3 py-1.5 text-[0.58rem] font-bold tracking-[0.15em] text-[#171713] uppercase">
          Admin only
        </span>
      </header>

      <section className="mx-auto max-w-5xl py-16">
        <p className="text-[0.65rem] font-bold tracking-[0.22em] text-[#d7ff3f] uppercase">
          Notification outbox
        </p>
        <h1 className="mt-4 max-w-3xl text-6xl leading-[0.88] font-medium tracking-[-0.07em] sm:text-8xl">
          Store messages, held safely.
        </h1>
        <p className="mt-6 max-w-xl text-sm leading-6 text-white/55">
          Only notifications addressed to the configured store recipient are
          shown here. No external email is sent in demo mode.
        </p>

        <div className="mt-12 grid gap-4">
          {messages.length ? (
            messages.map((message) => (
              <article
                key={message.id}
                className="border border-white/20 bg-white/5 p-5 sm:p-7"
              >
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="text-[0.6rem] font-bold tracking-[0.16em] text-white/40 uppercase">
                      To {message.recipientEmail}
                    </p>
                    <h2 className="mt-2 text-xl font-medium">
                      {message.subject}
                    </h2>
                  </div>
                  <time className="text-xs text-white/40">
                    {message.createdAt.toLocaleString("en-NG")}
                  </time>
                </div>
                <pre className="mt-6 overflow-x-auto font-sans text-sm leading-6 whitespace-pre-wrap text-white/65">
                  {message.textBody}
                </pre>
                <Link
                  href={`/admin/outbox/${message.id}/download`}
                  className="mt-6 inline-flex border border-white/25 px-5 py-3 text-[0.65rem] font-bold tracking-[0.15em] uppercase"
                >
                  Download text
                </Link>
              </article>
            ))
          ) : (
            <div className="border border-dashed border-white/25 p-8 text-white/60">
              No administrator notifications yet.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
