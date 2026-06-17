import { AiCostModel } from "../models/ai-cost";
import type { PipelineStage } from "mongoose";

export async function runCostAggregation(
  pipeline: Record<string, unknown>[],
): Promise<Record<string, unknown>[]> {
  const results = await AiCostModel.aggregate(
    pipeline as unknown as PipelineStage[],
  );
  return results as Record<string, unknown>[];
}
