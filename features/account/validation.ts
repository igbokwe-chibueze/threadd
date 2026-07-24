import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(80),
});

export const addressSchema = z.object({
  label: z.string().trim().min(2, "Add a short label.").max(30),
  recipientName: z
    .string()
    .trim()
    .min(2, "Enter the recipient’s name.")
    .max(80),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{7,24}$/, "Enter a valid phone number."),
  line1: z.string().trim().min(4, "Enter the street address.").max(120),
  line2: z
    .string()
    .trim()
    .max(120)
    .transform((value) => value || undefined),
  city: z.string().trim().min(2, "Enter the city or town.").max(60),
  state: z.string().trim().min(2, "Select a state.").max(30),
  postalCode: z
    .string()
    .trim()
    .max(12)
    .transform((value) => value || undefined),
  isDefault: z.preprocess((value) => value === "on", z.boolean()),
});
