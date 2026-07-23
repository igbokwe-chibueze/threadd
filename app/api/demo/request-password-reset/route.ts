import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth/server";
import {
  createEmailPreviewToken,
  EMAIL_PREVIEW_COOKIE,
  EMAIL_PREVIEW_TTL_SECONDS,
} from "@/lib/email/preview-access";
import { withEmailPreviewToken } from "@/lib/email/preview-context";

const requestSchema = z.object({
  email: z.email().max(254),
});

export async function POST(request: Request): Promise<NextResponse> {
  const parsed = requestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Enter a valid email address." },
      { status: 400 },
    );
  }

  const previewToken = createEmailPreviewToken();
  const cookieHeader = `${EMAIL_PREVIEW_COOKIE}=${encodeURIComponent(previewToken)}`;

  await withEmailPreviewToken(previewToken, () =>
    auth.api.requestPasswordReset({
      body: {
        email: parsed.data.email,
        redirectTo: "/reset-password",
      },
      headers: new Headers({
        cookie: cookieHeader,
        origin: new URL(request.url).origin,
      }),
    }),
  );

  const response = NextResponse.json({
    message:
      "If the address belongs to an account, its message is ready in this browser.",
  });

  response.cookies.set(EMAIL_PREVIEW_COOKIE, previewToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: EMAIL_PREVIEW_TTL_SECONDS,
    path: "/",
  });

  return response;
}
