"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

type InventoryView = "stock" | "ledger";
type StockStatus = "all" | "low" | "out";

export function InventorySearchForm({
  view,
  status = "all",
  defaultValue,
}: {
  view: InventoryView;
  status?: StockStatus;
  defaultValue: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function submit(formData: FormData) {
    const query = String(formData.get("q") ?? "").trim();
    const params = new URLSearchParams({ view });
    if (query) params.set("q", query);
    if (view === "stock" && status !== "all") params.set("status", status);

    startTransition(() => {
      router.push(`/admin/inventory?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <form
      action={submit}
      className="flex w-full max-w-2xl gap-2"
      aria-busy={isPending}
    >
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={
          view === "stock"
            ? "Search product, SKU, colour, or size"
            : "Search product, SKU, reason, or administrator"
        }
        aria-label={
          view === "stock" ? "Search inventory" : "Search movement ledger"
        }
        className="h-11 min-w-0 flex-1 border border-white/25 bg-transparent px-3 text-sm outline-none placeholder:text-white/35 focus:border-[#d7ff3f]"
      />
      <button
        disabled={isPending}
        className="h-11 min-w-24 bg-[#d7ff3f] px-5 text-[0.6rem] font-bold tracking-[0.14em] text-black uppercase disabled:cursor-wait disabled:opacity-65"
      >
        {isPending ? "Searching…" : "Search"}
      </button>
      {defaultValue ? (
        <PendingLink
          href={
            view === "stock" && status !== "all"
              ? `/admin/inventory?view=stock&status=${status}`
              : `/admin/inventory?view=${view}`
          }
          className="grid h-11 min-w-17 place-items-center border border-white/25 px-4 text-[0.6rem] font-bold tracking-[0.12em] uppercase"
          pendingLabel="Clearing…"
          scroll={false}
        >
          Clear
        </PendingLink>
      ) : null}
    </form>
  );
}

export function PendingLink({
  children,
  pendingLabel = "Loading…",
  ...props
}: React.ComponentProps<typeof Link> & {
  pendingLabel?: string;
}) {
  return (
    <Link {...props}>
      <PendingLinkLabel pendingLabel={pendingLabel}>
        {children}
      </PendingLinkLabel>
    </Link>
  );
}

function PendingLinkLabel({
  children,
  pendingLabel,
}: {
  children: React.ReactNode;
  pendingLabel: string;
}) {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-live="polite"
      className={pending ? "cursor-wait opacity-65" : undefined}
    >
      {pending ? pendingLabel : children}
    </span>
  );
}
