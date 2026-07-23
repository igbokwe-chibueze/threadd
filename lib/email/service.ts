import "server-only";

import { DemoOutboxEmailProvider } from "@/lib/email/providers/demo-outbox";
import type {
  EmailDeliveryResult,
  EmailMessageInput,
  EmailProvider,
} from "@/lib/email/types";

function createEmailProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER ?? "demo_outbox";

  if (provider === "demo_outbox") {
    return new DemoOutboxEmailProvider();
  }

  throw new Error(
    `Email provider "${provider}" is not configured in this deployment.`,
  );
}

const provider = createEmailProvider();

export const emailService = {
  send(message: EmailMessageInput): Promise<EmailDeliveryResult> {
    return provider.deliver(message);
  },
};
