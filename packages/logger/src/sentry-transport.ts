import { captureException } from "@sentry/core";
import { Writable } from "node:stream";

export function createSentryStream(dsn: string): Writable {
  void dsn;

  return new Writable({
    write(
      chunk: Buffer,
      _encoding: BufferEncoding,
      callback: (error?: Error | null) => void,
    ): void {
      try {
        const obj = JSON.parse(chunk.toString()) as Record<string, unknown>;
        const level = obj.level as number;

        if (level >= 50) {
          const error = obj.err
            ? Object.assign(
                new Error(String((obj.err as Record<string, string>).message ?? obj.msg)),
                { stack: (obj.err as Record<string, string>).stack, name: (obj.err as Record<string, string>).name },
              )
            : new Error(String(obj.msg));

          captureException(error, {
            level: level >= 60 ? "fatal" : "error",
            extra: obj,
          });
        }
      } catch {
        // Silently fail — logging must never throw
      }
      callback();
    },
  });
}
