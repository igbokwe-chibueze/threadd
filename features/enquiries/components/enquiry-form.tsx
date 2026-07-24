"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  submitEnquiryAction,
  type EnquiryActionState,
} from "@/features/enquiries/public-actions";

const initialState: EnquiryActionState = {};
const inputClass =
  "w-full border-b border-black/25 bg-transparent px-0 py-3 text-sm outline-none transition focus:border-black";

type Props = Readonly<{
  kind: "GENERAL" | "PRODUCT";
  productId?: string;
  productName?: string;
  defaultName?: string;
  defaultEmail?: string;
}>;

export function EnquiryForm(props: Props) {
  const [state, action, pending] = useActionState(
    submitEnquiryAction,
    initialState,
  );

  if (state.success) {
    return (
      <div
        className="border border-black/20 bg-white/40 p-6"
        aria-live="polite"
      >
        <p className="text-lg font-medium">{state.success}</p>
        {state.reference ? (
          <p className="mt-2 text-xs text-black/55">
            Reference: {state.reference}
          </p>
        ) : null}
        {state.outboxUrl ? (
          <Link
            href={state.outboxUrl}
            className="mt-5 inline-flex bg-[#171713] px-5 py-3 text-[0.62rem] font-bold tracking-[0.14em] text-white uppercase"
          >
            View confirmation in Demo Outbox
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="kind" value={props.kind} />
      {props.productId ? (
        <input type="hidden" name="productId" value={props.productId} />
      ) : null}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor={`${props.productId ?? "general"}-company`}>
          Company website
        </label>
        <input
          id={`${props.productId ?? "general"}-company`}
          name="companyWebsite"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      {props.productName ? (
        <p className="text-xs text-black/55">About: {props.productName}</p>
      ) : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-[0.6rem] font-bold tracking-[0.15em] uppercase">
          Name
          <input
            className={inputClass}
            name="name"
            defaultValue={props.defaultName}
            autoComplete="name"
            required
          />
        </label>
        <label className="text-[0.6rem] font-bold tracking-[0.15em] uppercase">
          Email
          <input
            className={inputClass}
            name="email"
            type="email"
            defaultValue={props.defaultEmail}
            autoComplete="email"
            required
          />
        </label>
      </div>
      <label className="text-[0.6rem] font-bold tracking-[0.15em] uppercase">
        Phone <span className="font-normal text-black/40">(optional)</span>
        <input
          className={inputClass}
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+234 800 000 0000"
        />
      </label>
      <label className="text-[0.6rem] font-bold tracking-[0.15em] uppercase">
        Message
        <textarea
          className={`${inputClass} min-h-28 resize-y`}
          name="message"
          placeholder={
            props.productName
              ? "Ask about fit, fabric, availability, or styling…"
              : "How can we help?"
          }
          required
        />
      </label>
      {state.error ? (
        <p className="text-sm text-[#9b2f24]" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="justify-self-start bg-[#171713] px-6 py-3 text-[0.62rem] font-bold tracking-[0.15em] text-white uppercase disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send enquiry"}
      </button>
    </form>
  );
}
