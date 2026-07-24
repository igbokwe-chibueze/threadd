import {
  canAccessAdmin,
  getCurrentSession,
} from "@/features/auth/authorization";
import { getAdminEmailMessage } from "@/features/email/queries";
import type { UserRole } from "@/generated/prisma/enums";

type DownloadRouteContext = Readonly<{
  params: Promise<{ id: string }>;
}>;

export async function GET(
  _request: Request,
  context: DownloadRouteContext,
): Promise<Response> {
  const session = await getCurrentSession();
  if (!session || !canAccessAdmin(session.user.role as UserRole)) {
    return new Response("Message not found.", { status: 404 });
  }

  const { id } = await context.params;
  const recipientEmail = (
    process.env.ADMIN_NOTIFICATION_EMAIL ?? "admin@demo.threadd.store"
  ).toLowerCase();
  const message = await getAdminEmailMessage(
    id,
    session.user.id,
    recipientEmail,
  );
  if (!message) return new Response("Message not found.", { status: 404 });

  return new Response(message.textBody, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="threadd-admin-notification.txt"',
      "Cache-Control": "private, no-store",
    },
  });
}
