"use client";

import Link, { useLinkStatus } from "next/link";

type PendingLinkProps = Readonly<{
  href: string;
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
}>;

export function PendingLink({
  href,
  children,
  pendingLabel,
  className,
}: PendingLinkProps) {
  return (
    <Link href={href} prefetch={false} className={className}>
      <PendingLinkContent pendingLabel={pendingLabel}>
        {children}
      </PendingLinkContent>
    </Link>
  );
}

function PendingLinkContent({
  children,
  pendingLabel,
}: Readonly<{
  children: React.ReactNode;
  pendingLabel: string;
}>) {
  const { pending } = useLinkStatus();

  return (
    <span
      className={`justify-inherit inline-flex min-w-full ${pending ? "cursor-wait opacity-55" : ""}`}
      aria-live="polite"
    >
      {pending ? pendingLabel : children}
    </span>
  );
}
