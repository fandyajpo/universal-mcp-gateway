import type pino from "pino";

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

export interface LoggerConfig {
  level: LogLevel;
  pretty: boolean;
  redact: string[];
  sentryDsn?: string;
}

export type Logger = pino.Logger;
