import { NextResponse } from "next/server";

import {
  assertDemoResetAllowed,
  DemoSafetyError,
} from "@/features/demo/policy";
import { resetDemoDatabase } from "@/features/demo/reset";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
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

    console.error("Demo reset failed", error);
    return NextResponse.json(
      { error: "Demo reset could not be completed." },
      { status: 503 },
    );
  }
}
