import { describe, expect, it } from "vitest";

import {
  createOPayCallbackSignature,
  createOPaySignature,
  type OPayCallbackPayload,
  verifyOPayCallbackSignature,
} from "@/features/payments/opay-signature";

const callback: OPayCallbackPayload = {
  amount: "49160",
  currency: "NGN",
  reference: "10023",
  refunded: false,
  status: "SUCCESS",
  timestamp: "2022-05-07T06:20:46Z",
  token: "220507145660712931829",
  transactionId: "220507145660712931829",
};

describe("OPay signatures", () => {
  it("creates a stable request signature", () => {
    expect(createOPaySignature('{"reference":"THREADD-1"}', "secret")).toBe(
      createOPaySignature('{"reference":"THREADD-1"}', "secret"),
    );
    expect(createOPaySignature('{"reference":"THREADD-2"}', "secret")).not.toBe(
      createOPaySignature('{"reference":"THREADD-1"}', "secret"),
    );
  });

  it("accepts an authentic callback and rejects altered payment data", () => {
    const signature = createOPayCallbackSignature(callback, "private-key");

    expect(
      verifyOPayCallbackSignature(callback, signature, "private-key"),
    ).toBe(true);
    expect(
      verifyOPayCallbackSignature(
        { ...callback, amount: "1" },
        signature,
        "private-key",
      ),
    ).toBe(false);
  });
});
