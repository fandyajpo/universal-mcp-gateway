export interface AiCostRecordInput {
  workspaceId: string;
  userId: string;
  requestId: string;
  model: string;
  provider: string;
  taskType: "chat" | "embedding";
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cachedTokens?: number;
  cost: number;
  currency: string;
  metadata?: {
    streamed?: boolean;
    cached?: boolean;
    fallbackDepth?: number;
  };
}

export interface AiCostRecord extends AiCostRecordInput {
  id: string;
  timestamp: Date;
}

export interface PricingEntry {
  model: string;
  promptPrice: number;
  completionPrice: number;
}

export interface CostBreakdown {
  model: string;
  totalCost: number;
  requestCount: number;
}

export interface DailyCostPoint {
  date: string;
  cost: number;
}
