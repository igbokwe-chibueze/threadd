"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/features/auth/authorization";
import { addressSchema, profileSchema } from "@/features/account/validation";
import { db } from "@/lib/db/client";

export type AccountActionState = { error?: string; success?: string };

function firstError(error: unknown) {
  if (
    typeof error === "object" &&
    error &&
    "issues" in error &&
    Array.isArray(error.issues)
  ) {
    return error.issues[0]?.message ?? "Check the form and try again.";
  }
  return error instanceof Error
    ? error.message
    : "The change could not be saved.";
}

export async function updateProfileAction(
  _state: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  try {
    const session = await requireSession();
    const input = profileSchema.parse(Object.fromEntries(formData));
    await db.user.update({
      where: { id: session.user.id },
      data: { name: input.name },
    });
    revalidatePath("/account");
    return { success: "Profile updated." };
  } catch (error) {
    return { error: firstError(error) };
  }
}

export async function createAddressAction(
  _state: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  try {
    const session = await requireSession();
    const input = addressSchema.parse(Object.fromEntries(formData));
    await db.$transaction(async (tx) => {
      const count = await tx.address.count({
        where: { userId: session.user.id },
      });
      const makeDefault = input.isDefault || count === 0;
      if (makeDefault) {
        await tx.address.updateMany({
          where: { userId: session.user.id },
          data: { isDefault: false },
        });
      }
      await tx.address.create({
        data: {
          ...input,
          isDefault: makeDefault,
          userId: session.user.id,
        },
      });
    });
    revalidatePath("/account");
    return { success: "Delivery address saved." };
  } catch (error) {
    return { error: firstError(error) };
  }
}

export async function setDefaultAddressAction(
  addressId: string,
  _state: AccountActionState,
  _formData: FormData,
): Promise<AccountActionState> {
  void _state;
  void _formData;
  try {
    const session = await requireSession();
    await db.$transaction(async (tx) => {
      const address = await tx.address.findFirst({
        where: { id: addressId, userId: session.user.id },
      });
      if (!address) throw new Error("Address not found.");
      await tx.address.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      });
      await tx.address.update({
        where: { id: address.id },
        data: { isDefault: true },
      });
    });
    revalidatePath("/account");
    return { success: "Default address updated." };
  } catch (error) {
    return { error: firstError(error) };
  }
}

export async function deleteAddressAction(
  addressId: string,
  _state: AccountActionState,
  _formData: FormData,
): Promise<AccountActionState> {
  void _state;
  void _formData;
  try {
    const session = await requireSession();
    await db.$transaction(async (tx) => {
      const address = await tx.address.findFirst({
        where: { id: addressId, userId: session.user.id },
      });
      if (!address) throw new Error("Address not found.");
      await tx.address.delete({ where: { id: address.id } });
      if (address.isDefault) {
        const replacement = await tx.address.findFirst({
          where: { userId: session.user.id },
          orderBy: { createdAt: "asc" },
        });
        if (replacement) {
          await tx.address.update({
            where: { id: replacement.id },
            data: { isDefault: true },
          });
        }
      }
    });
    revalidatePath("/account");
    return { success: "Address removed." };
  } catch (error) {
    return { error: firstError(error) };
  }
}
