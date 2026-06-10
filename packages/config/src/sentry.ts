import { dedupeIntegration, functionToStringIntegration, inboundFiltersIntegration, init } from "@sentry/node";

import { getConfig } from "./config";
import type { ErrorEvent } from "@sentry/node";

export function initSentry(): void {
  const config = getConfig();
  const { dsn, environment } = config.sentry;

  if (!dsn) {
    return;
  }

  init({
    dsn,
    environment,
    release: process.env.SENTRY_RELEASE ?? undefined,
    tracesSampleRate: environment === "production" ? 0.2 : 1.0,
    profilesSampleRate: environment === "production" ? 0.1 : 0,
    integrations: [
      inboundFiltersIntegration(),
      functionToStringIntegration(),
      dedupeIntegration(),
    ],
    beforeSend(event: ErrorEvent) {
      if (event.request?.headers) {
        const { cookie: _cookie, authorization: _authorization, ...rest } = event.request.headers;
        event.request.headers = {
          ...rest,
          cookie: "[redacted]",
          authorization: "[redacted]",
        };
      }
      if (event.user?.email) {
        event.user.email = "[redacted]";
      }
      if (event.extra?.password) {
        event.extra.password = "[redacted]";
      }
      return event;
    },
  });
}
