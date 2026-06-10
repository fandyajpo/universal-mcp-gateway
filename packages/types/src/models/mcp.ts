export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
}

export interface MCPRequest {
  id: string;
  method: string;
  params?: unknown;
}

export interface MCPError {
  code: number;
  message: string;
  data?: unknown;
}

export interface MCPResponse {
  id: string;
  result?: unknown;
  error?: MCPError;
}

export interface MCPCapability {
  name: string;
  version: string;
  tools?: MCPTool[];
}
