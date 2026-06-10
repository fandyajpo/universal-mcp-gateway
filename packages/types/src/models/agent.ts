import type { AgentStatus } from "../enums";
import type { AgentId, WorkspaceId } from "../types/branded";

export interface AgentTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface AgentConfig {
  model: string;
  instructions: string;
  temperature: number;
  maxTokens: number;
}

export interface Agent {
  id: AgentId;
  workspaceId: WorkspaceId;
  name: string;
  description?: string;
  config: AgentConfig;
  status: AgentStatus;
  tools: AgentTool[];
  createdAt: Date;
  updatedAt: Date;
}
