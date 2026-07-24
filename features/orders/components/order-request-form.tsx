"use client";

import { useActionState } from "react";

import type { OrderRequestState } from "@/features/orders/customer-actions";

type Action = (
  state: OrderRequestState,
  formData: FormData,
) => Promise<OrderRequestState>;

export function OrderRequestForm({
  orderId,
  action,
  label,
}: {
  orderId: string;
  action: Action;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <details className="border border-black/20 p-5">
      <summary className="cursor-pointer text-[0.6rem] font-bold tracking-[0.12em] uppercase">
        {label}
      </summary>
      <form action={formAction} className="mt-5 grid gap-3">
        <input type="hidden" name="orderId" value={orderId} />
        <textarea
          name="reason"
          required
          minLength={10}
          maxLength={500}
          placeholder="Tell us what happened…"
          className="min-h-24 border border-black/25 bg-transparent p-3 text-sm"
        />
        {state.error || state.success ? (
          <p
            role={state.error ? "alert" : "status"}
            className={`text-xs ${state.error ? "text-[#9b2f24]" : "text-black/55"}`}
          >
            {state.error ?? state.success}
          </p>
        ) : null}
        <button
          disabled={pending}
          className="justify-self-start bg-[#171713] px-5 py-3 text-[0.58rem] font-bold tracking-[0.12em] text-white uppercase disabled:cursor-wait disabled:opacity-55"
        >
          {pending ? "Sending request…" : "Submit request"}
        </button>
      </form>
    </details>
  );
}
