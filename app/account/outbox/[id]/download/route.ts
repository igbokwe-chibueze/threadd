import { cookies } from "next/headers";

import { getCurrentSession } from "@/features/auth/authorization";
import { getAccessibleEmailMessage } from "@/features/email/queries";
import { EMAIL_PREVIEW_COOKIE } from "@/lib/email/preview-access";

type DownloadRouteContext = Readonly<{
  params: Promise<{ id: string }>;
}>;

export async function GET(
  _request: Request,
  context: DownloadRouteContext,
): Promise<Response> {
  const { id } = await context.params;
  const session = await getCurrentSession();
  const cookieStore = await cookies();
  const previewToken = cookieStore.get(EMAIL_PREVIEW_COOKIE)?.value;
  const message = await getAccessibleEmailMessage(id, {
    userId: session?.user.id,
    previewToken,
  });

  if (!message) {
    return new Response("Message not found.", { status: 404 });
  }

  return new Response(message.textBody, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="threadd-${message.kind.toLowerCase()}.txt"`,
      "Cache-Control": "private, no-store",
    },
  });
}
