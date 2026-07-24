"use client";

import { useActionState } from "react";

import {
  type ShippingActionState,
  updateShippingFeeAction,
} from "@/features/shipping/admin-actions";

export function ShippingFeeForm({
  zoneId,
  fee,
}: {
  zoneId: string;
  fee: number;
}) {
  const [state, action, pending] = useActionState<
    ShippingActionState,
    FormData
  >(updateShippingFeeAction, {});
  return (
    <form action={action} className="mt-5 flex flex-wrap items-center gap-3">
      <input type="hidden" name="zoneId" value={zoneId} />
      <label className="text-xs text-white/50">
        Fee (₦)
        <input
          name="fee"
          type="number"
          min="0"
          max="100000"
          step="100"
          defaultValue={fee}
          className="ml-3 w-28 border border-white/25 bg-transparent px-3 py-2 text-white"
        />
      </label>
      <button
        disabled={pending}
        className="border border-white/25 px-4 py-2 text-[0.58rem] font-bold tracking-[0.1em] uppercase disabled:opacity-55"
      >
        {pending ? "Saving…" : "Save fee"}
      </button>
      <span
        className={`text-xs ${state.error ? "text-red-200" : "text-[#d7ff3f]"}`}
      >
        {state.error ?? state.success}
      </span>
    </form>
  );
}
