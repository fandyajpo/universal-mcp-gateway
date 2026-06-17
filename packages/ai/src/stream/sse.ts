import type { StreamEvent } from "./types";

export function formatStreamEvent(event: StreamEvent): string {
  const data = JSON.stringify(event, (_key, value) => {
    if (value instanceof Error) {
      return { message: value.message, name: value.name, stack: value.stack };
    }
    return value;
  });
  return `data: ${data}\n\n`;
}

export function formatEventStream(
  events: AsyncGenerator<StreamEvent>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async pull(
      controller: ReadableStreamDefaultController<Uint8Array>,
    ): Promise<void> {
      try {
        const result: IteratorResult<StreamEvent, void> = await events.next();

        if (result.done) {
          controller.close();
          return;
        }

        const sse = formatStreamEvent(result.value);
        controller.enqueue(encoder.encode(sse));
      } catch (error) {
        const errorEvent = formatStreamEvent({
          type: "error",
          error: error instanceof Error ? error : new Error(String(error)),
        });
        controller.enqueue(encoder.encode(errorEvent));
        controller.close();
      }
    },

    cancel(): void {
      void events.return(undefined);
    },
  });
}
