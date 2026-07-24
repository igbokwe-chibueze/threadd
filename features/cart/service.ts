import "server-only";

import { createHash } from "node:crypto";

import { cookies } from "next/headers";

import { getCurrentSession } from "@/features/auth/authorization";
import { db } from "@/lib/db/client";

export const CART_COOKIE = "threadd_cart";
const CART_TTL_SECONDS = 30 * 24 * 60 * 60;

export function hashCartToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function getCartIdentity() {
  const [session, cookieStore] = await Promise.all([
    getCurrentSession(),
    cookies(),
  ]);
  return {
    userId: session?.user.id,
    guestToken: cookieStore.get(CART_COOKIE)?.value,
  };
}

export async function findCurrentCart() {
  const identity = await getCartIdentity();
  const ownerWhere = identity.userId
    ? { userId: identity.userId }
    : identity.guestToken
      ? { guestTokenHash: hashCartToken(identity.guestToken) }
      : null;

  if (!ownerWhere) return null;

  return db.cart.findFirst({
    where: { ...ownerWhere, status: "ACTIVE" },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          variant: {
            include: {
              product: {
                include: {
                  images: { orderBy: { position: "asc" }, take: 1 },
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function getCurrentCartQuantity() {
  const identity = await getCartIdentity();
  const ownerWhere = identity.userId
    ? { userId: identity.userId }
    : identity.guestToken
      ? { guestTokenHash: hashCartToken(identity.guestToken) }
      : null;
  if (!ownerWhere) return 0;

  const cart = await db.cart.findFirst({
    where: { ...ownerWhere, status: "ACTIVE" },
    select: { items: { select: { quantity: true } } },
  });
  return cart?.items.reduce((total, item) => total + item.quantity, 0) ?? 0;
}

export async function getOrCreateCart() {
  const identity = await getCartIdentity();
  if (identity.userId) {
    const cart = await db.cart.findFirst({
      where: { userId: identity.userId, status: "ACTIVE" },
      select: { id: true },
    });
    if (cart) return cart;
    return db.cart.create({
      data: { userId: identity.userId },
      select: { id: true },
    });
  }

  const cookieStore = await cookies();
  const token = identity.guestToken ?? crypto.randomUUID();
  if (!identity.guestToken) {
    cookieStore.set(CART_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: CART_TTL_SECONDS,
      path: "/",
    });
  }
  const tokenHash = hashCartToken(token);
  return db.cart.upsert({
    where: { guestTokenHash: tokenHash },
    update: { expiresAt: new Date(Date.now() + CART_TTL_SECONDS * 1_000) },
    create: {
      guestTokenHash: tokenHash,
      expiresAt: new Date(Date.now() + CART_TTL_SECONDS * 1_000),
    },
    select: { id: true },
  });
}

export function cartTotals(
  cart: NonNullable<Awaited<ReturnType<typeof findCurrentCart>>>,
) {
  return cart.items.reduce(
    (totals, item) => {
      const unitPrice =
        Number(item.variant.product.basePrice) +
        Number(item.variant.priceAdjustment);
      return {
        quantity: totals.quantity + item.quantity,
        subtotal: totals.subtotal + unitPrice * item.quantity,
      };
    },
    { quantity: 0, subtotal: 0 },
  );
}
