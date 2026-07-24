"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Wordmark } from "@/components/brand/wordmark";
import { SignOutButton } from "@/features/auth/components/sign-out-button";

const navigation = [
  { label: "Shop", href: "/shop" },
  { label: "About", href: "/about" },
  { label: "Delivery", href: "/delivery" },
  { label: "Cart", href: "/cart" },
  { label: "Outbox", href: "/demo-outbox" },
  { label: "Account", href: "/sign-in" },
] as const;

type SiteHeaderProps = Readonly<{
  appearance?: "overlay" | "solid";
  cartQuantity?: number;
  isSignedIn?: boolean;
  unreadMessageCount?: number;
}>;

export function SiteHeader({
  appearance = "overlay",
  cartQuantity = 0,
  isSignedIn = false,
  unreadMessageCount = 0,
}: SiteHeaderProps) {
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
        <a
          href="#main-content"
          className="fixed top-2 left-2 z-[60] -translate-y-20 bg-[#d7ff3f] px-4 py-3 text-[0.62rem] font-bold tracking-[0.14em] text-[#171713] uppercase transition-transform focus:translate-y-0"
        >
          Skip to content
        </a>
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
          {isSignedIn ? (
            <Link
              href="/demo-outbox"
              aria-label={`Outbox${unreadMessageCount ? `, ${unreadMessageCount} unread messages` : ""}`}
              title="Outbox"
              className="relative hidden size-10 place-items-center rounded-full border border-current/40 transition-colors hover:bg-[#d7ff3f] hover:text-[#171713] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d7ff3f] md:grid"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="size-[1.05rem]"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <path d="M3.75 6.75h16.5v11.5H3.75z" />
                <path d="m4.5 7.5 7.5 6 7.5-6" />
              </svg>
              {unreadMessageCount > 0 ? (
                <span className="absolute -top-1.5 -right-1.5 grid min-h-5 min-w-5 place-items-center rounded-full bg-[#d7ff3f] px-1 text-[0.55rem] font-bold tracking-normal text-[#171713] ring-2 ring-[#171713]">
                  {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                </span>
              ) : null}
            </Link>
          ) : null}
          <Link
            href="/cart"
            aria-label={`Cart, ${cartQuantity} items`}
            title="Cart"
            className="relative grid size-10 place-items-center rounded-full border border-current/40 transition-colors hover:bg-[#d7ff3f] hover:text-[#171713] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d7ff3f] sm:hidden"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="size-[1.05rem]"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6.75 8.25h10.5l.8 11H5.95l.8-11Z" />
              <path d="M9 8.25v-1.5a3 3 0 0 1 6 0v1.5" />
            </svg>
            <span
              className="absolute -top-1.5 -right-1.5 grid min-h-5 min-w-5 place-items-center rounded-full bg-[#d7ff3f] px-1 text-[0.55rem] font-bold tracking-normal text-[#171713] ring-2 ring-[#171713]"
              aria-label={`${cartQuantity} items in cart`}
            >
              {cartQuantity > 99 ? "99+" : cartQuantity}
            </span>
          </Link>
          <Link
            href="/cart"
            className="hidden rounded-full border border-current/40 px-4 py-2 text-[0.62rem] font-semibold tracking-[0.18em] uppercase transition-colors hover:bg-[#d7ff3f] hover:text-[#171713] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d7ff3f] sm:inline-flex"
          >
            Cart
            <span
              className="ml-2 inline-grid min-w-5 place-items-center rounded-full bg-[#d7ff3f] px-1 text-[0.55rem] text-[#171713]"
              aria-label={`${cartQuantity} items in cart`}
            >
              {cartQuantity}
            </span>
          </Link>
          {isSignedIn ? (
            <>
              <Link
                href="/account"
                className="hidden rounded-full border border-current/40 px-4 py-2 text-[0.62rem] font-semibold tracking-[0.18em] uppercase transition-colors hover:bg-[#d7ff3f] hover:text-[#171713] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d7ff3f] sm:inline-flex"
              >
                Account
              </Link>
              <SignOutButton className="hidden md:inline-flex" />
            </>
          ) : (
            <Link
              href="/sign-in"
              className="hidden rounded-full border border-current/40 px-4 py-2 text-[0.62rem] font-semibold tracking-[0.18em] uppercase transition-colors hover:bg-[#d7ff3f] hover:text-[#171713] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d7ff3f] sm:inline-flex"
            >
              Sign in
            </Link>
          )}
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
            {navigation
              .filter((item) => item.href !== "/demo-outbox" || isSignedIn)
              .map((item, index) => (
                <Link
                  key={item.href}
                  href={
                    item.href === "/sign-in" && isSignedIn
                      ? "/account"
                      : item.href
                  }
                  onClick={() => setIsOpen(false)}
                  className="group grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 border-b border-black/25 py-5"
                >
                  <span className="text-[0.6rem] font-semibold">
                    0{index + 1}
                  </span>
                  <span className="text-4xl font-medium tracking-[-0.06em]">
                    {item.href === "/sign-in" && isSignedIn
                      ? "Account"
                      : item.label}
                    {item.href === "/cart" ? ` (${cartQuantity})` : ""}
                    {item.href === "/demo-outbox" && unreadMessageCount
                      ? ` (${unreadMessageCount})`
                      : ""}
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

          <div className="flex items-center justify-between gap-4">
            <p className="text-[0.62rem] font-semibold tracking-[0.2em] uppercase">
              Lagos / Nigeria / Everywhere
            </p>
            {isSignedIn ? <SignOutButton /> : null}
          </div>
        </div>
      </dialog>
    </>
  );
}
