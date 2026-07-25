import { createHmac, timingSafeEqual } from "node:crypto";

import { z } from "zod";

const MAX_PAYSTACK_WEBHOOK_BYTES = 256 * 1024;

const paystackWebhookSchema = z
  .object({
    event: z.string().trim().min(1).max(100),
    data: z
      .object({
        id: z.union([z.number(), z.string()]).optional(),
        reference: z.string().trim().min(1).max(200).optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export type SafePaystackWebhook = {
  event: string;
  data?: {
    id?: number | string;
    reference?: string;
  };
};

/**
 * Verifies Paystack's SHA-512 HMAC using a constant-time comparison.
 *
 * Length and hexadecimal checks happen before timingSafeEqual because that API
 * throws for differently sized buffers. The signature authenticates the exact
 * raw request bytes; callers must never reserialize JSON before verification.
 */
export function hasValidPaystackSignature(
  rawBody: string,
  suppliedSignature: string,
  secret: string,
): boolean {
  if (!/^[a-fA-F0-9]{128}$/.test(suppliedSignature)) return false;
  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  return timingSafeEqual(
    Buffer.from(suppliedSignature, "hex"),
    Buffer.from(expected, "hex"),
  );
}

/**
 * Parses only the fields THREADD needs after signature verification.
 *
 * Real Paystack events may include customer, authorization, and card metadata.
 * Returning this deliberately small projection prevents those unnecessary
 * fields from being persisted in PaymentEvent.payload.
 */
export function parsePaystackWebhook(rawBody: string): SafePaystackWebhook {
  if (Buffer.byteLength(rawBody, "utf8") > MAX_PAYSTACK_WEBHOOK_BYTES) {
    throw new Error("Webhook payload is too large.");
  }
  const parsed: unknown = JSON.parse(rawBody);
  const payload = paystackWebhookSchema.parse(parsed);
  return {
    event: payload.event,
    data: payload.data
      ? {
          id: payload.data.id,
          reference: payload.data.reference,
        }
      : undefined,
  };
}
