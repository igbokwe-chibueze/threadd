import { z } from "zod";

export const checkoutSchema = z.object({
  paymentProvider: z.enum(["paystack", "opay", "demo"], {
    message: "Choose a payment method.",
  }),
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  recipientName: z
    .string()
    .trim()
    .min(2, "Enter the recipient’s name.")
    .max(80),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{7,24}$/, "Enter a valid phone number."),
  addressLine1: z.string().trim().min(4, "Enter the street address.").max(120),
  addressLine2: z
    .string()
    .trim()
    .max(120)
    .transform((value) => value || undefined),
  city: z.string().trim().min(2, "Enter the city or town.").max(60),
  state: z.string().trim().min(2, "Select a delivery state.").max(30),
  postalCode: z
    .string()
    .trim()
    .max(12)
    .transform((value) => value || undefined),
});
