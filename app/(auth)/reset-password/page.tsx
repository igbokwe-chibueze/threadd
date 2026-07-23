import Link from "next/link";

import { Wordmark } from "@/components/brand/wordmark";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata = {
  title: "Choose a new password",
  robots: { index: false, follow: false },
};

type ResetPasswordPageProps = Readonly<{
  searchParams: Promise<{
    token?: string | string[];
    error?: string | string[];
  }>;
}>;

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const query = await searchParams;
  const token = typeof query.token === "string" ? query.token : undefined;

  return (
    <main className="min-h-screen bg-[#ece8df] px-5 py-6 text-[#171713] sm:px-10 lg:px-14">
      <Link href="/" aria-label="Return to THREADD home">
        <Wordmark />
      </Link>
      <section className="mx-auto max-w-xl py-24">
        <p className="text-[0.65rem] font-bold tracking-[0.22em] uppercase">
          Secure reset
        </p>
        <h1 className="mt-4 text-6xl leading-[0.88] font-medium tracking-[-0.07em]">
          Choose something only you know.
        </h1>
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="mt-8 border border-black/20 p-5">
            <p className="text-sm leading-6">
              This reset link is missing, invalid, or expired.
            </p>
            <Link
              href="/forgot-password"
              className="mt-4 inline-block text-xs font-bold tracking-[0.15em] uppercase"
            >
              Request another link →
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
