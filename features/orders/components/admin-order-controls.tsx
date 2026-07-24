"use client";

import { useActionState } from "react";

import {
  type OrderAdminState,
  advanceOrderAction,
  reviewCancellationAction,
  progressReturnAction,
} from "@/features/orders/admin-actions";

export function OrderStatusControl({
  orderId,
  nextStatus,
}: {
  orderId: string;
  nextStatus?: string;
}) {
  const [state, action, pending] = useActionState(advanceOrderAction, {});
  if (!nextStatus) return null;
  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="status" value={nextStatus} />
      <input
        name="reason"
        maxLength={240}
        placeholder="Optional fulfilment note"
        className="border border-white/25 bg-transparent p-3 text-sm"
      />
      <Feedback state={state} />
      <button
        disabled={pending}
        className="bg-[#d7ff3f] px-5 py-3 text-[0.58rem] font-bold tracking-[0.12em] text-black uppercase disabled:cursor-wait disabled:opacity-55"
      >
        {pending ? "Updating…" : `Mark ${nextStatus.toLowerCase()}`}
      </button>
    </form>
  );
}

export function ReturnControl({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const operations =
    status === "REQUESTED"
      ? [
          ["APPROVE", "Approve return"],
          ["REJECT", "Reject return"],
        ]
      : status === "APPROVED"
        ? [["RECEIVE", "Mark item received"]]
        : status === "RECEIVED"
          ? [
              ["INSPECT_SELLABLE", "Inspected: sellable"],
              ["INSPECT_DAMAGED", "Inspected: not sellable"],
            ]
          : [];
  return (
    <div className="grid gap-2">
      {operations.map(([operation, label]) => (
        <ReturnOperation
          key={operation}
          orderId={orderId}
          operation={operation}
          label={label}
        />
      ))}
    </div>
  );
}

function ReturnOperation({
  orderId,
  operation,
  label,
}: {
  orderId: string;
  operation: string;
  label: string;
}) {
  const [state, action, pending] = useActionState(
    progressReturnAction.bind(
      null,
      operation as
        | "APPROVE"
        | "REJECT"
        | "RECEIVE"
        | "INSPECT_SELLABLE"
        | "INSPECT_DAMAGED",
    ),
    {},
  );
  return (
    <form action={action}>
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="reviewReason" value={label} />
      <Feedback state={state} />
      <button
        disabled={pending}
        className="w-full border border-white/25 px-4 py-3 text-[0.58rem] font-bold tracking-[0.1em] uppercase disabled:opacity-55"
      >
        {pending ? "Updating…" : label}
      </button>
    </form>
  );
}

export function CancellationControl({ orderId }: { orderId: string }) {
  const [approve, approveAction, approving] = useActionState(
    reviewCancellationAction.bind(null, "APPROVE"),
    {},
  );
  const [reject, rejectAction, rejecting] = useActionState(
    reviewCancellationAction.bind(null, "REJECT"),
    {},
  );
  return (
    <div className="grid gap-3">
      <form action={approveAction} className="grid gap-3">
        <input type="hidden" name="orderId" value={orderId} />
        <input
          name="reviewReason"
          placeholder="Review note"
          className="border border-white/25 bg-transparent p-3 text-sm"
        />
        <Feedback state={approve} />
        <button
          disabled={approving || rejecting}
          className="bg-[#d7ff3f] px-5 py-3 text-[0.58rem] font-bold tracking-[0.12em] text-black uppercase disabled:opacity-55"
        >
          {approving ? "Approving…" : "Approve and refund"}
        </button>
      </form>
      <form action={rejectAction}>
        <input type="hidden" name="orderId" value={orderId} />
        <input
          type="hidden"
          name="reviewReason"
          value="Request rejected by staff"
        />
        <Feedback state={reject} />
        <button
          disabled={approving || rejecting}
          className="w-full border border-white/25 px-5 py-3 text-[0.58rem] font-bold tracking-[0.12em] uppercase disabled:opacity-55"
        >
          {rejecting ? "Rejecting…" : "Reject request"}
        </button>
      </form>
    </div>
  );
}

function Feedback({ state }: { state: OrderAdminState }) {
  if (!state.error && !state.success) return null;
  return (
    <p
      className={
        state.error ? "text-xs text-red-200" : "text-xs text-[#d7ff3f]"
      }
      role={state.error ? "alert" : "status"}
    >
      {state.error ?? state.success}
    </p>
  );
}
