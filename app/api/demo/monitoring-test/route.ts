import { NextResponse } from "next/server";

import {
  assertDemoResetAllowed,
  DemoSafetyError,
} from "@/features/demo/policy";
import { logger } from "@/lib/logging/logger";

export const runtime = "nodejs";

/**
 * Emit one controlled, privacy-safe portfolio monitoring event.
 *
 * This endpoint deliberately reuses the complete demo-reset safety policy:
 * portfolio mode, demo mode, datasource equality, private outbox, test payment
 * credentials, disabled OPay, and the encrypted bearer secret must all pass.
 * Customer deployments and unauthenticated callers cannot use it.
 *
 * The event contains no request data, user identity, URL, token, or arbitrary
 * caller-controlled context. It exists only to prove that Vercel runtime logs
 * receive the application's structured error boundary during release checks.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const authorization = request.headers.get("authorization");
  const providedSecret = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";

  try {
    assertDemoResetAllowed(providedSecret);

    logger.error("Controlled portfolio monitoring test event.", {
      event: "portfolio_monitoring_test",
      source: "manual_github_action",
    });

    return NextResponse.json(
      { status: "recorded" },
      {
        status: 202,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    if (error instanceof DemoSafetyError) {
      return NextResponse.json(
        {
          error: "Monitoring test was refused by the deployment safety policy.",
        },
        { status: 403 },
      );
    }

    logger.error("Controlled monitoring test failed.", { error });
    return NextResponse.json(
      { error: "Monitoring test could not be completed." },
      { status: 503 },
    );
  }
}
