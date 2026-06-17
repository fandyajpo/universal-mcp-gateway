import { NextResponse } from "next/server";

import { getAiAuthContext, unauthorizedResponse, serverErrorResponse } from "../middleware";
import { createOpenRouterClient } from "@repo/ai";

export async function GET(request: Request): Promise<NextResponse> {
  const auth = getAiAuthContext(request);
  if (!auth) return unauthorizedResponse();

  try {
    const client = createOpenRouterClient();
    const models = await client.listModels();

    return NextResponse.json({
      data: models.map((m) => ({
        id: m.id,
        name: m.name,
        pricing: m.pricing,
        context_length: m.context_length,
        capabilities: m.capabilities,
      })),
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
