import { z } from "zod";

export const stockAdjustmentSchema = z.object({
  direction: z.enum(["ADD", "REMOVE"]),
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number.")
    .min(1, "Enter at least 1 item.")
    .max(10_000, "A single adjustment cannot exceed 10,000 items."),
  reason: z
    .string()
    .trim()
    .min(5, "Explain why the stock is changing.")
    .max(240, "Keep the adjustment reason under 240 characters."),
});

export const thresholdSchema = z.object({
  threshold: z.coerce
    .number()
    .int("The threshold must be a whole number.")
    .min(0, "The threshold cannot be negative.")
    .max(10_000, "The threshold cannot exceed 10,000."),
});

export function calculateStockAfter(current: number, delta: number) {
  const next = current + delta;
  if (!Number.isSafeInteger(next) || next < 0) {
    throw new Error("This adjustment would make stock negative.");
  }
  return next;
}
