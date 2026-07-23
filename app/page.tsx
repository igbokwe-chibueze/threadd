import Image from "next/image";
import Link from "next/link";

import { Wordmark } from "@/components/brand/wordmark";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#ece8df] text-[#171713]">
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-5 text-[#f4f0e7] sm:px-10 lg:px-14">
        <Wordmark />
        <p className="hidden text-[0.65rem] font-semibold tracking-[0.28em] uppercase md:block">
          Unisex / Lagos / Everywhere
        </p>
        <Link
          href="/sign-in"
          className="rounded-full border border-current/40 px-4 py-2 text-[0.65rem] font-semibold tracking-[0.2em] uppercase transition-colors hover:bg-[#d7ff3f] hover:text-[#171713] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d7ff3f]"
        >
          Sign in
        </Link>
      </header>

      <section className="relative isolate min-h-[100svh] overflow-hidden bg-[#373632]">
        <Image
          src="/images/campaign/threadd-hero-01.png"
          alt="Two models wearing THREADD's neutral unisex tailoring"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[66%_center]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(20,20,18,.82)_0%,rgba(20,20,18,.48)_34%,rgba(20,20,18,.02)_70%)]" />

        <div className="relative z-10 flex min-h-[100svh] max-w-[105rem] flex-col justify-end px-5 pt-32 pb-8 sm:px-10 sm:pb-12 lg:px-14">
          <p className="mb-5 flex items-center gap-3 text-[0.65rem] font-semibold tracking-[0.3em] text-[#d7ff3f] uppercase">
            <span className="h-px w-10 bg-current" />
            Debut study 001
          </p>
          <h1
            aria-label="THREADD"
            className="max-w-5xl text-[clamp(4.2rem,13vw,12rem)] leading-[0.72] font-semibold tracking-[-0.085em] text-[#f4f0e7] uppercase"
          >
            Thread
            <span className="block pl-[0.32em] text-[#d7ff3f] italic">D</span>
          </h1>

          <div className="mt-9 flex flex-col gap-8 border-t border-white/35 pt-5 text-[#f4f0e7] sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-sm text-sm leading-6 text-white/75">
              Clothes without categories. Designed in Lagos for every version of
              you.
            </p>
            <Link
              href="#foundation"
              className="group inline-flex w-fit items-center gap-4 text-xs font-semibold tracking-[0.24em] uppercase focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d7ff3f]"
            >
              Enter the first drop
              <span className="grid size-11 place-items-center rounded-full bg-[#d7ff3f] text-xl text-[#171713] transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
        </div>

        <p className="absolute right-4 bottom-1/2 hidden origin-bottom-right rotate-90 text-[0.58rem] font-medium tracking-[0.25em] text-white/60 uppercase xl:block">
          Modern uniform / edition 2026
        </p>
      </section>

      <section
        id="foundation"
        className="grid gap-12 px-5 py-24 sm:px-10 lg:grid-cols-[1fr_1.5fr] lg:px-14 lg:py-32"
      >
        <p className="text-[0.65rem] font-semibold tracking-[0.25em] uppercase">
          The foundation is being laid
        </p>
        <div>
          <h2 className="max-w-4xl text-4xl leading-[0.95] font-medium tracking-[-0.055em] sm:text-6xl lg:text-7xl">
            Not menswear. Not womenswear. Just{" "}
            <span className="italic">good clothes</span>, considered from every
            angle.
          </h2>
          <div className="mt-12 grid gap-6 border-t border-black/20 pt-6 text-sm leading-6 text-black/65 sm:grid-cols-2">
            <p>
              THREADD is taking shape as a complete fashion store: catalogue,
              customer experience, checkout, and a working studio behind it.
            </p>
            <p>
              This first screen establishes the visual language. The full
              collection arrives as each implementation phase clears its quality
              gate.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
