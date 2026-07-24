"use client";

import { useActionState } from "react";

import type { AccountActionState } from "@/features/account/actions";
import {
  createAddressAction,
  updateProfileAction,
} from "@/features/account/actions";

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

export function ProfileForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState(updateProfileAction, {});
  return (
    <form action={action} className="grid gap-4">
      <label className="text-[0.58rem] font-bold tracking-[0.13em] uppercase">
        Full name
        <input name="name" defaultValue={name} required className={field} />
      </label>
      <Feedback state={state} />
      <button
        disabled={pending}
        className="justify-self-start border border-black/25 px-5 py-3 text-[0.58rem] font-bold tracking-[0.12em] uppercase disabled:cursor-wait disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}

export function AddressForm({ defaultName }: { defaultName: string }) {
  const [state, action, pending] = useActionState(createAddressAction, {});
  return (
    <form action={action} className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Input name="label" label="Label" placeholder="Home" />
        <Input
          name="recipientName"
          label="Recipient"
          defaultValue={defaultName}
        />
        <Input name="phone" label="Phone" type="tel" />
        <Input name="line1" label="Street address" />
        <Input name="line2" label="Apartment / landmark (optional)" />
        <Input name="city" label="City or town" />
        <label className="text-[0.58rem] font-bold tracking-[0.13em] uppercase">
          State
          <select
            name="state"
            required
            className={`${field} [&>option]:bg-[#ece8df]`}
          >
            <option value="">Choose state</option>
            {states.map((stateName) => (
              <option key={stateName}>{stateName}</option>
            ))}
          </select>
        </label>
        <Input name="postalCode" label="Postcode (optional)" />
      </div>
      <label className="flex items-center gap-2 text-xs">
        <input name="isDefault" type="checkbox" />
        Make this my default delivery address
      </label>
      <Feedback state={state} />
      <button
        disabled={pending}
        className="justify-self-start bg-[#171713] px-6 py-3 text-[0.6rem] font-bold tracking-[0.14em] text-white uppercase disabled:cursor-wait disabled:opacity-50"
      >
        {pending ? "Saving address…" : "Save address"}
      </button>
    </form>
  );
}

export function AccountMutationButton({
  action,
  label,
  pendingLabel,
}: {
  action: (
    state: AccountActionState,
    formData: FormData,
  ) => Promise<AccountActionState>;
  label: string;
  pendingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction}>
      <button
        disabled={pending}
        className="text-[0.56rem] font-bold tracking-[0.1em] uppercase underline disabled:cursor-wait disabled:opacity-50"
      >
        {pending ? pendingLabel : label}
      </button>
      <Feedback state={state} />
    </form>
  );
}

function Input({
  name,
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  name: string;
  label: string;
}) {
  return (
    <label className="text-[0.58rem] font-bold tracking-[0.13em] uppercase">
      {label}
      <input
        name={name}
        required={!label.includes("optional")}
        className={field}
        {...props}
      />
    </label>
  );
}

function Feedback({ state }: { state: AccountActionState }) {
  if (!state.error && !state.success) return null;
  return (
    <p
      role={state.error ? "alert" : "status"}
      className={`text-xs ${state.error ? "text-[#9b2f24]" : "text-black/55"}`}
    >
      {state.error ?? state.success}
    </p>
  );
}
