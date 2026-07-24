"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth/client";

export function SignOutButton({
  className = "",
}: Readonly<{ className?: string }>) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function signOut(): Promise<void> {
    setIsPending(true);
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={isPending}
      className={`rounded-full border border-current/25 px-4 py-2 text-[0.65rem] font-bold tracking-[0.16em] uppercase transition-colors hover:border-[#d7ff3f] hover:bg-[#d7ff3f] hover:text-[#171713] disabled:cursor-wait disabled:opacity-50 ${className}`}
    >
      {isPending ? "Leaving…" : "Sign out"}
    </button>
  );
}
