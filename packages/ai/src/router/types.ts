export type TaskType = "chat" | "completion" | "embedding";

export type HealthStatus = "healthy" | "degraded" | "down";

export type TierName = "free" | "pro" | "enterprise";

export interface ModelRegistryEntry {
  modelId: string;
  providerId: string;
  capabilities: string[];
  contextWindow: number;
  pricing: {
    prompt: number;
    completion: number;
  };
  tier: TierName[];
  health: HealthStatus;
}

export interface RouteRequest {
  taskType: TaskType;
  capabilities?: string[];
  maxCost?: number;
  preferredModel?: string;
  userTier: TierName;
}

export interface RouteResult {
  model: string;
  provider: string;
  estimatedCost: number;
  reasoning: string;
}

export interface TierConfig {
  maxCost: number;
  allowlist: string[];
}

export interface RouterConfig {
  estimatePromptTokens?: number;
  estimateCompletionTokens?: number;
}
