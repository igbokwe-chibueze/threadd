import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getCurrentSession } from "@/features/auth/authorization";
import { CART_COOKIE, mergeGuestCartIntoUser } from "@/features/cart/service";

export async function POST() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const cookieStore = await cookies();
  const result = await mergeGuestCartIntoUser(
    session.user.id,
    cookieStore.get(CART_COOKIE)?.value,
  );
  const response = NextResponse.json(result);
  response.cookies.delete(CART_COOKIE);
  return response;
}
