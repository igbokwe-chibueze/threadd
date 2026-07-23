import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";

const previewTokenStorage = new AsyncLocalStorage<string>();

export function withEmailPreviewToken<T>(
  token: string,
  operation: () => Promise<T>,
): Promise<T> {
  return previewTokenStorage.run(token, operation);
}

export function getEmailPreviewToken(): string | undefined {
  return previewTokenStorage.getStore();
}
