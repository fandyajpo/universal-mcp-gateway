import type { DocumentId, WorkspaceId } from "../types/branded";

export interface DocumentMetadata {
  author?: string;
  source?: string;
  tags?: string[];
  category?: string;
  description?: string;
}

export interface DocumentSource {
  type: string;
  url?: string;
  originalName?: string;
}

export interface Document {
  id: DocumentId;
  workspaceId: WorkspaceId;
  title: string;
  content?: string;
  metadata: DocumentMetadata;
  source: DocumentSource;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentChunk {
  id: string;
  documentId: DocumentId;
  content: string;
  index: number;
  embedding?: number[];
  metadata: Record<string, unknown>;
}
