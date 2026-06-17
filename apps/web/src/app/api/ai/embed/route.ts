import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { getAiAuthContext, unauthorizedResponse, badRequestResponse, serverErrorResponse } from "../middleware";
import { embedRequestSchema } from "../schema";
import { createProvider, createRouter } from "@repo/ai";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = getAiAuthContext(request);
  if (!auth) return unauthorizedResponse();

  let body: unknown;
  try {
    body = await request.json() as unknown;
  } catch {
    return badRequestResponse("Invalid JSON body");
  }

  const parsed = embedRequestSchema.safeParse(body);
  if (!parsed.success) {
    return badRequestResponse("Validation failed", z.treeifyError(parsed.error));
  }

  const { model: userModel, input } = parsed.data;

  const provider = createProvider("openrouter");
  const router = createRouter();

  let selectedModel = userModel;
  if (!selectedModel) {
    const routeResult = router.route({ taskType: "embedding", userTier: "free" });
    if (!routeResult.model) {
      return serverErrorResponse(new Error("No suitable model available"));
    }
    selectedModel = routeResult.model;
  }

  try {
    const result = await provider.embed({
      model: selectedModel,
      input,
    });

    return NextResponse.json({
      data: result.data.map((d) => ({
        embedding: d.embedding,
        index: d.index,
      })),
      model: result.model,
      usage: {
        prompt_tokens: result.usage.promptTokens,
        total_tokens: result.usage.totalTokens,
      },
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
