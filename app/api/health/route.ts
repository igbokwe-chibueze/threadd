import { db } from "@/lib/db/client";
import { logger } from "@/lib/logging/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
} as const;

/**
 * A deliberately small readiness probe for the hosting platform.
 *
 * The query proves that this application instance can reach PostgreSQL without
 * returning database, environment, version, or customer details. Failures use
 * a random correlation ID that operators can match to the structured log.
 */
export async function GET(): Promise<Response> {
  const requestId = crypto.randomUUID();

  try {
    await db.$queryRaw`SELECT 1`;

    return Response.json(
      { status: "ok" },
      { status: 200, headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    logger.error("Readiness check failed.", { error, requestId });

    return Response.json(
      { status: "unavailable", requestId },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }
}
