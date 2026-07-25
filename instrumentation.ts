import type { Instrumentation } from "next";

import { logger } from "@/lib/logging/logger";

/**
 * Capture errors observed by the Next.js server at one provider-neutral
 * boundary. The hosting platform can retain/forward these JSON lines now; a
 * future monitoring adapter can consume the same stable event shape.
 *
 * Request URLs, headers, error messages, and stacks are intentionally omitted.
 * They commonly contain tokens, search terms, form values, or customer PII.
 * `routePath` is Next.js's route template (for example `/orders/[id]`), not the
 * customer's concrete URL, so it is safe for grouping failures.
 */
export const onRequestError: Instrumentation.onRequestError = (
  error,
  request,
  context,
) => {
  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String(error.digest)
      : undefined;

  logger.error("Unhandled server request error.", {
    error,
    digest,
    method: request.method,
    routePath: context.routePath,
    routeType: context.routeType,
    routerKind: context.routerKind,
  });
};
