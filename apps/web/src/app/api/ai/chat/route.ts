import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { getAiAuthContext, unauthorizedResponse, badRequestResponse, serverErrorResponse } from "../middleware";
import { chatRequestSchema } from "../schema";
import { createProvider, createRouter, createFallbackChain } from "@repo/ai";

const DEFAULT_CHAT_FALLBACK_MODELS = [
  "openrouter/gpt-4o-mini",
  "openrouter/claude-haiku-3.5",
];

export async function POST(request: NextRequest): Promise<NextResponse> {
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

  const { model: userModel, messages, temperature, max_tokens: maxTokens } = parsed.data;

  const provider = createProvider("openrouter");
  const router = createRouter();

  let selectedModel = userModel;
  if (!selectedModel) {
    const routeResult = router.route({ taskType: "chat", userTier: "free" });
    if (!routeResult.model) {
      return serverErrorResponse(new Error("No suitable model available"));
    }
    selectedModel = routeResult.model;
  }

  const fallbackModels = userModel
    ? [userModel, ...DEFAULT_CHAT_FALLBACK_MODELS.filter((m) => m !== userModel)]
    : DEFAULT_CHAT_FALLBACK_MODELS;

  const chain = createFallbackChain({
    router,
    fallbackConfig: { chat: fallbackModels },
  });

  try {
    const { result, fallbackResult } = await chain.execute(
      async (model: string) =>
        provider.chatCompletion({
          model,
          messages,
          temperature,
          maxTokens,
        }),
      "chat",
      auth.workspaceId,
    );

    return NextResponse.json({
      id: result.id,
      model: result.model,
      choices: result.choices.map((c) => ({
        index: c.index,
        message: c.message,
        finish_reason: c.finishReason,
      })),
      usage: result.usage && {
        prompt_tokens: result.usage.promptTokens,
        completion_tokens: result.usage.completionTokens,
        total_tokens: result.usage.totalTokens,
      },
      _fallback: {
        depth: fallbackResult.fallbackDepth,
        model: fallbackResult.model,
        total_attempts: fallbackResult.totalAttempts,
      },
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
