import { AiCostModel } from "../models/ai-cost";

export async function insertCostRecords(
  records: Record<string, unknown>[],
): Promise<void> {
  await AiCostModel.insertMany(records, { ordered: false });
}
