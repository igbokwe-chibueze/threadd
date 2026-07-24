"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { formatNaira } from "@/features/catalogue/format";

type Zone = Readonly<{
  id: string;
  name: string;
  fee: number;
  states: readonly string[];
}>;
type QuoteContextValue = {
  state: string;
  setState: (state: string) => void;
  zone?: Zone;
};
const QuoteContext = createContext<QuoteContextValue | null>(null);

export function CheckoutQuoteProvider({
  zones,
  initialState,
  children,
}: {
  zones: readonly Zone[];
  initialState?: string;
  children: ReactNode;
}) {
  const [state, setState] = useState(initialState ?? "");
  const value = useMemo(
    () => ({
      state,
      setState,
      zone: zones.find((zone) => zone.states.includes(state)),
    }),
    [state, zones],
  );
  return <QuoteContext value={value}>{children}</QuoteContext>;
}

export function useCheckoutQuote() {
  const value = useContext(QuoteContext);
  if (!value) throw new Error("Checkout quote provider is missing.");
  return value;
}

export function CheckoutSummary({
  subtotal,
  items,
}: {
  subtotal: number;
  items: readonly {
    id: string;
    quantity: number;
    productName: string;
    lineTotal: number;
  }[];
}) {
  const { state, zone } = useCheckoutQuote();
  return (
    <aside className="border border-black/20 p-6">
      <p className="text-[0.6rem] font-bold tracking-[0.15em] uppercase">
        Order summary
      </p>
      <div className="mt-6 grid gap-3 text-sm">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between gap-4">
            <span>
              {item.quantity} × {item.productName}
            </span>
            <span>{formatNaira(String(item.lineTotal))}</span>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-3 border-t border-black/20 pt-5 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatNaira(String(subtotal))}</span>
        </div>
        <div className="flex justify-between">
          <span>Delivery{zone ? ` / ${zone.name}` : ""}</span>
          <span>
            {zone
              ? formatNaira(String(zone.fee))
              : state
                ? "Unavailable"
                : "Select state"}
          </span>
        </div>
        <div className="mt-2 flex justify-between border-t border-black/20 pt-4 text-lg">
          <span>Total</span>
          <strong>
            {zone ? formatNaira(String(subtotal + zone.fee)) : "—"}
          </strong>
        </div>
      </div>
      <p className="mt-6 bg-[#171713] p-4 text-xs leading-5 text-white/65">
        Delivery is calculated from the active Admin zone for your selected
        Nigerian state. The same amount is recalculated on the server.
      </p>
    </aside>
  );
}
