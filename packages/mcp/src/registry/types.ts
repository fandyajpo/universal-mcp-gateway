export type ToolHandler = (params: unknown, context: ToolContext) => Promise<unknown>;

export interface ToolContext {
  workspaceId: string;
  abortSignal?: AbortSignal;
}

export interface ToolMetadata {
  version: string;
  author: string;
  tags: string[];
  categories: string[];
  deprecated: boolean;
  deprecationMessage?: string;
  removed: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  handler: ToolHandler;
  handlerRef: string;
  metadata: ToolMetadata;
}

export interface RegisterToolInput {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  handler: ToolHandler;
  metadata?: Partial<ToolMetadata>;
}

export interface UpdateToolInput {
  description?: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  handler?: ToolHandler;
  metadata?: Partial<ToolMetadata>;
}

export interface DeprecateToolInput {
  deprecationMessage?: string;
  replacement?: string;
}

export interface ToolFilter {
  category?: string;
  tag?: string;
  includeDeprecated?: boolean;
  includeRemoved?: boolean;
}

export interface RegistryConfig {
  maxToolsPerWorkspace: number;
  cacheTTLMs: number;
}

export const DEFAULT_REGISTRY_CONFIG: RegistryConfig = {
  maxToolsPerWorkspace: 200,
  cacheTTLMs: 60_000,
};

export interface RegistryResult<T> {
  ok: true;
  data: T;
}

export interface RegistryError {
  ok: false;
  error: string;
}

export type RegistryResponse<T> = RegistryResult<T> | RegistryError;
