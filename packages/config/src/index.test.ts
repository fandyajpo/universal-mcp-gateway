import { describe, it, expect, beforeEach } from "vitest";

import {
  loadConfig,
  getConfig,
  validateConfig,
  isProduction,
  isDevelopment,
  isTest,
  ConfigValidationError,
} from "./index";
import type { Config } from "./index";

type EnvOverride = Record<string, string | undefined>;

const MINIMAL_ENV: EnvOverride = {
  NODE_ENV: "development",
  DATABASE_URL: "mongodb://localhost:27017/test",
  REDIS_URL: "redis://localhost:6379",
  R2_ACCESS_KEY_ID: "ak-id",
  R2_SECRET_ACCESS_KEY: "sa-key",
  R2_BUCKET_NAME: "test-bucket",
  R2_ACCOUNT_ID: "acct-1",
  OPENROUTER_API_KEY: "sk-or-v1-test",
  BETTER_AUTH_SECRET: "ba-secret",
  BETTER_AUTH_URL: "http://localhost:3000",
  INNGEST_EVENT_KEY: "evt-key",
  INNGEST_SIGNING_KEY: "sig-key",
};

beforeEach(() => {
  // Clear cache between tests by re-loading
  // We use a fresh loadConfig for each test
});

describe("loadConfig", () => {
  it("loads config with valid env vars", () => {
    const config = loadConfig(MINIMAL_ENV);

    expect(config.app.env).toBe("development");
    expect(config.app.url).toBe("http://localhost:3000");
    expect(config.app.name).toBe("Universal MCP Gateway");
    expect(config.database.url).toBe("mongodb://localhost:27017/test");
    expect(config.redis.url).toBe("redis://localhost:6379");
    expect(config.logging.level).toBe("info");
    expect(config.logging.pretty).toBe(false);
  });

  it("throws ConfigValidationError when a required var is missing", () => {
    expect(() => {
      loadConfig({ ...MINIMAL_ENV, DATABASE_URL: undefined });
    }).toThrow(ConfigValidationError);
  });

  it("includes the missing var name in the error message", () => {
    expect(() => {
      loadConfig({ ...MINIMAL_ENV, DATABASE_URL: undefined });
    }).toThrow(/DATABASE_URL/);
  });

  it("applies default values for optional vars", () => {
    const config = loadConfig({
      ...MINIMAL_ENV,
      NODE_ENV: undefined,
      LOG_LEVEL: undefined,
      LOG_PRETTY: undefined,
      R2_PUBLIC_URL: undefined,
    });

    expect(config.app.env).toBe("development");
    expect(config.logging.level).toBe("info");
    expect(config.logging.pretty).toBe(false);
    expect(config.r2.publicUrl).toBe("");
  });

  it("parses LOG_PRETTY string 'true' as boolean true", () => {
    const config = loadConfig({ ...MINIMAL_ENV, LOG_PRETTY: "true" });
    expect(config.logging.pretty).toBe(true);
  });

  it("parses LOG_PRETTY string 'false' as boolean false", () => {
    const config = loadConfig({ ...MINIMAL_ENV, LOG_PRETTY: "false" });
    expect(config.logging.pretty).toBe(false);
  });

  it("returns a deeply frozen config object", () => {
    const config = loadConfig(MINIMAL_ENV);

    expect(Object.isFrozen(config)).toBe(true);
    expect(Object.isFrozen(config.app)).toBe(true);
    expect(Object.isFrozen(config.database)).toBe(true);
  });
});

describe("getConfig", () => {
  it("returns the same cached instance on subsequent calls", () => {
    const first = loadConfig(MINIMAL_ENV);
    const second = getConfig();
    expect(second).toBe(first);
  });
});

describe("validateConfig", () => {
  it("does not throw when all required vars are present", () => {
    loadConfig(MINIMAL_ENV);
    expect(() => { validateConfig(); }).not.toThrow();
  });
});

describe("environment helpers", () => {
  it("isDevelopment returns true when NODE_ENV is development", () => {
    loadConfig({ ...MINIMAL_ENV, NODE_ENV: "development" });
    expect(isDevelopment()).toBe(true);
    expect(isProduction()).toBe(false);
    expect(isTest()).toBe(false);
  });

  it("isProduction returns true when NODE_ENV is production", () => {
    loadConfig({ ...MINIMAL_ENV, NODE_ENV: "production" });
    expect(isProduction()).toBe(true);
    expect(isDevelopment()).toBe(false);
    expect(isTest()).toBe(false);
  });

  it("isTest returns true when NODE_ENV is test", () => {
    loadConfig({ ...MINIMAL_ENV, NODE_ENV: "test" });
    expect(isTest()).toBe(true);
    expect(isDevelopment()).toBe(false);
    expect(isProduction()).toBe(false);
  });
});

describe("type exports", () => {
  it("Config type is available", () => {
    const config: Config = loadConfig(MINIMAL_ENV);
    expect(typeof config.app.env).toBe("string");
  });
});
