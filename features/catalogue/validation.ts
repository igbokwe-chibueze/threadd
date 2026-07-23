import { z } from "zod";

export const productInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Enter a product name.")
      .max(100, "Keep the product name under 100 characters."),
    slug: z
      .string()
      .trim()
      .min(2, "Enter a product name so its URL can be generated.")
      .max(100, "The generated URL is too long.")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Enter a product name that can be used in a web address.",
      ),
    shortDescription: z
      .string()
      .trim()
      .min(3, "Add a short product summary.")
      .max(180, "Keep the short summary under 180 characters."),
    description: z
      .string()
      .trim()
      .min(5, "Add a brief product description.")
      .max(4000, "Keep the description under 4,000 characters."),
    status: z.enum(["DRAFT", "ACTIVE"]),
    basePrice: z.coerce.number().positive().max(100_000_000),
    compareAtPrice: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.coerce.number().positive().max(100_000_000).optional(),
    ),
    categoryId: z.string().min(1),
    collectionId: z.string().optional(),
    featured: z.boolean(),
    seoTitle: z.string().trim().max(60).optional(),
    seoDescription: z.string().trim().max(160).optional(),
    imageAlt: z
      .string()
      .trim()
      .min(2, "Briefly describe the product image.")
      .max(160, "Keep the image description under 160 characters."),
  })
  .refine(
    (value) => !value.compareAtPrice || value.compareAtPrice > value.basePrice,
    {
      message: "Compare-at price must be higher than the base price.",
      path: ["compareAtPrice"],
    },
  );

export type ParsedVariant = {
  sku: string;
  size: string;
  colour: string;
  colourHex?: string;
  inventoryQuantity: number;
  priceAdjustment: number;
};

export function parseVariantRows(value: string): ParsedVariant[] {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0 || lines.length > 100) {
    throw new Error("Add between 1 and 100 variants.");
  }

  const variants = lines.map((line, index) => {
    const [sku, size, colour, colourHex = "", stock = "", adjustment = "0"] =
      line.split("|").map((part) => part.trim());
    const inventoryQuantity = Number(stock);
    const priceAdjustment = Number(adjustment);

    if (!sku || !size || !colour) {
      throw new Error(
        `Variant line ${index + 1} needs an SKU, size, and colour.`,
      );
    }
    if (!Number.isInteger(inventoryQuantity) || inventoryQuantity < 0) {
      throw new Error(
        `Variant line ${index + 1} needs a non-negative whole stock number.`,
      );
    }
    if (!Number.isFinite(priceAdjustment) || priceAdjustment < 0) {
      throw new Error(
        `Variant line ${index + 1} has an invalid price adjustment.`,
      );
    }
    if (colourHex && !/^#[0-9a-f]{6}$/i.test(colourHex)) {
      throw new Error(`Variant line ${index + 1} has an invalid hex colour.`);
    }

    return {
      sku: sku.toUpperCase(),
      size,
      colour,
      colourHex: colourHex || undefined,
      inventoryQuantity,
      priceAdjustment,
    };
  });

  if (
    new Set(variants.map((variant) => variant.sku)).size !== variants.length
  ) {
    throw new Error("Every variant SKU must be unique.");
  }

  const combinations = variants.map(
    (variant) =>
      `${variant.size.toLocaleLowerCase()}::${variant.colour.toLocaleLowerCase()}`,
  );
  if (new Set(combinations).size !== combinations.length) {
    throw new Error("Each size and colour combination must be unique.");
  }

  return variants;
}
