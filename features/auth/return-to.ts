export function safeReturnTo(
  value: string | string[] | undefined,
  fallback = "/account",
) {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (
    !candidate ||
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\")
  ) {
    return fallback;
  }
  return candidate;
}
