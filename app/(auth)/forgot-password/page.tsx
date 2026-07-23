import Link from "next/link";

import { Wordmark } from "@/components/brand/wordmark";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-[#ece8df] px-5 py-6 text-[#171713] sm:px-10 lg:px-14">
      <Link href="/" aria-label="Return to THREADD home">
        <Wordmark />
      </Link>
      <section className="mx-auto max-w-xl py-24">
        <p className="text-[0.65rem] font-bold tracking-[0.22em] uppercase">
          Account recovery
        </p>
        <h1 className="mt-4 text-6xl leading-[0.88] font-medium tracking-[-0.07em]">
          Find your way back in.
        </h1>
        <p className="mt-6 max-w-md text-sm leading-6 text-black/55">
          In demo mode, the reset message stays in a private browser-bound
          outbox instead of being sent externally.
        </p>
        <ForgotPasswordForm />
        <Link
          href="/sign-in"
          className="mt-7 inline-block text-xs font-bold tracking-[0.15em] uppercase"
        >
          ← Back to sign in
        </Link>
      </section>
    </main>
  );
}
