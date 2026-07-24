"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function EnquirySearch({
  query,
  status,
  kind,
}: {
  query: string;
  status: string;
  kind: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(query);
  const [pending, startTransition] = useTransition();

  function search(formData: FormData) {
    const params = new URLSearchParams();
    const nextQuery = String(formData.get("q") ?? "").trim();
    if (nextQuery) params.set("q", nextQuery);
    if (status !== "ALL") params.set("status", status);
    if (kind !== "ALL") params.set("kind", kind);
    startTransition(() => router.push(`/admin/enquiries?${params}`));
  }

  return (
    <form action={search} className="flex w-full max-w-md">
      <input
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search name, email, message, or product"
        className="min-w-0 flex-1 border border-white/25 bg-transparent px-3 py-3 text-sm outline-none focus:border-[#d7ff3f]"
      />
      <button
        disabled={pending}
        className="bg-[#d7ff3f] px-5 text-[0.6rem] font-bold tracking-[0.12em] text-black uppercase disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Searching…" : "Search"}
      </button>
    </form>
  );
}
