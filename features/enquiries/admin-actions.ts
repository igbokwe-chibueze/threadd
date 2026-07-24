"use server";

import { revalidatePath } from "next/cache";

import {
  enquiryNoteSchema,
  enquiryStatusSchema,
} from "@/features/enquiries/validation";
import { requireRole } from "@/features/auth/authorization";
import { db } from "@/lib/db/client";

export type EnquiryAdminState = { error?: string; success?: string };
const roles = ["ADMIN", "SUPER_ADMIN"] as const;

function message(error: unknown) {
  return error instanceof Error
    ? error.message
    : "The change could not be saved.";
}

export async function addEnquiryNoteAction(
  _state: EnquiryAdminState,
  formData: FormData,
): Promise<EnquiryAdminState> {
  try {
    const session = await requireRole(roles);
    const input = enquiryNoteSchema.parse(Object.fromEntries(formData));
    await db.$transaction(async (tx) => {
      await tx.enquiryNote.create({
        data: {
          enquiryId: input.enquiryId,
          authorId: session.user.id,
          body: input.body,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "enquiry.note.create",
          resourceType: "Enquiry",
          resourceId: input.enquiryId,
        },
      });
    });
    revalidatePath(`/admin/enquiries/${input.enquiryId}`);
    return { success: "Internal note added." };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function updateEnquiryStatusAction(
  _state: EnquiryAdminState,
  formData: FormData,
): Promise<EnquiryAdminState> {
  try {
    const session = await requireRole(roles);
    const input = enquiryStatusSchema.parse(Object.fromEntries(formData));
    await db.$transaction(async (tx) => {
      const enquiry = await tx.enquiry.findUnique({
        where: { id: input.enquiryId },
        select: { status: true },
      });
      if (!enquiry) throw new Error("Enquiry not found.");
      if (enquiry.status === input.status) {
        throw new Error(
          `This enquiry is already marked ${input.status.toLowerCase()}.`,
        );
      }
      await tx.enquiry.update({
        where: { id: input.enquiryId },
        data: { status: input.status },
      });
      await tx.enquiryStatusHistory.create({
        data: {
          enquiryId: input.enquiryId,
          actorId: session.user.id,
          fromStatus: enquiry.status,
          toStatus: input.status,
          reason: input.reason,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "enquiry.status.update",
          resourceType: "Enquiry",
          resourceId: input.enquiryId,
          metadata: {
            fromStatus: enquiry.status,
            toStatus: input.status,
            reason: input.reason,
          },
        },
      });
    });
    revalidatePath("/admin/enquiries");
    revalidatePath(`/admin/enquiries/${input.enquiryId}`);
    return { success: `Status changed to ${input.status.toLowerCase()}.` };
  } catch (error) {
    return { error: message(error) };
  }
}
