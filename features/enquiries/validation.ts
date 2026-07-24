import { z } from "zod";

export const publicEnquirySchema = z
  .object({
    kind: z.enum(["GENERAL", "PRODUCT"]),
    productId: z.string().trim().optional(),
    name: z.string().trim().min(2, "Please enter your name.").max(80),
    email: z.email("Please enter a valid email address.").trim().toLowerCase(),
    phone: z
      .string()
      .trim()
      .max(24)
      .refine(
        (value) => !value || /^\+?[0-9 ()-]{7,24}$/.test(value),
        "Please enter a valid phone number.",
      )
      .transform((value) => value || undefined),
    message: z
      .string()
      .trim()
      .min(10, "Please tell us a little more (at least 10 characters).")
      .max(2_000, "Please keep your message under 2,000 characters."),
  })
  .superRefine((value, context) => {
    if (value.kind === "PRODUCT" && !value.productId) {
      context.addIssue({
        code: "custom",
        path: ["productId"],
        message:
          "This product could not be identified. Please refresh and try again.",
      });
    }
  });

export const enquiryNoteSchema = z.object({
  enquiryId: z.string().min(1),
  body: z.string().trim().min(2, "Please enter a note.").max(2_000),
});

export const enquiryStatusSchema = z.object({
  enquiryId: z.string().min(1),
  status: z.enum(["NEW", "CONTACTED", "CONVERTED", "CLOSED", "SPAM"]),
  reason: z
    .string()
    .trim()
    .max(240)
    .transform((value) => value || undefined),
});
