"use client";

import { useActionState, useState } from "react";

import {
  beginCheckoutAction,
  type CheckoutActionState,
} from "@/features/checkout/actions";
import { useCheckoutQuote } from "@/features/checkout/components/checkout-quote";
import type {
  PaymentProviderName,
  PaymentProviderOption,
} from "@/features/payments/types";

const states = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
] as const;
const field =
  "w-full border-b border-black/25 bg-transparent py-3 text-sm outline-none focus:border-black";

export function CheckoutForm({
  defaults,
  paymentProviders,
}: {
  defaults: {
    email?: string;
    name?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  paymentProviders: PaymentProviderOption[];
}) {
  const [state, action, pending] = useActionState<
    CheckoutActionState,
    FormData
  >(beginCheckoutAction, {});
  const quote = useCheckoutQuote();
  const [selectedProvider, setSelectedProvider] = useState<PaymentProviderName>(
    paymentProviders[0]?.id ?? "demo",
  );
  const selected = paymentProviders.find(
    (provider) => provider.id === selectedProvider,
  );
  return (
    <form action={action} className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          name="email"
          label="Email"
          type="email"
          defaultValue={defaults.email}
        />
        <Input
          name="recipientName"
          label="Recipient"
          defaultValue={defaults.name}
        />
        <Input
          name="phone"
          label="Phone"
          type="tel"
          defaultValue={defaults.phone}
        />
        <Input
          name="addressLine1"
          label="Street address"
          defaultValue={defaults.addressLine1}
        />
        <Input
          name="addressLine2"
          label="Apartment / landmark (optional)"
          optional
          defaultValue={defaults.addressLine2}
        />
        <Input name="city" label="City or town" defaultValue={defaults.city} />
        <label className="text-[0.58rem] font-bold tracking-[0.13em] uppercase">
          State
          <select
            name="state"
            required
            value={quote.state}
            onChange={(event) => quote.setState(event.target.value)}
            className={`${field} [&>option]:bg-[#ece8df]`}
          >
            <option value="">Choose state</option>
            {states.map((state) => (
              <option key={state}>{state}</option>
            ))}
          </select>
        </label>
        <Input
          name="postalCode"
          label="Postcode (optional)"
          optional
          defaultValue={defaults.postalCode}
        />
      </div>
      <fieldset className="mt-3">
        <legend className="text-[0.58rem] font-bold tracking-[0.13em] uppercase">
          Payment method
        </legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {paymentProviders.map((provider) => {
            const active = provider.id === selectedProvider;
            return (
              <label
                key={provider.id}
                className={`relative cursor-pointer border p-4 transition-colors ${
                  active
                    ? "border-[#171713] bg-[#171713] text-white"
                    : "border-black/20 bg-white/20 hover:border-black/50"
                }`}
              >
                <input
                  type="radio"
                  name="paymentProvider"
                  value={provider.id}
                  checked={active}
                  onChange={() => setSelectedProvider(provider.id)}
                  className="sr-only"
                />
                <span className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold">
                    {provider.label}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`size-3 rounded-full border ${
                      active
                        ? "border-[#d7ff3f] bg-[#d7ff3f]"
                        : "border-black/40"
                    }`}
                  />
                </span>
                <span
                  className={`mt-2 block text-xs leading-5 ${
                    active ? "text-white/60" : "text-black/50"
                  }`}
                >
                  {provider.description}
                </span>
                {provider.testMode ? (
                  <span className="mt-3 inline-flex rounded-full bg-[#d7ff3f] px-2 py-1 text-[0.5rem] font-bold tracking-[0.12em] text-[#171713] uppercase">
                    Test mode
                  </span>
                ) : null}
              </label>
            );
          })}
        </div>
      </fieldset>
      {state.error ? (
        <p role="alert" className="text-sm text-[#9b2f24]">
          {state.error}
        </p>
      ) : null}
      <button
        disabled={pending}
        className="bg-[#171713] px-6 py-4 text-[0.62rem] font-bold tracking-[0.15em] text-white uppercase disabled:cursor-wait disabled:opacity-55"
      >
        {pending
          ? "Preparing secure payment…"
          : `Continue with ${selected?.label ?? "payment"}`}
      </button>
      {selected?.testMode ? (
        <p className="text-xs leading-5 text-black/45">
          {selected.label} is operating in test mode. No real charge will be
          made.
        </p>
      ) : null}
    </form>
  );
}

function Input({
  label,
  optional,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  optional?: boolean;
}) {
  return (
    <label className="text-[0.58rem] font-bold tracking-[0.13em] uppercase">
      {label}
      <input required={!optional} className={field} {...props} />
    </label>
  );
}
