import Link from "next/link";
import { redirect } from "next/navigation";

import {
  canAccessAdmin,
  getCurrentSession,
} from "@/features/auth/authorization";
import { EnquirySearch } from "@/features/enquiries/components/enquiry-search";
import type { Prisma } from "@/generated/prisma/client";
import type {
  EnquiryKind,
  EnquiryStatus,
  UserRole,
} from "@/generated/prisma/enums";
import { db } from "@/lib/db/client";

export const metadata = {
  title: "Enquiries / Studio",
  robots: { index: false },
};
const PAGE_SIZE = 25;

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
const first = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : value?.[0];

function href(query: string, status: string, kind: string, page = 1) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (status !== "ALL") params.set("status", status);
  if (kind !== "ALL") params.set("kind", kind);
  if (page > 1) params.set("page", String(page));
  return `/admin/enquiries?${params}`;
}

export default async function EnquiriesPage({ searchParams }: Props) {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");
  if (!canAccessAdmin(session.user.role as UserRole)) redirect("/account");

  const params = await searchParams;
  const query = first(params.q)?.trim() ?? "";
  const statuses = ["NEW", "CONTACTED", "CONVERTED", "CLOSED", "SPAM"];
  const kinds = ["GENERAL", "PRODUCT"];
  const status = statuses.includes(first(params.status) ?? "")
    ? (first(params.status) as EnquiryStatus)
    : "ALL";
  const kind = kinds.includes(first(params.kind) ?? "")
    ? (first(params.kind) as EnquiryKind)
    : "ALL";
  const where: Prisma.EnquiryWhereInput = {
    ...(status !== "ALL" ? { status } : {}),
    ...(kind !== "ALL" ? { kind } : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { message: { contains: query, mode: "insensitive" } },
            { product: { name: { contains: query, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
  const [total, counts] = await Promise.all([
    db.enquiry.count({ where }),
    db.enquiry.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(
    Math.max(1, Number(first(params.page)) || 1),
    pageCount,
  );
  const enquiries = await db.enquiry.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: { product: { select: { name: true } } },
  });
  const countFor = (value: string) =>
    counts.find((item) => item.status === value)?._count._all ?? 0;

  return (
    <main className="min-h-screen bg-[#171713] px-5 py-8 text-[#f4f0e7] sm:px-10 lg:px-14">
      <header className="flex items-center justify-between border-b border-white/20 pb-5">
        <Link href="/admin" className="text-sm font-bold uppercase">
          THREADD / Studio
        </Link>
        <span className="text-[0.62rem] font-bold tracking-[0.16em] text-[#d7ff3f] uppercase">
          Enquiry inbox
        </span>
      </header>
      <section className="py-14">
        <p className="text-[0.62rem] font-bold tracking-[0.2em] text-[#d7ff3f] uppercase">
          Phase 6A / Enquiries
        </p>
        <h1 className="mt-4 text-6xl font-medium tracking-[-0.07em] sm:text-8xl">
          Every question, in context.
        </h1>
      </section>
      <section>
        <div className="flex flex-col gap-5 border-y border-white/20 py-5 lg:flex-row lg:items-center lg:justify-between">
          <EnquirySearch query={query} status={status} kind={kind} />
          <div className="flex flex-wrap gap-2">
            {["ALL", ...statuses].map((value) => (
              <Link
                key={value}
                href={href(query, value, kind)}
                className={`border px-3 py-2 text-[0.56rem] font-bold tracking-[0.1em] uppercase ${
                  status === value
                    ? "border-[#d7ff3f] bg-[#d7ff3f] text-black"
                    : "border-white/20 text-white/55"
                }`}
              >
                {value} {value === "ALL" ? "" : countFor(value)}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex gap-2 border-b border-white/15 py-4">
          {["ALL", ...kinds].map((value) => (
            <Link
              key={value}
              href={href(query, status, value)}
              className={`text-[0.58rem] font-bold tracking-[0.12em] uppercase ${
                kind === value ? "text-[#d7ff3f]" : "text-white/40"
              }`}
            >
              {value}
            </Link>
          ))}
        </div>
        <p className="py-5 text-xs text-white/45">{total} matching enquiries</p>
        <div className="grid gap-3">
          {enquiries.map((enquiry) => (
            <Link
              key={enquiry.id}
              href={`/admin/enquiries/${enquiry.id}`}
              className="grid gap-3 border border-white/15 p-5 transition hover:border-[#d7ff3f] md:grid-cols-[8rem_1fr_10rem_auto]"
            >
              <span className="text-[0.58rem] font-bold tracking-[0.12em] text-[#d7ff3f] uppercase">
                {enquiry.status}
              </span>
              <span>
                <span className="block font-medium">{enquiry.name}</span>
                <span className="mt-1 block truncate text-xs text-white/45">
                  {enquiry.product?.name ?? "General enquiry"} —{" "}
                  {enquiry.message}
                </span>
              </span>
              <span className="text-xs text-white/45">{enquiry.email}</span>
              <time className="text-xs text-white/35">
                {enquiry.createdAt.toLocaleDateString("en-NG")}
              </time>
            </Link>
          ))}
          {!enquiries.length ? (
            <div className="grid min-h-56 place-items-center border border-dashed border-white/20 text-sm text-white/45">
              No enquiries match these filters.
            </div>
          ) : null}
        </div>
        {pageCount > 1 ? (
          <nav className="mt-8 flex justify-between border-t border-white/20 pt-5 text-sm">
            {page > 1 ? (
              <Link href={href(query, status, kind, page - 1)}>← Previous</Link>
            ) : (
              <span />
            )}
            <span className="text-white/45">
              Page {page} of {pageCount}
            </span>
            {page < pageCount ? (
              <Link href={href(query, status, kind, page + 1)}>Next →</Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </section>
    </main>
  );
}
