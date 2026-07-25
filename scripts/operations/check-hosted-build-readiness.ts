/**
 * Hosted-build deployment gate
 *
 * Vercel keeps sensitive environment variables encrypted and exposes their
 * real values only inside the hosted build/runtime. A locally downloaded env
 * file can therefore contain redacted placeholders and cannot serve as valid
 * production-readiness evidence.
 *
 * This prebuild hook runs the full deployment preflight only for a Vercel
 * production build. Local development, GitHub CI, and Vercel previews keep
 * their existing build behaviour because they are not the production target
 * being approved. If the hosted variables fail validation, the production
 * deployment fails before Next.js builds or publishes it.
 */

async function enforceHostedBuildReadiness(): Promise<void> {
  const isVercelProductionBuild =
    process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production";

  if (isVercelProductionBuild) {
    /*
     * Use a dynamic import so the preflight module does not execute at all for
     * local, CI, or preview builds. The imported script owns safe output,
     * validation, and non-zero failure handling.
     */
    await import("./check-deployment-readiness");
    return;
  }

  console.info(
    "Hosted deployment preflight skipped outside a Vercel production build.",
  );
}

/*
 * Keep failures safe and deterministic. Validation failures are already
 * reported by the imported preflight; this fallback covers only an unexpected
 * module-loading failure and deliberately excludes error details that might
 * contain deployment metadata.
 */
enforceHostedBuildReadiness().catch(() => {
  console.error("Hosted deployment preflight could not be executed.");
  process.exit(1);
});
