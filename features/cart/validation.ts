import { z } from "zod";

export const addCartItemSchema = z.object({
  variantId: z.string().min(1, "Please choose a size and colour."),
  quantity: z.coerce.number().int().min(1).max(10),
});

export const updateCartItemSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.coerce.number().int().min(0).max(10),
});
