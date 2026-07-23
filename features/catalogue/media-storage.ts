import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const imageTypes = new Map([
  ["image/jpeg", { extension: "jpg", signature: [0xff, 0xd8, 0xff] }],
  ["image/png", { extension: "png", signature: [0x89, 0x50, 0x4e, 0x47] }],
  ["image/webp", { extension: "webp", signature: [0x52, 0x49, 0x46, 0x46] }],
]);

export async function storeCatalogueImage(file: File): Promise<string> {
  if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
    throw new Error("Product images must be between 1 byte and 4 MB.");
  }

  const specification = imageTypes.get(file.type);
  if (!specification) {
    throw new Error("Product images must be JPEG, PNG, or WebP.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (
    !specification.signature.every((byte, index) => bytes[index] === byte) ||
    (file.type === "image/webp" &&
      String.fromCharCode(...bytes.slice(8, 12)) !== "WEBP")
  ) {
    throw new Error("The uploaded file does not match its image type.");
  }

  const directory = path.join(process.cwd(), "public", "uploads", "catalogue");
  await mkdir(directory, { recursive: true });
  const filename = `${randomUUID()}.${specification.extension}`;
  await writeFile(path.join(directory, filename), bytes, { flag: "wx" });

  return `/uploads/catalogue/${filename}`;
}
