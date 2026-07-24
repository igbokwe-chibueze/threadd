"use client";

import { useActionState } from "react";

import type { InventoryActionState } from "@/features/inventory/admin-actions";

type InventoryAction = (
  state: InventoryActionState,
  formData: FormData,
) => Promise<InventoryActionState>;

const input =
  "h-10 border border-white/25 bg-[#171713] px-3 text-sm text-white outline-none focus:border-[#d7ff3f]";

export function StockAdjustmentForm({ action }: { action: InventoryAction }) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="grid gap-3 pt-4">
      {state.error ? (
        <p role="alert" className="text-xs leading-5 text-red-200">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="text-xs text-[#d7ff3f]">
          {state.success}
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <select
          name="direction"
          aria-label="Adjustment direction"
          className={`${input} [&>option]:bg-[#171713]`}
        >
          <option value="ADD">Add stock</option>
          <option value="REMOVE">Remove stock</option>
        </select>
        <input
          name="quantity"
          aria-label="Adjustment quantity"
          type="number"
          min="1"
          max="10000"
          step="1"
          required
          placeholder="Quantity"
          className={input}
        />
      </div>
      <input
        name="reason"
        aria-label="Adjustment reason"
        required
        maxLength={240}
        placeholder="Reason, e.g. Received Lagos delivery"
        className={input}
      />
      <button
        disabled={pending}
        className="h-10 bg-[#d7ff3f] px-4 text-[0.6rem] font-bold tracking-[0.14em] text-black uppercase disabled:opacity-50"
      >
        {pending ? "Saving…" : "Record adjustment"}
      </button>
    </form>
  );
}

export function ThresholdForm({
  action,
  value,
}: {
  action: InventoryAction;
  value: number;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="mt-3 flex items-center gap-2">
      <label className="text-[0.58rem] tracking-[0.12em] text-white/45 uppercase">
        Alert at
        <input
          name="threshold"
          type="number"
          min="0"
          max="10000"
          step="1"
          defaultValue={value}
          aria-label="Low-stock threshold"
          className={`${input} ml-2 w-20`}
        />
      </label>
      <button
        disabled={pending}
        className="h-10 border border-white/25 px-3 text-[0.58rem] font-bold tracking-[0.12em] uppercase disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save"}
      </button>
      <span
        className={`text-xs ${state.error ? "text-red-200" : "text-[#d7ff3f]"}`}
      >
        {state.error ?? state.success}
      </span>
    </form>
  );
}
