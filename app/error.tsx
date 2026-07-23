"use client";

import { useEffect } from "react";

type ErrorPageProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#171713] px-6 text-[#f4f0e7]">
      <div className="max-w-xl text-center">
        <p className="text-[0.65rem] font-semibold tracking-[0.28em] text-[#d7ff3f] uppercase">
          A loose thread
        </p>
        <h1 className="mt-5 text-6xl leading-[0.9] font-medium tracking-[-0.07em] sm:text-8xl">
          Something came undone.
        </h1>
        <p className="mx-auto mt-6 max-w-md text-sm leading-6 text-white/60">
          We couldn&apos;t complete that request. Try the action again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-9 rounded-full bg-[#d7ff3f] px-6 py-3 text-xs font-semibold tracking-[0.18em] text-[#171713] uppercase focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
