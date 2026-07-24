import { NextResponse } from "next/server";

import { getCurrentSession } from "@/features/auth/authorization";
import { db } from "@/lib/db/client";

export async function POST() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  await db.emailMessage.updateMany({
    where: {
      recipientUserId: session.user.id,
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
