import { loadEnvConfig } from "@next/env";
import { chromium, type Page } from "@playwright/test";
import { v2 as cloudinary } from "cloudinary";
import { z } from "zod";

/*
 * This check intentionally mutates only the disposable public-demo catalogue
 * and finishes by invoking the canonical reset. Never run it against a
 * customer deployment. The required origin is explicit so an operator cannot
 * accidentally inherit localhost or another environment.
 */
const PRODUCTION_ORIGIN = "https://threadd-smoky.vercel.app";
const SEEDED_PRODUCT_NAME = "Foundation Tee";
const POLL_INTERVAL_MS = 1_000;
const POLL_ATTEMPTS = 30;

const cloudinaryResourceListSchema = z.object({
  resources: z.array(z.object({ public_id: z.string() })),
});

/*
 * Vercel's `env run` injects the active Production values before starting this
 * process. Load ignored local files only for a direct local invocation; doing
 * so unconditionally could let a stale `.env.local` reset secret override the
 * deployed value.
 */
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET ||
  !process.env.DEMO_RESET_SECRET
) {
  loadEnvConfig(process.cwd());
}

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const folder = process.env.CLOUDINARY_FOLDER ?? "threadd/portfolio-demo";
const resetSecret = process.env.DEMO_RESET_SECRET;

if (!cloudName || !apiKey || !apiSecret || !resetSecret) {
  throw new Error(
    "Deployed media verification requires Cloudinary credentials and DEMO_RESET_SECRET.",
  );
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

/*
 * Both compact fixtures are valid one-pixel PNG images. They are generated in
 * memory, carry no filename metadata, and differ so the replacement request is
 * unambiguous in browser traces and provider logs.
 */
const FIRST_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);
const SECOND_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nXsAAAAASUVORK5CYII=",
  "base64",
);

async function listManagedPublicIds(): Promise<Set<string>> {
  const result = cloudinaryResourceListSchema.parse(
    await cloudinary.api.resources({
      resource_type: "image",
      type: "upload",
      prefix: `${folder}/`,
      max_results: 500,
    }),
  );
  return new Set(result.resources.map((resource) => resource.public_id));
}

async function waitForNewPublicId(
  previousIds: ReadonlySet<string>,
): Promise<string> {
  for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt += 1) {
    const currentIds = await listManagedPublicIds();
    const createdId = [...currentIds].find((id) => !previousIds.has(id));
    if (createdId) return createdId;
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error("Cloudinary did not expose the newly uploaded demo image.");
}

async function waitForPublicIdRemoval(publicId: string): Promise<void> {
  for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt += 1) {
    if (!(await listManagedPublicIds()).has(publicId)) return;
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error(`Cloudinary did not remove the managed image ${publicId}.`);
}

async function signInAsSeededAdmin(page: Page): Promise<void> {
  /*
   * Prisma Postgres may occasionally terminate a pooled connection during a
   * serverless cold start. Retry the idempotent demo sign-in navigation, but
   * keep the attempt count bounded so a persistent authentication regression
   * still fails the check promptly.
   */
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await page.goto(`${PRODUCTION_ORIGIN}/sign-in`);

      /*
       * The demo-account button performs the complete sign-in flow itself and
       * provides its own immediate "Opening…" feedback. Waiting for `/admin`
       * exercises the exact portfolio-client path without duplicating
       * credentials into the manual form.
       */
      await page.getByRole("button", { name: "Enter admin" }).click();
      await page.waitForURL(/\/admin(?:\?|$)/, { timeout: 20_000 });
      return;
    } catch (error: unknown) {
      if (attempt === 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, 2_000));
    }
  }
}

async function openSeededProductEditor(page: Page): Promise<void> {
  /*
   * Opening the editor is read-only and therefore safe to retry after a
   * transient pooled-database render failure. Mutating saves are intentionally
   * excluded from this retry helper.
   */
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await page.goto(`${PRODUCTION_ORIGIN}/admin/catalogue`);
      const productRow = page
        .getByRole("row")
        .filter({ hasText: SEEDED_PRODUCT_NAME });
      await productRow.getByRole("link", { name: /Edit/ }).click();
      await page.getByRole("heading", { name: "Edit the piece." }).waitFor();
      return;
    } catch (error: unknown) {
      if (attempt === 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, 2_000));
    }
  }
}

async function saveGalleryImage(
  page: Page,
  fileName: string,
  buffer: Buffer,
  shouldReplace: boolean,
): Promise<void> {
  await page.getByLabel("Add gallery photos (optional)").setInputFiles({
    name: fileName,
    mimeType: "image/png",
    buffer,
  });

  if (shouldReplace) {
    await page
      .getByLabel("Replace the current gallery with the newly selected photos")
      .check();
  }

  await page.getByRole("button", { name: "Save product" }).click();
  await page.waitForURL(/\/admin\/catalogue\?updated=1$/);
}

async function invokeCanonicalReset(page: Page): Promise<void> {
  /*
   * Reset is idempotent and protected by a transaction advisory lock. Retry
   * only the route's explicit temporary-failure status; authorization and
   * unexpected responses must fail immediately.
   */
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await page.request.post(
      `${PRODUCTION_ORIGIN}/api/demo/reset`,
      {
        headers: { Authorization: `Bearer ${resetSecret}` },
      },
    );

    if (response.ok()) return;

    if (response.status() !== 503 || attempt === 3) {
      throw new Error(
        `The deployed canonical reset returned HTTP ${response.status()}.`,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 3_000));
  }
}

async function verifyDeployedMediaLifecycle(): Promise<void> {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let hasMutatedDemo = false;
  let hasCompletedReset = false;
  let stage = "starting";

  try {
    /*
     * Authenticate the reset boundary before creating any provider asset. This
     * intentionally restores the disposable demo first; if the local operator
     * secret does not match Vercel, the script stops without leaving a new
     * database row or Cloudinary object behind.
     */
    stage = "preflight canonical reset";
    await invokeCanonicalReset(page);

    const baselineIds = await listManagedPublicIds();
    stage = "seeded administrator sign-in";
    await signInAsSeededAdmin(page);
    stage = "opening seeded product editor";
    await openSeededProductEditor(page);

    stage = "appending first managed image";
    await saveGalleryImage(page, "phase-11-append.png", FIRST_PNG, false);
    hasMutatedDemo = true;
    stage = "discovering first Cloudinary asset";
    const appendedId = await waitForNewPublicId(baselineIds);

    const afterAppendIds = await listManagedPublicIds();
    stage = "opening editor for image replacement";
    await openSeededProductEditor(page);
    stage = "replacing managed image";
    await saveGalleryImage(page, "phase-11-replacement.png", SECOND_PNG, true);
    stage = "discovering replacement Cloudinary asset";
    const replacementId = await waitForNewPublicId(afterAppendIds);
    stage = "confirming replaced asset deletion";
    await waitForPublicIdRemoval(appendedId);

    stage = "post-mutation canonical reset";
    await invokeCanonicalReset(page);
    hasCompletedReset = true;
    stage = "confirming reset asset deletion";
    await waitForPublicIdRemoval(replacementId);

    /*
     * Reset deletes authentication sessions, so sign in again before checking
     * that the repository-owned seed gallery replaced the temporary managed
     * image in the administrator editor.
     */
    stage = "post-reset administrator sign-in";
    await signInAsSeededAdmin(page);
    stage = "checking restored seed gallery";
    await openSeededProductEditor(page);
    const galleryText = await page
      .getByRole("heading", { name: "Product gallery" })
      .locator("..")
      .textContent();

    if (galleryText?.includes("res.cloudinary.com")) {
      throw new Error(
        "The canonical reset left a Cloudinary URL in the seeded gallery.",
      );
    }

    console.log(
      "Deployed admin upload, replacement deletion, reset cleanup, and seed restoration passed.",
    );
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : "Unknown failure";
    throw new Error(`${stage} failed at ${page.url()}: ${detail}`);
  } finally {
    /*
     * If an assertion fails after the first mutation, make one best-effort
     * canonical reset before closing the browser. Preserve the original error
     * while reporting cleanup failure separately for operator intervention.
     */
    if (hasMutatedDemo && !hasCompletedReset) {
      try {
        await invokeCanonicalReset(page);
        console.log("Failure cleanup reset completed.");
      } catch (cleanupError: unknown) {
        console.error(
          cleanupError instanceof Error
            ? cleanupError.message
            : "Failure cleanup reset did not complete.",
        );
      }
    }

    await browser.close();
  }
}

void verifyDeployedMediaLifecycle().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Deployed media verification failed.",
  );
  process.exitCode = 1;
});
