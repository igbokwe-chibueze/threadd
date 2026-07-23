import Link from "next/link";

import { Wordmark } from "@/components/brand/wordmark";

export function SiteFooter() {
  return (
    <footer className="bg-[#171713] px-5 py-10 text-[#f4f0e7] sm:px-10 lg:px-14 lg:py-14">
      <div className="grid gap-16 border-b border-white/20 pb-16 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <Wordmark className="text-[#d7ff3f]" />
          <p className="mt-8 max-w-xl text-4xl leading-[0.95] font-medium tracking-[-0.055em] sm:text-6xl">
            Clothes for every version of you.
          </p>
        </div>

        <nav
          aria-label="Footer navigation"
          className="grid content-start text-sm"
        >
          {[
            ["About", "/about"],
            ["Contact", "/contact"],
            ["Delivery", "/delivery"],
            ["Returns", "/returns"],
            ["Privacy", "/privacy"],
            ["Terms", "/terms"],
            ["Account / Studio", "/sign-in"],
          ].map(([label, href], index) => (
            <Link
              key={label}
              href={href}
              className="flex items-center justify-between border-t border-white/20 py-4 transition-colors hover:text-[#d7ff3f]"
            >
              <span>{label}</span>
              <span className="text-[0.6rem] text-white/45">0{index + 1}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-3 pt-6 text-[0.58rem] font-semibold tracking-[0.16em] text-white/45 uppercase sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 THREADD</p>
        <p>Built in Lagos / Demo collection</p>
      </div>
    </footer>
  );
}
