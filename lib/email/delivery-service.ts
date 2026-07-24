import type {
  EmailDeliveryResult,
  EmailMessageInput,
  EmailProvider,
} from "@/lib/email/types";

type RetryOptions = Readonly<{
  attempts?: number;
  delay?: (attempt: number) => Promise<void>;
}>;

const defaultDelay = (attempt: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, attempt * 150));

export class EmailDeliveryService {
  constructor(
    private readonly provider: EmailProvider,
    private readonly retry: RetryOptions = {},
  ) {}

  async send(message: EmailMessageInput): Promise<EmailDeliveryResult> {
    const attempts = Math.max(1, this.retry.attempts ?? 3);
    const delay = this.retry.delay ?? defaultDelay;
    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        return await this.provider.deliver(message);
      } catch (error) {
        lastError = error;
        if (attempt < attempts) await delay(attempt);
      }
    }

    throw lastError;
  }
}
