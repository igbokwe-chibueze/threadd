"use server";

import { revalidatePath } from "next/cache";

import {
  addCartItemSchema,
  updateCartItemSchema,
} from "@/features/cart/validation";
import { getOrCreateCart, findCurrentCart } from "@/features/cart/service";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db/client";

export type CartActionState = { error?: string; success?: string };

function refreshCart(productSlug?: string) {
  revalidatePath("/cart");
  revalidatePath("/checkout");
  if (productSlug) revalidatePath(`/products/${productSlug}`);
}

export async function addToCartAction(
  _state: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const result = addCartItemSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Choose a variant." };
  }

  try {
    const cart = await getOrCreateCart();
    const outcome = await db.$transaction(
      async (tx) => {
        const variant = await tx.productVariant.findFirst({
          where: {
            id: result.data.variantId,
            active: true,
            product: { status: "ACTIVE", publishedAt: { lte: new Date() } },
          },
          include: { product: { select: { slug: true, name: true } } },
        });
        if (!variant) throw new Error("This option is no longer available.");
        const existing = await tx.cartItem.findUnique({
          where: {
            cartId_variantId: {
              cartId: cart.id,
              variantId: variant.id,
            },
          },
        });
        const quantity = (existing?.quantity ?? 0) + result.data.quantity;
        if (quantity > variant.inventoryQuantity) {
          throw new Error(
            variant.inventoryQuantity
              ? `Only ${variant.inventoryQuantity} of this option are currently available.`
              : "This option is sold out.",
          );
        }
        if (existing) {
          await tx.cartItem.update({
            where: { id: existing.id },
            data: { quantity },
          });
        } else {
          await tx.cartItem.create({
            data: {
              cartId: cart.id,
              variantId: variant.id,
              quantity,
            },
          });
        }
        return variant.product;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    refreshCart(outcome.slug);
    return { success: `${outcome.name} was added to your cart.` };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "This item could not be added to your cart.",
    };
  }
}

export async function updateCartItemAction(
  _state: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const result = updateCartItemSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Invalid quantity." };
  }
  try {
    const cart = await findCurrentCart();
    if (!cart) throw new Error("Your cart could not be found.");
    const item = cart.items.find(
      (candidate) => candidate.id === result.data.itemId,
    );
    if (!item) throw new Error("That item is not in your cart.");
    if (result.data.quantity > item.variant.inventoryQuantity) {
      throw new Error(
        `Only ${item.variant.inventoryQuantity} of this option are currently available.`,
      );
    }
    if (result.data.quantity === 0) {
      await db.cartItem.delete({ where: { id: item.id } });
    } else {
      await db.cartItem.update({
        where: { id: item.id },
        data: { quantity: result.data.quantity },
      });
    }
    refreshCart(item.variant.product.slug);
    return {
      success:
        result.data.quantity === 0 ? "Item removed." : "Cart quantity updated.",
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Your cart could not be updated.",
    };
  }
}
