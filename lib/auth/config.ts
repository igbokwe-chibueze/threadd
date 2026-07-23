import "server-only";

const DEVELOPMENT_AUTH_SECRET =
  "threadd-development-only-secret-change-in-deployments";
const BUILD_AUTH_SECRET = "threadd-build-only-secret-never-used-at-runtime";

export function getAuthSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;

  if (secret && secret.length >= 32) {
    return secret;
  }

  if (process.env.NODE_ENV !== "production") {
    return DEVELOPMENT_AUTH_SECRET;
  }

  if (process.env.NEXT_PHASE === "phase-production-build") {
    return BUILD_AUTH_SECRET;
  }

  throw new Error(
    "BETTER_AUTH_SECRET must contain at least 32 characters in production.",
  );
}
