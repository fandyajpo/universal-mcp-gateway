import type { ChatRole } from "../enums";
import type { WorkspaceId } from "../types/branded";

export interface ChatMessage {
  id: string;
  threadId: string;
  role: ChatRole;
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface ChatConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface ChatThread {
  id: string;
  workspaceId: WorkspaceId;
  title?: string;
  messages?: ChatMessage[];
  config?: ChatConfig;
  createdAt: Date;
  updatedAt: Date;
}
