import { z } from "zod";

const stringToBoolean = z
  .preprocess((v) => {
    if (v === "true" || v === true) return true;
    if (v === "false" || v === false) return false;
    return v;
  }, z.boolean())
  .default(false);

const envVarsSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  APP_NAME: z.string().min(1).default("Universal MCP Gateway"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),

  R2_ACCESS_KEY_ID: z.string().min(1, "R2_ACCESS_KEY_ID is required"),
  R2_SECRET_ACCESS_KEY: z.string().min(1, "R2_SECRET_ACCESS_KEY is required"),
  R2_BUCKET_NAME: z.string().min(1, "R2_BUCKET_NAME is required"),
  R2_ACCOUNT_ID: z.string().min(1, "R2_ACCOUNT_ID is required"),
  R2_PUBLIC_URL: z.string().default(""),

  OPENROUTER_API_KEY: z.string().min(1, "OPENROUTER_API_KEY is required"),
  OPENROUTER_BASE_URL: z.string().url().default("https://openrouter.ai/api/v1"),
  OPENROUTER_REFERRER: z.string().default(""),

  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid URL"),

  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),

  INNGEST_EVENT_KEY: z.string().min(1, "INNGEST_EVENT_KEY is required"),
  INNGEST_SIGNING_KEY: z.string().min(1, "INNGEST_SIGNING_KEY is required"),
  INNGEST_APP_ID: z.string().min(1).default("universal-mcp-gateway"),

  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .default("info"),
  LOG_PRETTY: stringToBoolean,
});

export const configSchema = envVarsSchema.transform((raw) => ({
  app: {
    env: raw.NODE_ENV,
    url: raw.APP_URL,
    name: raw.APP_NAME,
  },
  database: {
    url: raw.DATABASE_URL,
  },
  redis: {
    url: raw.REDIS_URL,
  },
  r2: {
    accessKeyId: raw.R2_ACCESS_KEY_ID,
    secretAccessKey: raw.R2_SECRET_ACCESS_KEY,
    bucketName: raw.R2_BUCKET_NAME,
    accountId: raw.R2_ACCOUNT_ID,
    publicUrl: raw.R2_PUBLIC_URL,
  },
  openrouter: {
    apiKey: raw.OPENROUTER_API_KEY,
    baseUrl: raw.OPENROUTER_BASE_URL,
    referrer: raw.OPENROUTER_REFERRER,
  },
  auth: {
    secret: raw.BETTER_AUTH_SECRET,
    url: raw.BETTER_AUTH_URL,
  },
  sentry: {
    dsn: raw.SENTRY_DSN,
    environment: raw.SENTRY_ENVIRONMENT ?? raw.NODE_ENV,
  },
  inngest: {
    eventKey: raw.INNGEST_EVENT_KEY,
    signingKey: raw.INNGEST_SIGNING_KEY,
    appId: raw.INNGEST_APP_ID,
  },
  logging: {
    level: raw.LOG_LEVEL,
    pretty: raw.LOG_PRETTY,
  },
}));

export type Config = z.infer<typeof configSchema>;

export type AppConfig = Config["app"];
export type DatabaseConfig = Config["database"];
export type RedisConfig = Config["redis"];
export type R2Config = Config["r2"];
export type OpenRouterConfig = Config["openrouter"];
export type AuthConfig = Config["auth"];
export type SentryConfig = Config["sentry"];
export type InngestConfig = Config["inngest"];
export type LoggingConfig = Config["logging"];
