import { configSchema } from "./schema";
import type { Config } from "./schema";

export type { Config };

export class ConfigValidationError extends Error {
  public readonly zodIssues: readonly {
    path: readonly (string | number)[];
    message: string;
  }[];

  constructor(errors: readonly { path: readonly (string | number)[]; message: string }[]) {
    const message = errors
      .map((e) => `${[...e.path].join(".")}: ${e.message}`)
      .join("\n");
    super(`Configuration validation failed:\n${message}`);
    this.name = "ConfigValidationError";
    this.zodIssues = errors;
  }
}

let cachedConfig: Config | null = null;

function deepFreeze<T>(obj: T): T {
  if (obj && typeof obj === "object" && !Object.isFrozen(obj)) {
    for (const value of Object.values(obj as Record<string, unknown>)) {
      if (value && typeof value === "object") {
        deepFreeze(value);
      }
    }
  }
  return Object.freeze(obj);
}

export function loadConfig(
  overrides?: Partial<Record<string, string | undefined>>,
): Config {
  const env: Record<string, string | undefined> = {
    ...process.env,
    ...overrides,
  };

  const result = configSchema.safeParse(env);

  if (!result.success) {
    throw new ConfigValidationError(
      result.error.issues.map((issue) => ({
        path: issue.path,
        message: issue.message,
      })),
    );
  }

  const config = deepFreeze(result.data);
  cachedConfig = config;
  return config;
}

export function getConfig(): Config {
  if (!cachedConfig) {
    return loadConfig();
  }
  return cachedConfig;
}

export function validateConfig(): void {
  getConfig();
}

export function isProduction(): boolean {
  return getConfig().app.env === "production";
}

export function isDevelopment(): boolean {
  return getConfig().app.env === "development";
}

export function isTest(): boolean {
  return getConfig().app.env === "test";
}
