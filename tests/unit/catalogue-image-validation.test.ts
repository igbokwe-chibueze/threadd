import { describe, expect, it } from "vitest";

import { validateCatalogueImage } from "@/features/catalogue/image-validation";

function pngFile(width: number, height: number, type = "image/png"): File {
  /*
   * Validation reads only the mandatory PNG signature and IHDR dimensions, so
   * these compact fixtures exercise the upload trust boundary without checking
   * binary image assets into the repository.
   */
  const bytes = new Uint8Array(45);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  const view = new DataView(bytes.buffer);
  view.setUint32(8, 13);
  bytes.set([0x49, 0x48, 0x44, 0x52], 12);
  view.setUint32(16, width);
  view.setUint32(20, height);
  bytes.set([0x49, 0x45, 0x4e, 0x44], 37);
  return new File([bytes], "untrusted-name.png", { type });
}

describe("catalogue image validation", () => {
  it("accepts an allowlisted image whose binary structure matches its MIME type", async () => {
    await expect(
      validateCatalogueImage(pngFile(1_200, 1_600)),
    ).resolves.toMatchObject({
      extension: "png",
      width: 1_200,
      height: 1_600,
    });
  });

  it("rejects a renamed non-image even when the browser claims it is a PNG", async () => {
    const file = new File(["<script>alert(1)</script>"], "photo.png", {
      type: "image/png",
    });

    await expect(validateCatalogueImage(file)).rejects.toThrow(
      /does not match its image type/,
    );
  });

  it("rejects executable and SVG MIME types", async () => {
    const svg = new File(["<svg onload='alert(1)'/>"], "photo.svg", {
      type: "image/svg+xml",
    });

    await expect(validateCatalogueImage(svg)).rejects.toThrow(
      /must be JPEG, PNG, or WebP/,
    );
  });

  it("rejects excessive dimensions even when the compressed file is small", async () => {
    await expect(validateCatalogueImage(pngFile(6_001, 100))).rejects.toThrow(
      /no larger than 6000/,
    );
  });

  it("rejects a file larger than the per-image byte limit", async () => {
    const file = new File([new Uint8Array(4 * 1024 * 1024 + 1)], "large.png", {
      type: "image/png",
    });

    await expect(validateCatalogueImage(file)).rejects.toThrow(/4 MB/);
  });
});
