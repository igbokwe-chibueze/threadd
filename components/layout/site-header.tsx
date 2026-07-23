"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Wordmark } from "@/components/brand/wordmark";

const navigation = [
  { label: "New study", href: "/#foundation" },
  { label: "About", href: "/about" },
  { label: "Delivery", href: "/delivery" },
  { label: "Account", href: "/sign-in" },
] as const;

type SiteHeaderProps = Readonly<{
  appearance?: "overlay" | "solid";
}>;

export function SiteHeader({ appearance = "overlay" }: SiteHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isSolid = appearance === "solid";

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (isOpen && !dialog.open) {
      dialog.showModal();
    }

    if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <>
      <header
        className={`${isSolid ? "relative border-b border-black/15 bg-[#ece8df] text-[#171713]" : "absolute inset-x-0 top-0 text-[#f4f0e7]"} z-30 flex items-center justify-between px-5 py-5 sm:px-10 lg:px-14`}
      >
        <Link
          href="/"
          aria-label="THREADD home"
          className="relative z-10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d7ff3f]"
        >
          <Wordmark />
        </Link>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-8 md:flex"
        >
          {navigation.slice(0, 3).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[0.62rem] font-semibold tracking-[0.2em] uppercase transition-opacity hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d7ff3f]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/sign-in"
            className="hidden rounded-full border border-current/40 px-4 py-2 text-[0.62rem] font-semibold tracking-[0.18em] uppercase transition-colors hover:bg-[#d7ff3f] hover:text-[#171713] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d7ff3f] sm:inline-flex"
          >
            Sign in
          </Link>
          <button
            type="button"
            aria-label="Open navigation"
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            onClick={() => setIsOpen(true)}
            className="grid size-10 place-items-center rounded-full border border-current/40 md:hidden"
          >
            <span className="grid gap-1" aria-hidden="true">
              <span className="h-px w-4 bg-current" />
              <span className="h-px w-4 bg-current" />
            </span>
          </button>
        </div>
      </header>

      <dialog
        ref={dialogRef}
        aria-label="THREADD navigation"
        onCancel={() => setIsOpen(false)}
        onClose={() => setIsOpen(false)}
        className="m-0 h-dvh max-h-none w-full max-w-none border-0 bg-[#d7ff3f] p-0 text-[#171713] backdrop:bg-black/40"
      >
        <div className="flex min-h-dvh flex-col px-5 py-5 sm:px-10">
          <div className="flex items-center justify-between">
            <Wordmark />
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="grid size-10 place-items-center rounded-full border border-black/35 text-xl"
              aria-label="Close navigation"
            >
              ×
            </button>
          </div>

          <nav
            aria-label="Mobile navigation"
            className="my-auto grid border-t border-black/25"
          >
            {navigation.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="group grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 border-b border-black/25 py-5"
              >
                <span className="text-[0.6rem] font-semibold">
                  0{index + 1}
                </span>
                <span className="text-4xl font-medium tracking-[-0.06em]">
                  {item.label}
                </span>
                <span
                  aria-hidden="true"
                  className="text-2xl transition-transform group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            ))}
          </nav>

          <p className="text-[0.62rem] font-semibold tracking-[0.2em] uppercase">
            Lagos / Nigeria / Everywhere
          </p>
        </div>
      </dialog>
    </>
  );
}
