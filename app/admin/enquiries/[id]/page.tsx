import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  canAccessAdmin,
  getCurrentSession,
} from "@/features/auth/authorization";
import {
  addEnquiryNoteAction,
  updateEnquiryStatusAction,
} from "@/features/enquiries/admin-actions";
import {
  EnquiryNoteForm,
  EnquiryStatusForm,
} from "@/features/enquiries/components/admin-enquiry-controls";
import type { UserRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db/client";

type Props = { params: Promise<{ id: string }> };

export default async function EnquiryDetailPage({ params }: Props) {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");
  if (!canAccessAdmin(session.user.role as UserRole)) redirect("/account");

  const { id } = await params;
  const enquiry = await db.enquiry.findUnique({
    where: { id },
    include: {
      product: { select: { name: true, slug: true } },
      customer: { select: { name: true } },
      notes: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true } } },
      },
      statusHistory: {
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { name: true } } },
      },
    },
  });
  if (!enquiry) notFound();
  const reference = `ENQ-${enquiry.id.slice(-8).toUpperCase()}`;

  return (
    <main className="min-h-screen bg-[#171713] px-5 py-8 text-[#f4f0e7] sm:px-10 lg:px-14">
      <header className="flex items-center justify-between border-b border-white/20 pb-5">
        <Link href="/admin/enquiries" className="text-sm font-bold uppercase">
          ← Enquiry inbox
        </Link>
        <span className="text-xs text-white/45">{reference}</span>
      </header>
      <section className="grid gap-10 py-12 lg:grid-cols-[1.4fr_0.6fr]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="bg-[#d7ff3f] px-3 py-2 text-[0.58rem] font-bold tracking-[0.12em] text-black uppercase">
              {enquiry.status}
            </span>
            <span className="text-xs text-white/45">
              {enquiry.kind.replaceAll("_", " ")} /{" "}
              {enquiry.createdAt.toLocaleString("en-NG")}
            </span>
          </div>
          <h1 className="mt-7 text-5xl font-medium tracking-[-0.06em] sm:text-7xl">
            {enquiry.name}
          </h1>
          <div className="mt-6 grid gap-2 text-sm text-white/55">
            <a href={`mailto:${enquiry.email}`}>{enquiry.email}</a>
            {enquiry.phone ? (
              <a href={`tel:${enquiry.phone}`}>{enquiry.phone}</a>
            ) : null}
            {enquiry.product ? (
              <Link href={`/products/${enquiry.product.slug}`} target="_blank">
                Product: {enquiry.product.name} ↗
              </Link>
            ) : null}
            {enquiry.customer ? (
              <span>Account: {enquiry.customer.name}</span>
            ) : null}
          </div>
          <article className="mt-10 border border-white/20 p-6">
            <p className="text-[0.58rem] font-bold tracking-[0.14em] text-white/40 uppercase">
              Customer message
            </p>
            <p className="mt-5 text-base leading-7 whitespace-pre-wrap text-white/80">
              {enquiry.message}
            </p>
          </article>
          <section className="mt-10">
            <h2 className="text-2xl font-medium">Internal notes</h2>
            <div className="mt-5">
              <EnquiryNoteForm
                action={addEnquiryNoteAction}
                enquiryId={enquiry.id}
              />
            </div>
            <div className="mt-6 grid gap-3">
              {enquiry.notes.map((note) => (
                <article
                  key={note.id}
                  className="border-l border-white/25 pl-4"
                >
                  <p className="text-sm leading-6 whitespace-pre-wrap">
                    {note.body}
                  </p>
                  <p className="mt-2 text-xs text-white/35">
                    {note.author.name} /{" "}
                    {note.createdAt.toLocaleString("en-NG")}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>
        <aside className="grid content-start gap-8">
          <section className="border border-white/20 p-5">
            <h2 className="mb-5 text-lg font-medium">Workflow status</h2>
            <EnquiryStatusForm
              action={updateEnquiryStatusAction}
              enquiryId={enquiry.id}
              currentStatus={enquiry.status}
            />
          </section>
          <section>
            <h2 className="text-lg font-medium">History</h2>
            <ol className="mt-5 grid gap-5 border-l border-white/20 pl-5">
              {enquiry.statusHistory.map((item) => (
                <li key={item.id}>
                  <p className="text-xs font-bold tracking-[0.1em] uppercase">
                    {item.fromStatus ? `${item.fromStatus} → ` : ""}
                    {item.toStatus}
                  </p>
                  {item.reason ? (
                    <p className="mt-1 text-xs leading-5 text-white/50">
                      {item.reason}
                    </p>
                  ) : null}
                  <p className="mt-1 text-[0.65rem] text-white/30">
                    {item.actor?.name ?? "System"} /{" "}
                    {item.createdAt.toLocaleString("en-NG")}
                  </p>
                </li>
              ))}
            </ol>
          </section>
          <section className="text-xs leading-5 text-white/40">
            Customer preview:{" "}
            {enquiry.customerNotifiedAt ? "created" : "not created"}
            <br />
            Admin preview: {enquiry.adminNotifiedAt ? "created" : "not created"}
          </section>
        </aside>
      </section>
    </main>
  );
}
