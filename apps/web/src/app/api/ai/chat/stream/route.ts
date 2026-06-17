import { NextRequest } from "next/server";

import { z } from "zod";

import { getAiAuthContext, unauthorizedResponse, badRequestResponse } from "../../middleware";
import { chatRequestSchema } from "../../schema";
import { createProvider, createStream, formatEventStream } from "@repo/ai";

export async function POST(request: NextRequest): Promise<Response> {
  const auth = getAiAuthContext(request);
  if (!auth) return unauthorizedResponse();

  let body: unknown;
  try {
    body = await request.json() as unknown;
  } catch {
    return badRequestResponse("Invalid JSON body");
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return badRequestResponse("Validation failed", z.treeifyError(parsed.error));
  }

  const { model: selectedModel, messages, temperature, max_tokens: maxTokens } = parsed.data;

  const provider = createProvider("openrouter");

  const handle = createStream(provider, {
    model: selectedModel ?? "openrouter/gpt-4o-mini",
    messages,
    temperature,
    maxTokens,
    stream: true,
  });

  const stream = formatEventStream(handle.events);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
