import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Wordmark } from "@/components/brand/wordmark";
import { getCurrentSession } from "@/features/auth/authorization";
import {
  extractActionUrl,
  getAccessibleEmailMessages,
} from "@/features/email/queries";
import { EMAIL_PREVIEW_COOKIE } from "@/lib/email/preview-access";

export const metadata = {
  title: "Demo outbox",
  robots: { index: false, follow: false },
};

export default async function DemoOutboxPage() {
  const session = await getCurrentSession();
  const cookieStore = await cookies();
  const previewToken = cookieStore.get(EMAIL_PREVIEW_COOKIE)?.value;

  if (!session && !previewToken) {
    redirect("/forgot-password");
  }

  const messages = await getAccessibleEmailMessages({
    userId: session?.user.id,
    previewToken,
  });

  return (
    <main className="min-h-screen bg-[#ece8df] px-5 py-6 text-[#171713] sm:px-10 lg:px-14">
      <header className="flex items-center justify-between border-b border-black/20 pb-5">
        <Link href="/" aria-label="Return to THREADD home">
          <Wordmark />
        </Link>
        <span className="rounded-full bg-[#d7ff3f] px-3 py-1.5 text-[0.58rem] font-bold tracking-[0.15em] uppercase">
          Private preview
        </span>
      </header>

      <section className="mx-auto max-w-5xl py-16">
        <p className="text-[0.65rem] font-bold tracking-[0.22em] uppercase">
          Demo Outbox
        </p>
        <h1 className="mt-4 max-w-3xl text-6xl leading-[0.88] font-medium tracking-[-0.07em] sm:text-8xl">
          Messages, without the send.
        </h1>
        <p className="mt-6 max-w-xl text-sm leading-6 text-black/55">
          These previews demonstrate transactional email while keeping the
          public demo isolated from external delivery.
        </p>

        <div className="mt-12 grid gap-5">
          {messages.length ? (
            messages.map((message) => {
              const actionUrl = extractActionUrl(message.textBody);

              return (
                <article
                  key={message.id}
                  className="border border-black/20 bg-white/35 p-5 sm:p-7"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[0.6rem] font-bold tracking-[0.16em] text-black/45 uppercase">
                        {message.kind.replaceAll("_", " ")}
                      </p>
                      <h2 className="mt-2 text-xl font-medium">
                        {message.subject}
                      </h2>
                    </div>
                    <time className="text-xs text-black/45">
                      {message.createdAt.toLocaleString("en-NG")}
                    </time>
                  </div>
                  <pre className="mt-6 overflow-x-auto font-sans text-sm leading-6 whitespace-pre-wrap text-black/65">
                    {message.textBody}
                  </pre>
                  <div className="mt-6 flex flex-wrap gap-3">
                    {actionUrl ? (
                      <Link
                        href={actionUrl}
                        className="bg-[#171713] px-5 py-3 text-[0.65rem] font-bold tracking-[0.15em] text-white uppercase"
                      >
                        Open secure link
                      </Link>
                    ) : null}
                    <Link
                      href={`/account/outbox/${message.id}/download`}
                      className="border border-black/25 px-5 py-3 text-[0.65rem] font-bold tracking-[0.15em] uppercase"
                    >
                      Download text
                    </Link>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="border border-dashed border-black/25 p-8">
              <p className="font-medium">No preview message was created.</p>
              <p className="mt-2 text-sm text-black/55">
                For privacy, this is the same result shown when an address does
                not belong to an account.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
