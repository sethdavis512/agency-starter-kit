/**
 * Minimal dependency-free JSON logger.
 *
 * Every call writes exactly one JSON line so Railway (or any log drain) can
 * index it without a parser plugin:
 *
 *   {"level":"error","time":"2026-09-03T12:00:00.000Z","msg":"Unhandled request error","url":"…","err":{"name":"Error","message":"…","stack":"…"}}
 *
 * `Error` values anywhere in the fields are serialized to
 * `{ name, message, stack, cause? }` instead of the empty `{}` that
 * `JSON.stringify` would produce. The level is read from `LOG_LEVEL`
 * (debug | info | warn | error | silent, default `info`) when no explicit
 * level is passed. Swap `write` to redirect output (tests do this).
 */

export const LOG_LEVELS = ["debug", "info", "warn", "error", "silent"] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

export type LogFields = Record<string, unknown>;

export interface Logger {
  readonly level: LogLevel;
  debug(msg: string, fields?: LogFields): void;
  info(msg: string, fields?: LogFields): void;
  warn(msg: string, fields?: LogFields): void;
  error(msg: string, fields?: LogFields): void;
  /** Returns a logger that merges `fields` into every line it writes. */
  child(fields: LogFields): Logger;
}

export interface LoggerOptions {
  /** Minimum level to emit. Defaults to `LOG_LEVEL`, then `info`. */
  level?: LogLevel;
  /** Fields merged into every line (e.g. `{ app: "portal" }`). */
  base?: LogFields;
  /** Output sink. Defaults to stdout for debug/info and stderr for warn/error. */
  write?: (line: string, level: Exclude<LogLevel, "silent">) => void;
  /** Clock override for deterministic tests. */
  now?: () => Date;
}

export interface SerializedError {
  name: string;
  message: string;
  stack?: string;
  cause?: unknown;
}

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: Number.POSITIVE_INFINITY,
};

export function isLogLevel(value: unknown): value is LogLevel {
  return (
    typeof value === "string" &&
    (LOG_LEVELS as readonly string[]).includes(value)
  );
}

/**
 * Normalizes an env value into a `LogLevel`, falling back to `fallback`
 * for unset or unrecognized input.
 */
export function resolveLogLevel(
  value: string | undefined,
  fallback: LogLevel = "info",
): LogLevel {
  const normalized = value?.trim().toLowerCase();
  return isLogLevel(normalized) ? normalized : fallback;
}

export function serializeError(error: unknown): SerializedError {
  if (error instanceof Error) {
    const serialized: SerializedError = {
      name: error.name,
      message: error.message,
    };
    if (error.stack) serialized.stack = error.stack;
    if (error.cause !== undefined) {
      serialized.cause =
        error.cause instanceof Error
          ? serializeError(error.cause)
          : error.cause;
    }
    return serialized;
  }
  return { name: "NonError", message: String(error) };
}

function replacer(_key: string, value: unknown) {
  if (value instanceof Error) return serializeError(value);
  if (typeof value === "bigint") return value.toString();
  return value;
}

function defaultWrite(line: string, level: Exclude<LogLevel, "silent">) {
  if (level === "warn" || level === "error") {
    console.error(line);
  } else {
    console.log(line);
  }
}

function envLogLevel(): LogLevel {
  const env =
    typeof process !== "undefined" && process.env
      ? process.env.LOG_LEVEL
      : undefined;
  return resolveLogLevel(env);
}

export function createLogger(options: LoggerOptions = {}): Logger {
  const level = options.level ?? envLogLevel();
  const base = options.base ?? {};
  const write = options.write ?? defaultWrite;
  const now = options.now ?? (() => new Date());
  const threshold = LEVEL_WEIGHT[level];

  function emit(
    entryLevel: Exclude<LogLevel, "silent">,
    msg: string,
    fields?: LogFields,
  ) {
    if (LEVEL_WEIGHT[entryLevel] < threshold) return;

    const entry = {
      level: entryLevel,
      time: now().toISOString(),
      msg,
      ...base,
      ...fields,
    };

    let line: string;
    try {
      line = JSON.stringify(entry, replacer);
    } catch {
      // Circular or otherwise unserializable fields: keep the envelope so the
      // line still lands in the log instead of throwing inside an error path.
      line = JSON.stringify({
        level: entryLevel,
        time: entry.time,
        msg,
        serializationError: "fields could not be serialized",
      });
    }

    write(line, entryLevel);
  }

  return {
    level,
    debug: (msg, fields) => emit("debug", msg, fields),
    info: (msg, fields) => emit("info", msg, fields),
    warn: (msg, fields) => emit("warn", msg, fields),
    error: (msg, fields) => emit("error", msg, fields),
    child: (fields) =>
      createLogger({ ...options, level, base: { ...base, ...fields } }),
  };
}

/** Shared default logger, configured from `LOG_LEVEL`. */
export const logger: Logger = createLogger();
