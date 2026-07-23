import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Wordmark } from "@/components/brand/wordmark";
import { SignInForm } from "@/features/auth/components/sign-in-form";
import { getCurrentSession } from "@/features/auth/authorization";

export const metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function SignInPage() {
  const session = await getCurrentSession();

  if (session) {
    redirect(session.user.role === "CUSTOMER" ? "/account" : "/admin");
  }

  return (
    <main className="grid min-h-screen bg-[#ece8df] text-[#171713] lg:grid-cols-2">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#22211e] lg:block">
        <Image
          src="/images/campaign/threadd-hero-01.png"
          alt="THREADD models in neutral unisex tailoring"
          fill
          priority
          sizes="50vw"
          className="object-cover object-[72%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/20" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white">
          <p className="text-[0.62rem] font-bold tracking-[0.24em] text-[#d7ff3f] uppercase">
            The wardrobe, opened
          </p>
          <p className="mt-4 max-w-lg text-5xl leading-[0.9] font-medium tracking-[-0.06em]">
            One identity. Two ways inside.
          </p>
        </div>
      </section>

      <section className="flex min-h-screen flex-col px-5 py-5 sm:px-10 lg:px-16 lg:py-8 xl:px-24">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Return to THREADD home">
            <Wordmark />
          </Link>
          <span className="rounded-full bg-[#d7ff3f] px-3 py-1.5 text-[0.58rem] font-bold tracking-[0.15em] uppercase">
            Demo mode
          </span>
        </div>

        <div className="my-auto w-full max-w-lg py-16">
          <p className="text-[0.65rem] font-bold tracking-[0.24em] uppercase">
            Welcome to THREADD
          </p>
          <h1 className="mt-4 text-5xl leading-[0.9] font-medium tracking-[-0.065em] sm:text-6xl">
            Choose your side of the story.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-black/55">
            Explore the customer journey or step behind the collection as a
            store administrator. Demo changes are temporary.
          </p>

          <div className="mt-10">
            <SignInForm />
          </div>
        </div>
      </section>
    </main>
  );
}
