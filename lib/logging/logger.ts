type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Readonly<Record<string, unknown>>;

const sensitiveKeyPattern =
  /address|authorization|card|cookie|credential|cvv|email|name|password|phone|secret|token/i;
const MAX_SANITIZE_DEPTH = 6;
const REDACTED = "[REDACTED]";

/**
 * Convert arbitrary diagnostic context into a JSON-safe, privacy-safe value.
 *
 * Logging is a trust boundary: errors and provider responses can contain
 * nested credentials or customer data even when the immediate caller did not
 * intentionally include them. Redaction therefore walks arrays and objects
 * recursively instead of checking only top-level keys. Errors are reduced to
 * their class name; messages and stacks are deliberately excluded because
 * either can contain request data, SQL fragments, or provider payloads.
 */
export function sanitizeLogValue(
  value: unknown,
  depth = 0,
  seen: WeakSet<object> = new WeakSet(),
): unknown {
  if (depth > MAX_SANITIZE_DEPTH) {
    return "[MAX_DEPTH]";
  }

  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return { errorType: value.name || "Error" };
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeLogValue(entry, depth + 1, seen));
  }

  if (typeof value === "object") {
    if (seen.has(value)) {
      return "[CIRCULAR]";
    }
    seen.add(value);

    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        sensitiveKeyPattern.test(key)
          ? REDACTED
          : sanitizeLogValue(entry, depth + 1, seen),
      ]),
    );
  }

  return `[${typeof value}]`;
}

export function sanitizeLogContext(context: LogContext): LogContext {
  return sanitizeLogValue(context) as LogContext;
}

function write(
  level: LogLevel,
  message: string,
  context: LogContext = {},
): void {
  const payload = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    /*
     * Context stays nested so a caller cannot overwrite the trusted timestamp,
     * severity, or event message with similarly named untrusted properties.
     */
    context: sanitizeLogContext(context),
  });

  if (level === "error") {
    console.error(payload);
    return;
  }

  if (level === "warn") {
    console.warn(payload);
    return;
  }

  console.info(payload);
}

export const logger = {
  debug: (message: string, context?: LogContext) =>
    write("debug", message, context),
  info: (message: string, context?: LogContext) =>
    write("info", message, context),
  warn: (message: string, context?: LogContext) =>
    write("warn", message, context),
  error: (message: string, context?: LogContext) =>
    write("error", message, context),
};
