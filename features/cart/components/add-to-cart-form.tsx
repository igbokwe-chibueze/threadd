"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import { addToCartAction, type CartActionState } from "@/features/cart/actions";

type Variant = Readonly<{
  id: string;
  size: string;
  colour: string;
  inventoryQuantity: number;
}>;

export function AddToCartForm({ variants }: { variants: readonly Variant[] }) {
  const [state, action, pending] = useActionState<CartActionState, FormData>(
    addToCartAction,
    {},
  );
  const sizes = useMemo(
    () => [...new Set(variants.map((variant) => variant.size))],
    [variants],
  );
  const [size, setSize] = useState(sizes[0] ?? "");
  const colours = useMemo(
    () => [
      ...new Set(
        variants
          .filter((variant) => variant.size === size)
          .map((variant) => variant.colour),
      ),
    ],
    [variants, size],
  );
  const [chosenColour, setChosenColour] = useState(colours[0] ?? "");
  const colour = colours.includes(chosenColour) ? chosenColour : colours[0];
  const selected = variants.find(
    (variant) => variant.size === size && variant.colour === colour,
  );

  return (
    <form action={action} className="mt-8 border-t border-black/20 pt-7">
      <input type="hidden" name="variantId" value={selected?.id ?? ""} />
      <input type="hidden" name="quantity" value="1" />
      <div className="grid gap-6 sm:grid-cols-2">
        <fieldset>
          <legend className="text-[0.58rem] font-bold tracking-[0.16em] uppercase">
            Choose size
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {sizes.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={size === option}
                onClick={() => {
                  setSize(option);
                  setChosenColour("");
                }}
                className={`min-w-12 border px-3 py-2 text-xs ${
                  size === option
                    ? "border-black bg-black text-white"
                    : "border-black/25"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-[0.58rem] font-bold tracking-[0.16em] uppercase">
            Choose colour
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {colours.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={colour === option}
                onClick={() => setChosenColour(option)}
                className={`border px-3 py-2 text-xs ${
                  colour === option
                    ? "border-black bg-black text-white"
                    : "border-black/25"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
      <button
        disabled={pending || !selected || selected.inventoryQuantity < 1}
        className="mt-6 w-full bg-[#d7ff3f] px-6 py-4 text-[0.65rem] font-bold tracking-[0.16em] text-black uppercase disabled:cursor-not-allowed disabled:bg-black/15 disabled:text-black/40"
      >
        {pending
          ? "Adding to cart…"
          : !selected || selected.inventoryQuantity < 1
            ? "Selected option is sold out"
            : "Add to cart"}
      </button>
      <div aria-live="polite" className="mt-3 min-h-5 text-sm">
        {state.error ? <p className="text-[#9b2f24]">{state.error}</p> : null}
        {state.success ? (
          <p>
            {state.success}{" "}
            <Link href="/cart" className="font-bold underline">
              View cart
            </Link>
          </p>
        ) : null}
      </div>
    </form>
  );
}
