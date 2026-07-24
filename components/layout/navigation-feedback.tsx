"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function NavigationFeedback() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [destinationUrl, setDestinationUrl] = useState<string | null>(null);
  const currentUrl = `${pathname}${searchParams.size ? `?${searchParams}` : ""}`;
  const isNavigating = destinationUrl !== null && destinationUrl !== currentUrl;

  useEffect(() => {
    function beginNavigation(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const link =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[href]")
          : null;
      if (
        !link ||
        link.target === "_blank" ||
        link.hasAttribute("download") ||
        link.getAttribute("aria-disabled") === "true"
      ) {
        return;
      }

      const destination = new URL(link.href, window.location.href);
      if (
        destination.origin !== window.location.origin ||
        (destination.pathname === window.location.pathname &&
          destination.search === window.location.search)
      ) {
        return;
      }

      setDestinationUrl(`${destination.pathname}${destination.search}`);
    }

    document.addEventListener("click", beginNavigation, true);
    return () => document.removeEventListener("click", beginNavigation, true);
  }, []);

  if (!isNavigating) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 overflow-hidden bg-black/10"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <span className="block h-full w-1/3 animate-pulse bg-[#d7ff3f] motion-reduce:w-full motion-reduce:animate-none" />
      <span className="sr-only">Loading page…</span>
    </div>
  );
}
