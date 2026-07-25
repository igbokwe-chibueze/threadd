import { NextResponse } from "next/server";

import {
  assertDemoResetAllowed,
  DemoSafetyError,
} from "@/features/demo/policy";
import { resetDemoDatabase } from "@/features/demo/reset";
import { logger } from "@/lib/logging/logger";

export const runtime = "nodejs";

async function resetDemo(request: Request): Promise<NextResponse> {
  const authorization = request.headers.get("authorization");
  const providedSecret = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";

  try {
    assertDemoResetAllowed(providedSecret);
    const result = await resetDemoDatabase();

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof DemoSafetyError) {
      return NextResponse.json(
        { error: "Demo reset was refused by the deployment safety policy." },
        { status: 403 },
      );
    }

    logger.error("Demo reset failed.", { error });
    return NextResponse.json(
      { error: "Demo reset could not be completed." },
      { status: 503 },
    );
  }
}

/**
 * Vercel Cron invokes configured routes with GET and attaches CRON_SECRET as a
 * bearer token. The same fully authenticated handler remains available as POST
 * for an external scheduler or a controlled operator invocation.
 */
export const GET = resetDemo;
export const POST = resetDemo;
