import { randomUUID } from "node:crypto";

import { loadEnvConfig } from "@next/env";
import { v2 as cloudinary } from "cloudinary";

/*
 * Load the ignored local environment files using Next.js' own precedence
 * rules. This avoids duplicating dotenv parsing and, importantly, never prints
 * provider credentials to stdout.
 */
loadEnvConfig(process.cwd());

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const folder = process.env.CLOUDINARY_FOLDER ?? "threadd/portfolio-demo";

if (!cloudName || !apiKey || !apiSecret) {
  throw new Error(
    "Cloudinary verification requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
  );
}

if (!/^[a-z0-9][a-z0-9/_-]{2,80}$/i.test(folder) || folder.includes("..")) {
  throw new Error("CLOUDINARY_FOLDER is outside the approved folder format.");
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

/*
 * This is a valid one-pixel PNG generated in memory. The check deliberately
 * avoids reading user files and uses a server-controlled public ID inside the
 * isolated demo folder.
 */
const ONE_PIXEL_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
const publicId = `${folder}/setup-check-${randomUUID()}`;

async function verifyCloudinary(): Promise<void> {
  let hasUploadedProbe = false;

  try {
    const uploaded = await cloudinary.uploader.upload(ONE_PIXEL_PNG, {
      public_id: publicId,
      resource_type: "image",
      overwrite: false,
      transformation: [{ flags: "strip_profile" }],
    });
    hasUploadedProbe = uploaded.public_id === publicId;

    if (!hasUploadedProbe || !uploaded.secure_url.startsWith("https://")) {
      throw new Error("Cloudinary returned an unexpected upload identity.");
    }

    console.log("Cloudinary upload credentials and demo folder are valid.");
  } finally {
    /*
     * Always remove a successfully created probe, including when a later
     * assertion fails. A failed deletion is surfaced so operators know manual
     * cleanup is required instead of silently accumulating test assets.
     */
    if (hasUploadedProbe) {
      const deletion = await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
        invalidate: true,
      });

      if (!["ok", "not found"].includes(deletion.result)) {
        throw new Error("Cloudinary probe cleanup did not complete.");
      }

      console.log("Cloudinary verification probe was deleted.");
    }
  }
}

/*
 * Keep the entry point compatible with this repository's CommonJS tsx output
 * while still surfacing an operation failure through a non-zero exit code.
 */
void verifyCloudinary().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Cloudinary verification failed.",
  );
  process.exitCode = 1;
});
