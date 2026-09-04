import { describe, expect, it, vi } from "vitest";
import {
  createLogger,
  resolveLogLevel,
  serializeError,
  type LogLevel,
} from "./logger";

const FIXED_TIME = new Date("2026-09-03T12:00:00.000Z");

function captureLogger(level: LogLevel = "debug") {
  const write = vi.fn<(line: string, level: string) => void>();
  const logger = createLogger({ level, write, now: () => FIXED_TIME });
  const lines = () => write.mock.calls.map(([line]) => JSON.parse(line));
  return { logger, write, lines };
}

describe("createLogger", () => {
  it("writes one JSON line per call with level, time and msg first", () => {
    const { logger, write } = captureLogger();

    logger.info("hello", { requestId: "abc" });

    expect(write).toHaveBeenCalledTimes(1);
    const [line, level] = write.mock.calls[0];
    expect(level).toBe("info");
    expect(line).not.toContain("\n");
    expect(line).toBe(
      '{"level":"info","time":"2026-09-03T12:00:00.000Z","msg":"hello","requestId":"abc"}',
    );
  });

  it("drops entries below the configured level", () => {
    const { logger, lines } = captureLogger("warn");

    logger.debug("d");
    logger.info("i");
    logger.warn("w");
    logger.error("e");

    expect(lines().map((entry) => entry.level)).toEqual(["warn", "error"]);
  });

  it("emits nothing when silent", () => {
    const { logger, write } = captureLogger("silent");

    logger.error("boom");

    expect(write).not.toHaveBeenCalled();
  });

  it("serializes Error fields to name, message and stack", () => {
    const { logger, lines } = captureLogger();
    const err = new TypeError("bad input");

    logger.error("Unhandled request error", { url: "/dashboard", err });

    const [entry] = lines();
    expect(entry.url).toBe("/dashboard");
    expect(entry.err.name).toBe("TypeError");
    expect(entry.err.message).toBe("bad input");
    expect(entry.err.stack).toContain("TypeError: bad input");
  });

  it("merges child fields into every line", () => {
    const { logger, lines } = captureLogger();

    logger.child({ app: "portal" }).info("ready", { port: 5520 });

    expect(lines()[0]).toMatchObject({
      app: "portal",
      port: 5520,
      msg: "ready",
    });
  });

  it("still writes a line when fields cannot be serialized", () => {
    const { logger, lines } = captureLogger();
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    logger.error("circular", { circular });

    expect(lines()[0]).toMatchObject({
      level: "error",
      msg: "circular",
      serializationError: expect.any(String),
    });
  });

  it("routes warn and error to stderr and the rest to stdout by default", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const logger = createLogger({ level: "debug" });
      logger.info("out");
      logger.warn("err");

      expect(log).toHaveBeenCalledTimes(1);
      expect(error).toHaveBeenCalledTimes(1);
    } finally {
      log.mockRestore();
      error.mockRestore();
    }
  });
});

describe("resolveLogLevel", () => {
  it("accepts known levels case-insensitively", () => {
    expect(resolveLogLevel("DEBUG")).toBe("debug");
    expect(resolveLogLevel(" error ")).toBe("error");
  });

  it("falls back for unset or unknown values", () => {
    expect(resolveLogLevel(undefined)).toBe("info");
    expect(resolveLogLevel("verbose")).toBe("info");
    expect(resolveLogLevel("verbose", "warn")).toBe("warn");
  });
});

describe("serializeError", () => {
  it("includes a nested cause", () => {
    const err = new Error("outer", { cause: new Error("inner") });

    expect(serializeError(err)).toMatchObject({
      name: "Error",
      message: "outer",
      cause: { name: "Error", message: "inner" },
    });
  });

  it("wraps non-Error values", () => {
    expect(serializeError("plain string")).toEqual({
      name: "NonError",
      message: "plain string",
    });
  });
});
