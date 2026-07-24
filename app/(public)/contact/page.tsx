import type { Metadata } from "next";

import { getCurrentSession } from "@/features/auth/authorization";
import { EnquiryForm } from "@/features/enquiries/components/enquiry-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact THREADD for product, delivery, and order support.",
};

export default async function ContactPage() {
  const session = await getCurrentSession();

  return (
    <main className="grid min-h-[calc(100svh-81px)] lg:grid-cols-[0.85fr_1.15fr]">
      <section className="flex flex-col justify-between bg-[#171713] px-5 py-12 text-[#f4f0e7] sm:px-10 lg:px-14 lg:py-16">
        <div>
          <p className="text-[0.62rem] font-bold tracking-[0.2em] text-[#d7ff3f] uppercase">
            Contact / Start a conversation
          </p>
          <h1 className="mt-5 max-w-2xl text-6xl leading-[0.86] font-medium tracking-[-0.07em] sm:text-8xl">
            Talk to THREADD.
          </h1>
        </div>
        <p className="mt-16 max-w-md text-sm leading-6 text-white/55">
          Ask about a piece, delivery, an order, or the project. Every message
          receives a reference and a downloadable confirmation in the Demo
          Outbox.
        </p>
      </section>
      <section className="bg-[#ece8df] px-5 py-12 sm:px-10 lg:px-14 lg:py-16">
        <p className="text-[0.62rem] font-bold tracking-[0.18em] uppercase">
          Send an enquiry
        </p>
        <h2 className="mt-4 max-w-xl text-3xl font-medium tracking-[-0.04em]">
          We’ll keep your message with the right context.
        </h2>
        <div className="mt-10 max-w-2xl">
          <EnquiryForm
            kind="GENERAL"
            defaultName={session?.user.name}
            defaultEmail={session?.user.email}
          />
        </div>
      </section>
    </main>
  );
}
