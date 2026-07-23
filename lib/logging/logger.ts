type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Readonly<Record<string, unknown>>;

const sensitiveKeyPattern =
  /authorization|cookie|password|secret|token|card|cvv|email/i;

function redact(context: LogContext): LogContext {
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [
      key,
      sensitiveKeyPattern.test(key) ? "[REDACTED]" : value,
    ]),
  );
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
    ...redact(context),
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
