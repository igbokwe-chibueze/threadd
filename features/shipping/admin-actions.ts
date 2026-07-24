"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { requireRole } from "@/features/auth/authorization";
import { db } from "@/lib/db/client";

export type ShippingActionState = { error?: string; success?: string };
const schema = z.object({
  zoneId: z.string().min(1),
  fee: z.coerce.number().int().min(0).max(100_000),
});

export async function updateShippingFeeAction(
  _state: ShippingActionState,
  formData: FormData,
): Promise<ShippingActionState> {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const input = schema.parse(Object.fromEntries(formData));
    const zone = await db.$transaction(async (tx) => {
      const updated = await tx.shippingZone.update({
        where: { id: input.zoneId },
        data: { fee: input.fee },
      });
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "shipping.fee.update",
          resourceType: "ShippingZone",
          resourceId: updated.id,
          metadata: { fee: input.fee },
        },
      });
      return updated;
    });
    revalidatePath("/admin/shipping");
    revalidatePath("/checkout");
    return { success: `${zone.name} delivery updated.` };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Delivery fee was not updated.",
    };
  }
}
