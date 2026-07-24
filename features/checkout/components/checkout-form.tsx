"use client";

import { useActionState } from "react";

import {
  beginCheckoutAction,
  type CheckoutActionState,
} from "@/features/checkout/actions";
import { useCheckoutQuote } from "@/features/checkout/components/checkout-quote";

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
  testMode,
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
  testMode: boolean;
}) {
  const [state, action, pending] = useActionState<
    CheckoutActionState,
    FormData
  >(beginCheckoutAction, {});
  const quote = useCheckoutQuote();
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
          : testMode
            ? "Continue to test payment"
            : "Continue to Paystack"}
      </button>
      {testMode ? (
        <p className="text-xs leading-5 text-black/45">
          Test adapter active because Paystack test keys are not configured. No
          real charge will be made.
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
