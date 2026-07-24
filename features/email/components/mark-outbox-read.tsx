"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function MarkOutboxRead({
  hasUnread,
}: Readonly<{ hasUnread: boolean }>) {
  const router = useRouter();

  useEffect(() => {
    if (!hasUnread) return;

    const controller = new AbortController();

    void fetch("/api/outbox/read", {
      method: "POST",
      signal: controller.signal,
    }).then((response) => {
      if (response.ok) router.refresh();
    });

    return () => controller.abort();
  }, [hasUnread, router]);

  return null;
}
