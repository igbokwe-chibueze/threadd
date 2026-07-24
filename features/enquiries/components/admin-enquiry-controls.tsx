"use client";

import { useActionState } from "react";

import type { EnquiryAdminState } from "@/features/enquiries/admin-actions";

type Action = (
  state: EnquiryAdminState,
  formData: FormData,
) => Promise<EnquiryAdminState>;

const field =
  "border border-white/25 bg-[#171713] px-3 py-3 text-sm text-white outline-none focus:border-[#d7ff3f]";

export function EnquiryStatusForm({
  action,
  enquiryId,
  currentStatus,
}: {
  action: Action;
  enquiryId: string;
  currentStatus: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="enquiryId" value={enquiryId} />
      <select
        name="status"
        defaultValue={currentStatus}
        className={`${field} [&>option]:bg-[#171713]`}
      >
        {["NEW", "CONTACTED", "CONVERTED", "CLOSED", "SPAM"].map((status) => (
          <option key={status}>{status}</option>
        ))}
      </select>
      <input
        name="reason"
        maxLength={240}
        placeholder="Reason (optional)"
        className={field}
      />
      <ActionFeedback state={state} />
      <button
        disabled={pending}
        className="bg-[#d7ff3f] px-4 py-3 text-[0.6rem] font-bold tracking-[0.14em] text-black uppercase disabled:cursor-wait disabled:opacity-50"
      >
        {pending ? "Updating…" : "Update status"}
      </button>
    </form>
  );
}

export function EnquiryNoteForm({
  action,
  enquiryId,
}: {
  action: Action;
  enquiryId: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="enquiryId" value={enquiryId} />
      <textarea
        name="body"
        required
        maxLength={2_000}
        placeholder="Add context for other administrators…"
        className={`${field} min-h-28 resize-y`}
      />
      <ActionFeedback state={state} />
      <button
        disabled={pending}
        className="justify-self-start border border-white/30 px-5 py-3 text-[0.6rem] font-bold tracking-[0.14em] uppercase disabled:cursor-wait disabled:opacity-50"
      >
        {pending ? "Adding note…" : "Add internal note"}
      </button>
    </form>
  );
}

function ActionFeedback({ state }: { state: EnquiryAdminState }) {
  const text = state.error ?? state.success;
  if (!text) return null;
  return (
    <p
      role={state.error ? "alert" : "status"}
      className={
        state.error ? "text-xs text-red-200" : "text-xs text-[#d7ff3f]"
      }
    >
      {text}
    </p>
  );
}
