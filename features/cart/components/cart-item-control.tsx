"use client";

import { useActionState } from "react";

import {
  type CartActionState,
  updateCartItemAction,
} from "@/features/cart/actions";

export function CartItemControl({
  itemId,
  quantity,
  available,
}: {
  itemId: string;
  quantity: number;
  available: number;
}) {
  const [state, action, pending] = useActionState<CartActionState, FormData>(
    updateCartItemAction,
    {},
  );
  return (
    <div>
      <form action={action} className="flex items-center gap-2">
        <input type="hidden" name="itemId" value={itemId} />
        <label className="text-[0.58rem] font-bold tracking-[0.12em] uppercase">
          Qty
          <select
            key={`${itemId}-${quantity}`}
            name="quantity"
            defaultValue={quantity}
            className="ml-2 border border-black/25 bg-[#ece8df] px-3 py-2 text-sm"
          >
            {Array.from(
              { length: Math.min(10, available) },
              (_, index) => index + 1,
            ).map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <button
          disabled={pending}
          className="border border-black/25 px-3 py-2 text-[0.56rem] font-bold tracking-[0.1em] uppercase disabled:cursor-wait disabled:opacity-50"
        >
          {pending ? "Updating…" : "Update"}
        </button>
        <button
          name="quantity"
          value="0"
          disabled={pending}
          className="px-2 py-2 text-[0.56rem] font-bold tracking-[0.1em] text-black/50 uppercase underline disabled:opacity-50"
        >
          Remove
        </button>
      </form>
      <p
        aria-live="polite"
        className={`mt-2 min-h-4 text-xs ${
          state.error ? "text-[#9b2f24]" : "text-black/50"
        }`}
      >
        {state.error ?? state.success}
      </p>
    </div>
  );
}
