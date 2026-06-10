import pino from "pino";

import { createSentryStream } from "./sentry-transport";
import type { Logger, LoggerConfig, LogLevel } from "./types";
import type pinoCore from "pino";

export type { Logger, LoggerConfig, LogLevel };

const SENSITIVE_FIELDS: string[] = [
  "password",
  "secret",
  "token",
  "authorization",
  "cookie",
  "set-cookie",
  "apiKey",
  "accessToken",
  "refreshToken",
];

const STANDARD_SERIALIZERS: pinoCore.LoggerOptions["serializers"] = {
  error: pino.stdSerializers.err,
  request: pino.stdSerializers.req,
  response: pino.stdSerializers.res,
};

export function createLogger(name: string, config?: Partial<LoggerConfig>): Logger {
  const userLevel: LogLevel | undefined = config?.level;
  const userPretty: boolean | undefined = config?.pretty;
  const userSentryDsn: string | undefined = config?.sentryDsn;

  const merged: LoggerConfig = {
    level: userLevel ?? "info",
    pretty: userPretty ?? false,
    redact: [...SENSITIVE_FIELDS, ...(config?.redact ?? [])],
    sentryDsn: userSentryDsn,
  };

  const pinoOptions: pinoCore.LoggerOptions = {
    name,
    level: merged.level,
    redact: merged.redact,
    serializers: STANDARD_SERIALIZERS,
  };

  const isPretty = merged.pretty;

  if (merged.sentryDsn && isPretty) {
    const prettyTarget = pino.transport({
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    }) as pinoCore.DestinationStream;
    return pino(
      pinoOptions,
      pino.multistream([
        { stream: prettyTarget },
        { stream: createSentryStream(merged.sentryDsn), level: "error" },
      ]),
    );
  }

  if (isPretty) {
    return pino(pinoOptions, pino.transport({
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    }) as pinoCore.DestinationStream);
  }

  if (merged.sentryDsn) {
    return pino(
      pinoOptions,
      pino.multistream([
        { stream: pino.destination(1) },
        { stream: createSentryStream(merged.sentryDsn), level: "error" },
      ]),
    );
  }

  return pino(pinoOptions);
}

export function createChildLogger(logger: Logger, bindings: Record<string, unknown>): Logger {
  return logger.child(bindings);
}
