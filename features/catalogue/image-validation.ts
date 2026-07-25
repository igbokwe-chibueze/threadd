const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 6_000;
const MAX_IMAGE_PIXELS = 36_000_000;

type SupportedImageType = "image/jpeg" | "image/png" | "image/webp";

export type ValidatedCatalogueImage = {
  bytes: Uint8Array;
  extension: "jpg" | "png" | "webp";
  width: number;
  height: number;
};

type ImageDimensions = {
  width: number;
  height: number;
};

function readUint16BigEndian(bytes: Uint8Array, offset: number): number {
  return bytes[offset] * 256 + bytes[offset + 1];
}

function readUint24LittleEndian(bytes: Uint8Array, offset: number): number {
  return bytes[offset] + bytes[offset + 1] * 256 + bytes[offset + 2] * 65_536;
}

function readAscii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.slice(offset, offset + length));
}

function dimensionsFromPng(bytes: Uint8Array): ImageDimensions | null {
  /*
   * A valid PNG begins with the fixed eight-byte signature and places its IHDR
   * chunk first. Width and height are unsigned 32-bit big-endian values inside
   * IHDR. DataView avoids bitwise signed-integer surprises for large values.
   */
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (
    bytes.length < 45 ||
    !signature.every((byte, index) => bytes[index] === byte) ||
    readAscii(bytes, 12, 4) !== "IHDR" ||
    new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(
      8,
    ) !== 13
  ) {
    return null;
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 8;
  let hasImageEnd = false;

  /*
   * Check that every declared chunk remains inside the file and that the
   * mandatory IEND chunk is present. CRC verification and full pixel decoding
   * belong to the future managed transformation pipeline, but this structural
   * walk prevents a signature-only polyglot from passing as a PNG.
   */
  while (offset + 12 <= bytes.length) {
    const chunkLength = view.getUint32(offset);
    const nextOffset = offset + 12 + chunkLength;
    if (nextOffset > bytes.length) return null;
    if (readAscii(bytes, offset + 4, 4) === "IEND") {
      hasImageEnd = chunkLength === 0;
      break;
    }
    offset = nextOffset;
  }
  if (!hasImageEnd) return null;

  return {
    width: view.getUint32(16),
    height: view.getUint32(20),
  };
}

function dimensionsFromJpeg(bytes: Uint8Array): ImageDimensions | null {
  if (
    bytes.length < 4 ||
    bytes[0] !== 0xff ||
    bytes[1] !== 0xd8 ||
    bytes[bytes.length - 2] !== 0xff ||
    bytes[bytes.length - 1] !== 0xd9
  ) {
    return null;
  }

  /*
   * JPEG dimensions live in a Start Of Frame segment rather than at a fixed
   * offset. Walk length-delimited metadata segments and stop at the first SOF.
   * We intentionally do not decode pixels here: the upload boundary only needs
   * trustworthy dimensions and should not expose a complex native decoder.
   */
  const startOfFrameMarkers = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce,
    0xcf,
  ]);
  let offset = 2;

  while (offset + 3 < bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    while (bytes[offset] === 0xff) offset += 1;

    const marker = bytes[offset];
    offset += 1;
    if (marker === 0xd8 || marker === 0x01) continue;
    if (marker === 0xd9 || marker === 0xda) break;
    if (offset + 1 >= bytes.length) return null;

    const segmentLength = readUint16BigEndian(bytes, offset);
    if (segmentLength < 2 || offset + segmentLength > bytes.length) return null;

    if (startOfFrameMarkers.has(marker)) {
      if (segmentLength < 7) return null;
      return {
        height: readUint16BigEndian(bytes, offset + 3),
        width: readUint16BigEndian(bytes, offset + 5),
      };
    }
    offset += segmentLength;
  }

  return null;
}

function dimensionsFromWebp(bytes: Uint8Array): ImageDimensions | null {
  if (
    bytes.length < 30 ||
    readAscii(bytes, 0, 4) !== "RIFF" ||
    readAscii(bytes, 8, 4) !== "WEBP"
  ) {
    return null;
  }

  const chunkType = readAscii(bytes, 12, 4);
  if (chunkType === "VP8X") {
    return {
      width: readUint24LittleEndian(bytes, 24) + 1,
      height: readUint24LittleEndian(bytes, 27) + 1,
    };
  }

  if (
    chunkType === "VP8 " &&
    bytes[23] === 0x9d &&
    bytes[24] === 0x01 &&
    bytes[25] === 0x2a
  ) {
    return {
      width: readUint16BigEndian(
        new Uint8Array([bytes[27] & 0x3f, bytes[26]]),
        0,
      ),
      height: readUint16BigEndian(
        new Uint8Array([bytes[29] & 0x3f, bytes[28]]),
        0,
      ),
    };
  }

  if (chunkType === "VP8L" && bytes[20] === 0x2f) {
    return {
      width: 1 + (((bytes[22] & 0x3f) << 8) | bytes[21]),
      height:
        1 + (((bytes[24] & 0x0f) << 10) | (bytes[23] << 2) | (bytes[22] >> 6)),
    };
  }

  return null;
}

const imageSpecifications: Record<
  SupportedImageType,
  {
    extension: ValidatedCatalogueImage["extension"];
    dimensions: (bytes: Uint8Array) => ImageDimensions | null;
  }
> = {
  "image/jpeg": { extension: "jpg", dimensions: dimensionsFromJpeg },
  "image/png": { extension: "png", dimensions: dimensionsFromPng },
  "image/webp": { extension: "webp", dimensions: dimensionsFromWebp },
};

/**
 * Validates catalogue media before any storage write occurs.
 *
 * Browser-provided MIME types and filenames are untrusted. The parser selected
 * by the allowlisted MIME type must also recognize that format's binary
 * structure, which rejects renamed HTML/SVG/executable files. Pixel limits are
 * enforced independently from byte size because a very small compressed image
 * can still expand into excessive memory when an optimizer later decodes it.
 */
export async function validateCatalogueImage(
  file: File,
): Promise<ValidatedCatalogueImage> {
  if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
    throw new Error("Product images must be between 1 byte and 4 MB.");
  }

  const type = file.type as SupportedImageType;
  const specification = imageSpecifications[type];
  if (!specification) {
    throw new Error("Product images must be JPEG, PNG, or WebP.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const dimensions = specification.dimensions(bytes);
  if (!dimensions || dimensions.width === 0 || dimensions.height === 0) {
    throw new Error("The uploaded file does not match its image type.");
  }

  if (
    dimensions.width > MAX_IMAGE_DIMENSION ||
    dimensions.height > MAX_IMAGE_DIMENSION ||
    dimensions.width * dimensions.height > MAX_IMAGE_PIXELS
  ) {
    throw new Error(
      "Product images must be no larger than 6000 × 6000 pixels.",
    );
  }

  return {
    bytes,
    extension: specification.extension,
    ...dimensions,
  };
}
