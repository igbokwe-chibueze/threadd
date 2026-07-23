"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { PasswordField } from "@/components/ui/password-field";
import { authClient } from "@/lib/auth/client";

type ResetPasswordFormProps = Readonly<{
  token: string;
}>;

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
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
    const password = String(form.get("password"));
    const confirmation = String(form.get("confirmation"));

    if (password !== confirmation) {
      setError("The passwords do not match.");
      setIsPending(false);
      return;
    }

    const result = await authClient.resetPassword({
      newPassword: password,
      token,
    });

    if (result.error) {
      setError("This reset link is invalid or has expired.");
      setIsPending(false);
      return;
    }

    router.push("/sign-in?reset=complete");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 grid gap-5">
      <PasswordField
        label="New password"
        name="password"
        autoComplete="new-password"
        minLength={10}
      />
      <PasswordField
        label="Confirm password"
        name="confirmation"
        autoComplete="new-password"
        minLength={10}
      />
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
        {isPending ? "Updating…" : "Set new password"}
      </button>
    </form>
  );
}
