"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

import { PasswordField } from "@/components/ui/password-field";
import { authClient } from "@/lib/auth/client";

type DemoAccount = Readonly<{
  label: string;
  description: string;
  email: string;
  password: string;
  destination: "/account" | "/admin";
}>;

const demoAccounts: readonly DemoAccount[] = [
  {
    label: "Enter as customer",
    description: "Browse orders, profile, addresses, and the demo outbox.",
    email: "customer@demo.threadd.store",
    password: "DemoShopper123!",
    destination: "/account",
  },
  {
    label: "Enter the studio",
    description: "Explore catalogue, inventory, customers, and orders.",
    email: "admin@demo.threadd.store",
    password: "DemoAdmin123!",
    destination: "/admin",
  },
];

export function SignInForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingAccount, setPendingAccount] = useState<string | null>(null);

  async function signIn(
    email: string,
    password: string,
    destination: "/account" | "/admin",
  ): Promise<void> {
    setError(null);
    setPendingAccount(email);

    const result = await authClient.signIn.email({
      email,
      password,
    });

    if (result.error) {
      setError("We couldn't sign you in. Check the details and try again.");
      setPendingAccount(null);
      return;
    }

    router.push(destination);
    router.refresh();
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    await signIn(
      String(form.get("email")),
      String(form.get("password")),
      "/account",
    );
  }

  return (
    <div>
      <div className="grid gap-3">
        {demoAccounts.map((account) => (
          <button
            key={account.email}
            type="button"
            onClick={() =>
              signIn(account.email, account.password, account.destination)
            }
            disabled={pendingAccount !== null}
            className="group flex items-center justify-between gap-5 border border-black/20 p-4 text-left transition-colors hover:border-black hover:bg-[#d7ff3f] disabled:cursor-wait disabled:opacity-55"
          >
            <span>
              <span className="block text-xs font-bold tracking-[0.12em] uppercase">
                {pendingAccount === account.email ? "Opening…" : account.label}
              </span>
              <span className="mt-1 block text-xs leading-5 text-black/55">
                {account.description}
              </span>
            </span>
            <span
              aria-hidden="true"
              className="text-xl transition-transform group-hover:translate-x-1"
            >
              →
            </span>
          </button>
        ))}
      </div>

      <div className="my-8 flex items-center gap-4">
        <span className="h-px flex-1 bg-black/15" />
        <span className="text-[0.6rem] font-semibold tracking-[0.2em] text-black/45 uppercase">
          or use your details
        </span>
        <span className="h-px flex-1 bg-black/15" />
      </div>

      <form onSubmit={handleSubmit} className="grid gap-5">
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
        <PasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
          minLength={10}
        />

        {error ? (
          <p role="alert" className="text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pendingAccount !== null}
          className="mt-2 h-12 bg-[#171713] text-xs font-bold tracking-[0.18em] text-white uppercase transition-colors hover:bg-[#38382f] disabled:cursor-wait disabled:opacity-55"
        >
          {pendingAccount ? "Signing in…" : "Sign in"}
        </button>
        <Link
          href="/forgot-password"
          className="text-center text-[0.65rem] font-bold tracking-[0.15em] uppercase"
        >
          Forgot password?
        </Link>
      </form>
    </div>
  );
}
