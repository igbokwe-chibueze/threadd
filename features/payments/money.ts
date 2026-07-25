/**
 * Converts a decimal currency value to integer minor units without using
 * floating-point arithmetic.
 *
 * Prisma Decimal values stringify exactly, while Number(value) can introduce a
 * binary rounding error before multiplication. Payment providers compare exact
 * integer kobo values, so this boundary deliberately accepts only a plain,
 * non-negative decimal with at most two fractional digits.
 */
export function decimalNairaToKobo(
  value: { toString(): string } | string,
): number {
  const raw = typeof value === "string" ? value : value.toString();
  const match = /^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/.exec(raw);
  if (!match) {
    throw new Error("A currency amount could not be represented safely.");
  }

  const naira = BigInt(match[1]);
  const fractional = (match[2] ?? "").padEnd(2, "0");
  const kobo = naira * BigInt(100) + BigInt(fractional || "0");
  if (kobo > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("A currency amount exceeds the supported range.");
  }
  return Number(kobo);
}
