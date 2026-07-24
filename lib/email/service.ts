import "server-only";

import { EmailDeliveryService } from "@/lib/email/delivery-service";
import { DemoOutboxEmailProvider } from "@/lib/email/providers/demo-outbox";
import type { EmailProvider } from "@/lib/email/types";

function createEmailProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER ?? "demo_outbox";

  if (provider === "demo_outbox") {
    return new DemoOutboxEmailProvider();
  }

  throw new Error(
    `Email provider "${provider}" is not configured in this deployment.`,
  );
}

export const emailService = new EmailDeliveryService(createEmailProvider());
