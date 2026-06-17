export const JSONRPC_VERSION = "2.0" as const;

export interface JSONRPCRequest {
  jsonrpc: typeof JSONRPC_VERSION;
  method: string;
  params?: unknown;
  id: string | number;
}

export interface JSONRPCNotification {
  jsonrpc: typeof JSONRPC_VERSION;
  method: string;
  params?: unknown;
  id?: never;
}

export interface JSONRPCResponse {
  jsonrpc: typeof JSONRPC_VERSION;
  id: string | number | null;
  result?: unknown;
  error?: JSONRPCErrorObject;
}

export interface JSONRPCErrorObject {
  code: number;
  message: string;
  data?: unknown;
}

export type JSONRPCMessage = JSONRPCRequest | JSONRPCNotification | JSONRPCResponse;

export type JSONRPCMessageOrBatch = JSONRPCMessage | JSONRPCMessage[];

export type MCPMethod =
  | "initialize"
  | "ping"
  | "tools/list"
  | "tools/call"
  | "notifications/initialized"
  | "notifications/cancelled"
  | (string & {});

export interface InitializeParams {
  protocolVersion: string;
  capabilities: {
    tools?: Record<string, unknown>;
    resources?: Record<string, unknown>;
    prompts?: Record<string, unknown>;
  };
  clientInfo: {
    name: string;
    version: string;
  };
}

export interface InitializeResult {
  protocolVersion: string;
  capabilities: {
    tools?: { listChanged?: boolean };
    resources?: { subscribe?: boolean; listChanged?: boolean };
    prompts?: { listChanged?: boolean };
  };
  serverInfo: {
    name: string;
    version: string;
  };
}

export interface ListToolsResult {
  tools: MCPToolDefinition[];
}

export interface CallToolParams {
  name: string;
  arguments?: Record<string, unknown>;
}

export interface CallToolResult {
  content: {
    type: "text" | "image" | "resource";
    text?: string;
    data?: string;
    mimeType?: string;
  }[];
  isError?: boolean;
}

export interface PingResult {
  _?: undefined;
}

export interface MCPToolDefinition {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
}

export interface ServerCapabilities {
  tools?: { listChanged?: boolean };
  resources?: { subscribe?: boolean; listChanged?: boolean };
  prompts?: { listChanged?: boolean };
}

export interface ServerInfo {
  name: string;
  version: string;
}

export interface MCPConfiguration {
  serverInfo: ServerInfo;
  capabilities: ServerCapabilities;
  protocolVersion: string;
}

export interface Transport {
  onMessage(handler: (data: string) => void): void;
  send(data: string): Promise<void>;
  close(): Promise<void>;
}

export interface CancellableRequest {
  id: string | number;
  abortController: AbortController;
}

export type MethodHandler = (
  params: unknown,
  extra: { abortSignal?: AbortSignal },
) => Promise<unknown>;

export class JSONRPCError extends Error {
  public readonly code: number;
  public readonly data?: unknown;

  constructor(code: number, message: string, data?: unknown) {
    super(message);
    this.name = "JSONRPCError";
    this.code = code;
    this.data = data;
  }
}

export const ErrorCode = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
} as const;
