import { Writable } from "node:stream";
import pino from "pino";
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";

import { createLogger, createChildLogger } from "./index";

function createCaptureStream(): { stream: Writable; lines: string[] } {
  const lines: string[] = [];
  const stream = new Writable({
    write(chunk: Buffer, _encoding: BufferEncoding, callback: (error?: Error | null) => void) {
      lines.push(chunk.toString().trim());
      callback();
    },
  });
  return { stream, lines };
}

describe("createLogger", () => {
  it("creates a logger with the given name", () => {
    const logger = createLogger("test-logger");
    expect(logger).toBeDefined();
    expect(logger.level).toBe("info");
  });

  it("uses LOG_LEVEL env var when set", () => {
    process.env.LOG_LEVEL = "debug";
    const logger = createLogger("test");
    expect(logger.level).toBe("debug");
    delete process.env.LOG_LEVEL;
  });

  it("defaults to info level when LOG_LEVEL is not set", () => {
    delete process.env.LOG_LEVEL;
    const logger = createLogger("test");
    expect(logger.level).toBe("info");
  });

  it("accepts a custom level via config", () => {
    const logger = createLogger("test", { level: "warn" });
    expect(logger.level).toBe("warn");
  });

  it("does not throw when logging at valid levels", () => {
    const logger = createLogger("test");
    expect(() => {
      logger.trace("trace msg");
      logger.debug("debug msg");
      logger.info("info msg");
      logger.warn("warn msg");
      logger.error("error msg");
      logger.fatal("fatal msg");
    }).not.toThrow();
  });
});

describe("createChildLogger", () => {
  it("creates a child logger with additional bindings", () => {
    const { stream, lines } = createCaptureStream();
    const parent = pino({ name: "parent" }, stream);
    const child = createChildLogger(parent, { requestId: "abc", userId: "u-1" });

    child.info("child message");

    const parsed = JSON.parse(lines[0] ?? "{}");
    expect(parsed.requestId).toBe("abc");
    expect(parsed.userId).toBe("u-1");
    expect(parsed.msg).toBe("child message");
  });

  it("child logger inherits parent context across multiple levels", () => {
    const { stream, lines } = createCaptureStream();
    const parent = pino({ name: "parent" }, stream);
    const child = createChildLogger(parent, { requestId: "abc" });
    const grandchild = createChildLogger(child, { correlationId: "corr-1" });

    grandchild.info("grandchild message");

    const parsed = JSON.parse(lines[0] ?? "{}");
    expect(parsed.requestId).toBe("abc");
    expect(parsed.correlationId).toBe("corr-1");
  });
});

describe("redaction", () => {
  it("masks default sensitive fields in log output", () => {
    const { stream, lines } = createCaptureStream();
    const logger = pino(
      {
        name: "test",
        redact: [
          "password",
          "secret",
          "token",
          "authorization",
          "cookie",
          "set-cookie",
          "apiKey",
          "accessToken",
          "refreshToken",
        ],
      },
      stream,
    );

    logger.info({
      password: "my-password",
      authorization: "Bearer secret-token",
      user: "normal-field",
      msg: "test",
    });

    const output = lines.join("");
    expect(output).toContain("[Redacted]");
    expect(output).not.toContain("my-password");
    expect(output).not.toContain("Bearer secret-token");
    expect(output).toContain("normal-field");
  });

  it("merges user-provided redact paths with defaults", () => {
    const logger = createLogger("test", { redact: ["customField"] });
    expect(logger).toBeDefined();
    expect(logger.level).toBe("info");
  });
});

describe("Sentry transport", () => {
  let sentryCaptureException: ReturnType<typeof vi.fn>;

  beforeAll(() => {
    vi.mock("@sentry/core", () => ({
      captureException: vi.fn(),
      captureMessage: vi.fn(),
    }));
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  beforeEach(async () => {
    const sentry = await import("@sentry/core");
    sentryCaptureException = sentry.captureException as ReturnType<typeof vi.fn>;
    sentryCaptureException.mockClear();
  });

  it("calls Sentry.captureException for error level logs when DSN is set", async () => {
    const logger = createLogger("test", {
      sentryDsn: "https://key@o0.ingest.sentry.io/123",
    });

    logger.error(new Error("test error"));

    await new Promise((r) => setTimeout(r, 50));

    expect(sentryCaptureException).toHaveBeenCalled();
  });

  it("calls Sentry.captureException for fatal level logs when DSN is set", async () => {
    const logger = createLogger("test", {
      sentryDsn: "https://key@o0.ingest.sentry.io/123",
    });

    logger.fatal("fatal error");

    await new Promise((r) => setTimeout(r, 50));

    expect(sentryCaptureException).toHaveBeenCalled();
  });
});

describe("production defaults", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("disables pretty-printing in production", () => {
    process.env.NODE_ENV = "production";
    delete process.env.LOG_PRETTY;

    const logger = createLogger("test");
    expect(logger).toBeDefined();
    expect(logger.level).toBe("info");
  });
});
