export interface RetrievalChunk {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  sectionPath?: string;
  pageNumber?: number;
  text: string;
  score: number;
  rerankScore?: number;
  metadata?: Record<string, unknown>;
}

export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
}

export interface BudgetAllocation {
  context: number;
  instructions: number;
  history: number;
}

export interface BuildContextOptions {
  modelMaxTokens: number;
  budgetAllocation?: Partial<BudgetAllocation>;
  maxChunks?: number;
  includeCitations?: boolean;
  includeScores?: boolean;
  conversationHistory?: ConversationMessage[];
  systemInstructions?: string;
}

export interface TruncationDetails {
  reason: string;
  removedChunks: number;
  removedHistory: number;
  slidingWindowApplied: boolean;
}

export interface ContextResult {
  context: string;
  tokenCount: number;
  chunksUsed: number;
  truncated: boolean;
  truncationDetails: TruncationDetails | null;
}
