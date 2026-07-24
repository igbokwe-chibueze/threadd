"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

import { requireRole } from "@/features/auth/authorization";
import {
  calculateStockAfter,
  stockAdjustmentSchema,
  thresholdSchema,
} from "@/features/inventory/validation";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db/client";

export type InventoryActionState = {
  error?: string;
  success?: string;
};

const allowedRoles = ["ADMIN", "SUPER_ADMIN"] as const;

function errorMessage(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues.map((issue) => issue.message).join(" ");
  }
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  ) {
    return "Stock changed at the same time. Review the latest quantity and try again.";
  }
  return error instanceof Error
    ? error.message
    : "The inventory change could not be saved.";
}

function refreshInventory(slug?: string) {
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/catalogue");
  revalidatePath("/shop");
  if (slug) revalidatePath(`/products/${slug}`);
}

export async function adjustInventoryAction(
  variantId: string,
  _state: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  try {
    const session = await requireRole(allowedRoles);
    const input = stockAdjustmentSchema.parse({
      direction: formData.get("direction"),
      quantity: formData.get("quantity"),
      reason: formData.get("reason"),
    });
    const delta = input.direction === "ADD" ? input.quantity : -input.quantity;

    const result = await db.$transaction(
      async (tx) => {
        const variant = await tx.productVariant.findUnique({
          where: { id: variantId },
          include: { product: { select: { slug: true } } },
        });
        if (!variant) throw new Error("Variant not found.");

        const quantityAfter = calculateStockAfter(
          variant.inventoryQuantity,
          delta,
        );
        const updated = await tx.productVariant.updateMany({
          where: {
            id: variant.id,
            inventoryQuantity: variant.inventoryQuantity,
          },
          data: { inventoryQuantity: { increment: delta } },
        });
        if (updated.count !== 1) {
          throw new Error(
            "Stock changed at the same time. Review the latest quantity and try again.",
          );
        }

        const movement = await tx.inventoryMovement.create({
          data: {
            variantId: variant.id,
            actorId: session.user.id,
            type: "MANUAL_ADJUSTMENT",
            quantityDelta: delta,
            quantityBefore: variant.inventoryQuantity,
            quantityAfter,
            reason: input.reason,
          },
        });
        await tx.auditLog.create({
          data: {
            actorId: session.user.id,
            action: "inventory.variant.adjust",
            resourceType: "ProductVariant",
            resourceId: variant.id,
            metadata: {
              movementId: movement.id,
              quantityBefore: variant.inventoryQuantity,
              quantityAfter,
              delta,
              reason: input.reason,
            },
          },
        });
        return { slug: variant.product.slug, quantityAfter };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10_000,
        timeout: 10_000,
      },
    );

    refreshInventory(result.slug);
    return { success: `Stock updated to ${result.quantityAfter}.` };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function updateLowStockThresholdAction(
  variantId: string,
  _state: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  try {
    const session = await requireRole(allowedRoles);
    const { threshold } = thresholdSchema.parse({
      threshold: formData.get("threshold"),
    });
    const variant = await db.$transaction(async (tx) => {
      const updated = await tx.productVariant.update({
        where: { id: variantId },
        data: { lowStockThreshold: threshold },
        include: { product: { select: { slug: true } } },
      });
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "inventory.threshold.update",
          resourceType: "ProductVariant",
          resourceId: updated.id,
          metadata: { lowStockThreshold: threshold },
        },
      });
      return updated;
    });
    refreshInventory(variant.product.slug);
    return { success: `Low-stock alert set to ${threshold}.` };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}
