import "server-only";

import { cookies } from "next/headers";

import { getCurrentSession } from "@/features/auth/authorization";
import { CART_COOKIE, hashCartToken } from "@/features/cart/service";
import { db } from "@/lib/db/client";

export async function getAccessibleOrder(orderId: string) {
  const [session, cookieStore] = await Promise.all([
    getCurrentSession(),
    cookies(),
  ]);
  const guestToken = cookieStore.get(CART_COOKIE)?.value;
  return db.order.findFirst({
    where: {
      id: orderId,
      OR: [
        ...(session ? [{ userId: session.user.id }] : []),
        ...(guestToken
          ? [{ cart: { guestTokenHash: hashCartToken(guestToken) } }]
          : []),
      ],
    },
    include: {
      items: true,
      payments: { orderBy: { createdAt: "desc" } },
      statusHistory: { orderBy: { createdAt: "desc" } },
      cancellation: true,
      returnRequest: true,
      refunds: true,
    },
  });
}
