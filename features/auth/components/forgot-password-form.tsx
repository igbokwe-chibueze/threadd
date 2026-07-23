"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/demo/request-password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: String(form.get("email")) }),
    });

    if (!response.ok) {
      setError("Enter a valid email address and try again.");
      setIsPending(false);
      return;
    }

    router.push("/demo-outbox");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 grid gap-5">
      <label className="grid gap-2 text-[0.65rem] font-semibold tracking-[0.16em] uppercase">
        Email address
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-12 border border-black/25 bg-transparent px-3 text-base font-normal tracking-normal normal-case outline-none focus:border-black"
        />
      </label>
      {error ? (
        <p role="alert" className="text-sm text-red-800">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="h-12 bg-[#171713] text-xs font-bold tracking-[0.18em] text-white uppercase disabled:opacity-55"
      >
        {isPending ? "Preparing preview…" : "Create reset message"}
      </button>
    </form>
  );
}
