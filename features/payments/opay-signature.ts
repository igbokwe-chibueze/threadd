import { createHmac } from "node:crypto";

export type OPayCallbackPayload = Readonly<{
  amount: string;
  currency: string;
  reference: string;
  refunded: boolean;
  status: string;
  timestamp: string;
  token?: string;
  transactionId: string;
  instrumentType?: string;
  displayedFailure?: string;
}>;

export function createOPaySignature(body: string, secretKey: string) {
  return createHmac("sha512", secretKey).update(body).digest("hex");
}

export function createOPayCallbackSignature(
  payload: OPayCallbackPayload,
  secretKey: string,
) {
  const content = `{Amount:"${payload.amount}",Currency:"${payload.currency}",Reference:"${payload.reference}",Refunded:${payload.refunded ? "t" : "f"},Status:"${payload.status}",Timestamp:"${payload.timestamp}",Token:"${payload.token ?? ""}",TransactionID:"${payload.transactionId}"}`;
  return createHmac("sha3-512", secretKey).update(content).digest("hex");
}

export function verifyOPayCallbackSignature(
  payload: OPayCallbackPayload,
  suppliedSignature: string,
  secretKey: string,
) {
  const expected = createOPayCallbackSignature(payload, secretKey);
  return (
    suppliedSignature.length === expected.length &&
    Buffer.from(suppliedSignature.toLowerCase()).equals(Buffer.from(expected))
  );
}
