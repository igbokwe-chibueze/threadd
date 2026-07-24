import { describe, expect, it, vi } from "vitest";

import { EmailDeliveryService } from "@/lib/email/delivery-service";
import type { EmailMessageInput, EmailProvider } from "@/lib/email/types";

const message: EmailMessageInput = {
  recipientEmail: "customer@example.com",
  subject: "THREADD test",
  textBody: "A private plain-text message.",
  kind: "ORDER_STATUS",
};

describe("email delivery service", () => {
  it("depends only on the provider contract", async () => {
    const provider: EmailProvider = {
      deliver: vi.fn().mockResolvedValue({
        messageId: "provider-message",
        status: "sent",
      }),
    };

    const result = await new EmailDeliveryService(provider).send(message);

    expect(provider.deliver).toHaveBeenCalledWith(message);
    expect(result).toEqual({
      messageId: "provider-message",
      status: "sent",
    });
  });

  it("retries a transient provider failure", async () => {
    const deliver = vi
      .fn()
      .mockRejectedValueOnce(new Error("Temporary provider failure"))
      .mockResolvedValue({
        messageId: "retried-message",
        status: "preview_ready",
      });
    const service = new EmailDeliveryService(
      { deliver },
      { attempts: 3, delay: async () => undefined },
    );

    await expect(service.send(message)).resolves.toMatchObject({
      messageId: "retried-message",
    });
    expect(deliver).toHaveBeenCalledTimes(2);
  });

  it("stops after the configured retry limit", async () => {
    const deliver = vi
      .fn()
      .mockRejectedValue(new Error("Provider unavailable"));
    const service = new EmailDeliveryService(
      { deliver },
      { attempts: 3, delay: async () => undefined },
    );

    await expect(service.send(message)).rejects.toThrow("Provider unavailable");
    expect(deliver).toHaveBeenCalledTimes(3);
  });
});
