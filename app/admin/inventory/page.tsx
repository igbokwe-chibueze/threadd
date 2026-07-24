import Link from "next/link";
import { redirect } from "next/navigation";

import {
  canAccessAdmin,
  getCurrentSession,
} from "@/features/auth/authorization";
import {
  adjustInventoryAction,
  updateLowStockThresholdAction,
} from "@/features/inventory/admin-actions";
import {
  StockAdjustmentForm,
  ThresholdForm,
} from "@/features/inventory/components/inventory-controls";
import {
  InventorySearchForm,
  PendingLink,
} from "@/features/inventory/components/inventory-navigation";
import type { Prisma } from "@/generated/prisma/client";
import type { UserRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db/client";

export const metadata = {
  title: "Inventory / Studio",
  robots: { index: false },
};

const STOCK_PAGE_SIZE = 20;
const LEDGER_PAGE_SIZE = 50;
type StockStatus = "all" | "low" | "out";
type InventoryView = "stock" | "ledger";

type InventoryPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return typeof value === "string" ? value : value?.[0];
}

function pageHref(
  view: InventoryView,
  query: string,
  status: StockStatus,
  page: number,
) {
  const params = new URLSearchParams({ view });
  if (query) params.set("q", query);
  if (view === "stock" && status !== "all") params.set("status", status);
  if (page > 1) params.set("page", String(page));
  return `/admin/inventory?${params.toString()}`;
}

export default async function InventoryPage({
  searchParams,
}: InventoryPageProps) {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");
  if (!canAccessAdmin(session.user.role as UserRole)) redirect("/account");

  const params = await searchParams;
  const view: InventoryView =
    first(params.view) === "ledger" ? "ledger" : "stock";
  const statusValue = first(params.status);
  const status: StockStatus =
    statusValue === "low" || statusValue === "out" ? statusValue : "all";
  const query = first(params.q)?.trim() ?? "";
  const requestedPage = Math.max(1, Number(first(params.page)) || 1);
  const allVariants = await db.productVariant.findMany({
    select: { inventoryQuantity: true, lowStockThreshold: true },
  });
  const totalStock = allVariants.reduce(
    (sum, variant) => sum + variant.inventoryQuantity,
    0,
  );
  const lowStock = allVariants.filter(
    (variant) =>
      variant.inventoryQuantity > 0 &&
      variant.inventoryQuantity <= variant.lowStockThreshold,
  ).length;
  const soldOut = allVariants.filter(
    (variant) => variant.inventoryQuantity === 0,
  ).length;

  return (
    <main className="min-h-screen bg-[#171713] px-5 py-8 text-[#f4f0e7] sm:px-10 lg:px-14">
      <header className="flex items-center justify-between border-b border-white/20 pb-5">
        <Link href="/admin" className="text-sm font-bold uppercase">
          THREADD / Studio
        </Link>
        <Link
          href="/admin/catalogue"
          className="text-[0.62rem] font-bold tracking-[0.16em] text-[#d7ff3f] uppercase"
        >
          Catalogue →
        </Link>
      </header>

      <section className="py-14">
        <p className="text-[0.62rem] font-bold tracking-[0.2em] text-[#d7ff3f] uppercase">
          Phase 5 / Inventory
        </p>
        <h1 className="mt-4 text-6xl font-medium tracking-[-0.07em] sm:text-8xl">
          Every unit, accounted for.
        </h1>
        <div className="mt-10 grid border-y border-white/20 sm:grid-cols-3">
          <Metric label="Total units" value={totalStock} />
          <Metric label="Low-stock variants" value={lowStock} />
          <Metric label="Sold-out variants" value={soldOut} />
        </div>
      </section>

      <nav
        aria-label="Inventory views"
        className="sticky top-0 z-20 flex border-y border-white/20 bg-[#171713]/95 backdrop-blur-md"
      >
        <ViewLink
          active={view === "stock"}
          href="/admin/inventory?view=stock"
          label="Stock controls"
        />
        <ViewLink
          active={view === "ledger"}
          href="/admin/inventory?view=ledger"
          label="Movement ledger"
        />
      </nav>

      {view === "stock" ? (
        <StockView
          query={query}
          status={status}
          requestedPage={requestedPage}
          lowStock={lowStock}
          soldOut={soldOut}
          totalVariants={allVariants.length}
        />
      ) : (
        <LedgerView query={query} requestedPage={requestedPage} />
      )}
    </main>
  );
}

async function StockView({
  query,
  status,
  requestedPage,
  lowStock,
  soldOut,
  totalVariants,
}: {
  query: string;
  status: StockStatus;
  requestedPage: number;
  lowStock: number;
  soldOut: number;
  totalVariants: number;
}) {
  const searchWhere: Prisma.ProductVariantWhereInput = query
    ? {
        OR: [
          { sku: { contains: query, mode: "insensitive" } },
          { colour: { contains: query, mode: "insensitive" } },
          { size: { contains: query, mode: "insensitive" } },
          { product: { name: { contains: query, mode: "insensitive" } } },
        ],
      }
    : {};
  const matchingVariants = await db.productVariant.findMany({
    where: searchWhere,
    orderBy: [{ product: { name: "asc" } }, { colour: "asc" }, { size: "asc" }],
    include: {
      product: { select: { name: true, slug: true, status: true } },
    },
  });
  const filteredVariants = matchingVariants.filter((variant) => {
    if (status === "out") return variant.inventoryQuantity === 0;
    if (status === "low") {
      return (
        variant.inventoryQuantity > 0 &&
        variant.inventoryQuantity <= variant.lowStockThreshold
      );
    }
    return true;
  });
  const pageCount = Math.max(
    1,
    Math.ceil(filteredVariants.length / STOCK_PAGE_SIZE),
  );
  const page = Math.min(requestedPage, pageCount);
  const variants = filteredVariants.slice(
    (page - 1) * STOCK_PAGE_SIZE,
    page * STOCK_PAGE_SIZE,
  );

  return (
    <section className="py-10">
      <div className="flex flex-col gap-5 border-b border-white/25 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[0.58rem] font-bold tracking-[0.16em] text-white/45 uppercase">
            Live stock
          </p>
          <h2 className="mt-2 text-4xl font-medium tracking-[-0.05em]">
            Variant controls
          </h2>
        </div>
        <InventorySearchForm
          view="stock"
          status={status}
          defaultValue={query}
        />
      </div>

      <div className="flex flex-wrap gap-2 border-b border-white/15 py-5">
        <StatusLink
          active={status === "all"}
          href={pageHref("stock", query, "all", 1)}
          label="All"
          count={totalVariants}
        />
        <StatusLink
          active={status === "low"}
          href={pageHref("stock", query, "low", 1)}
          label="Low stock"
          count={lowStock}
        />
        <StatusLink
          active={status === "out"}
          href={pageHref("stock", query, "out", 1)}
          label="Sold out"
          count={soldOut}
        />
      </div>

      <p className="pt-6 text-xs text-white/45">
        {filteredVariants.length} matching{" "}
        {filteredVariants.length === 1 ? "variant" : "variants"}
      </p>
      {variants.length ? (
        <div className="grid gap-4 py-6 lg:grid-cols-2">
          {variants.map((variant) => {
            const isOut = variant.inventoryQuantity === 0;
            const isLow =
              !isOut && variant.inventoryQuantity <= variant.lowStockThreshold;
            return (
              <article key={variant.id} className="border border-white/15 p-5">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="text-lg font-medium">
                      {variant.product.name}
                    </p>
                    <p className="mt-1 text-xs text-white/45">
                      {variant.sku} / {variant.colour} / {variant.size}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-medium">
                      {variant.inventoryQuantity}
                    </p>
                    <p
                      className={`mt-1 text-[0.56rem] font-bold tracking-[0.12em] uppercase ${
                        isOut
                          ? "text-red-200"
                          : isLow
                            ? "text-amber-200"
                            : "text-[#d7ff3f]"
                      }`}
                    >
                      {isOut ? "Sold out" : isLow ? "Low stock" : "Healthy"}
                    </p>
                  </div>
                </div>
                <ThresholdForm
                  action={updateLowStockThresholdAction.bind(null, variant.id)}
                  value={variant.lowStockThreshold}
                />
                <details className="mt-4 border-t border-white/15">
                  <summary className="cursor-pointer pt-4 text-[0.6rem] font-bold tracking-[0.14em] uppercase">
                    Adjust stock
                  </summary>
                  <StockAdjustmentForm
                    action={adjustInventoryAction.bind(null, variant.id)}
                  />
                </details>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState message="No variants match this search and stock filter." />
      )}
      <Pagination
        view="stock"
        query={query}
        status={status}
        page={page}
        pageCount={pageCount}
      />
    </section>
  );
}

async function LedgerView({
  query,
  requestedPage,
}: {
  query: string;
  requestedPage: number;
}) {
  const where: Prisma.InventoryMovementWhereInput = query
    ? {
        OR: [
          { reason: { contains: query, mode: "insensitive" } },
          { variant: { sku: { contains: query, mode: "insensitive" } } },
          {
            variant: {
              product: { name: { contains: query, mode: "insensitive" } },
            },
          },
          { actor: { name: { contains: query, mode: "insensitive" } } },
        ],
      }
    : {};
  const total = await db.inventoryMovement.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / LEDGER_PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const movements = await db.inventoryMovement.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * LEDGER_PAGE_SIZE,
    take: LEDGER_PAGE_SIZE,
    include: {
      variant: { include: { product: { select: { name: true } } } },
      actor: { select: { name: true, email: true } },
    },
  });

  return (
    <section className="py-10">
      <div className="flex flex-col gap-5 border-b border-white/25 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[0.58rem] font-bold tracking-[0.16em] text-white/45 uppercase">
            Immutable ledger
          </p>
          <h2 className="mt-2 text-4xl font-medium tracking-[-0.05em]">
            Movement history
          </h2>
        </div>
        <InventorySearchForm view="ledger" defaultValue={query} />
      </div>
      <p className="pt-6 text-xs text-white/45">
        {total} matching {total === 1 ? "movement" : "movements"}
      </p>
      {movements.length ? (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-220 text-left text-sm">
            <thead className="border-b border-white/25 text-[0.56rem] tracking-[0.14em] text-white/45 uppercase">
              <tr>
                <th className="py-4">When</th>
                <th>Product / variant</th>
                <th>Change</th>
                <th>Before → after</th>
                <th>Reason</th>
                <th>Actor</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((movement) => (
                <tr key={movement.id} className="border-b border-white/10">
                  <td className="py-4 text-xs text-white/50">
                    {movement.createdAt.toLocaleString("en-NG")}
                  </td>
                  <td>
                    {movement.variant.product.name}
                    <span className="block text-xs text-white/40">
                      {movement.variant.sku}
                    </span>
                  </td>
                  <td
                    className={
                      movement.quantityDelta > 0
                        ? "text-[#d7ff3f]"
                        : "text-red-200"
                    }
                  >
                    {movement.quantityDelta > 0 ? "+" : ""}
                    {movement.quantityDelta}
                  </td>
                  <td>
                    {movement.quantityBefore} → {movement.quantityAfter}
                  </td>
                  <td className="max-w-xs text-xs leading-5 text-white/60">
                    {movement.reason}
                  </td>
                  <td className="text-xs text-white/50">
                    {movement.actor?.name ?? "System seed"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState message="No inventory movements match this search." />
      )}
      <Pagination
        view="ledger"
        query={query}
        status="all"
        page={page}
        pageCount={pageCount}
      />
    </section>
  );
}

function ViewLink({
  active,
  href,
  label,
}: {
  active: boolean;
  href: string;
  label: string;
}) {
  return (
    <PendingLink
      href={href}
      scroll={false}
      pendingLabel={`Loading ${label.toLocaleLowerCase()}…`}
      aria-current={active ? "page" : undefined}
      className={`border-r border-white/20 px-5 py-4 text-[0.62rem] font-bold tracking-[0.14em] uppercase ${
        active ? "bg-[#d7ff3f] text-black" : "text-white/60 hover:text-white"
      }`}
    >
      {label}
    </PendingLink>
  );
}

function StatusLink({
  active,
  href,
  label,
  count,
}: {
  active: boolean;
  href: string;
  label: string;
  count: number;
}) {
  return (
    <PendingLink
      href={href}
      scroll={false}
      pendingLabel="Filtering…"
      aria-current={active ? "page" : undefined}
      className={`border px-4 py-2 text-[0.6rem] font-bold tracking-[0.12em] uppercase ${
        active
          ? "border-[#d7ff3f] bg-[#d7ff3f] text-black"
          : "border-white/20 text-white/60 hover:border-white/60 hover:text-white"
      }`}
    >
      {label} <span className="ml-2 opacity-60">{count}</span>
    </PendingLink>
  );
}

function Pagination({
  view,
  query,
  status,
  page,
  pageCount,
}: {
  view: InventoryView;
  query: string;
  status: StockStatus;
  page: number;
  pageCount: number;
}) {
  if (pageCount <= 1) return null;
  return (
    <nav
      aria-label={`${view === "stock" ? "Inventory" : "Ledger"} pagination`}
      className="mt-8 flex items-center justify-between border-t border-white/20 pt-5 text-sm"
    >
      {page > 1 ? (
        <PendingLink
          href={pageHref(view, query, status, page - 1)}
          scroll={false}
          pendingLabel="Loading…"
        >
          ← Previous
        </PendingLink>
      ) : (
        <span className="text-white/25">← Previous</span>
      )}
      <span className="text-[0.6rem] tracking-[0.14em] text-white/50 uppercase">
        Page {page} of {pageCount}
      </span>
      {page < pageCount ? (
        <PendingLink
          href={pageHref(view, query, status, page + 1)}
          scroll={false}
          pendingLabel="Loading…"
        >
          Next →
        </PendingLink>
      ) : (
        <span className="text-white/25">Next →</span>
      )}
    </nav>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="my-6 grid min-h-56 place-items-center border border-white/15 text-center text-sm text-white/50">
      {message}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-white/20 py-6 sm:border-r sm:px-6 sm:first:pl-0 sm:last:border-0">
      <p className="text-4xl font-medium">{value}</p>
      <p className="mt-2 text-[0.58rem] tracking-[0.14em] text-white/45 uppercase">
        {label}
      </p>
    </div>
  );
}
