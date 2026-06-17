export { ProtocolHandler } from "./protocol/handler";
export type { ProtocolHandlerConfig } from "./protocol/handler";
export { MethodRegistry } from "./protocol/methods";
export { parseJSONRPC, formatResponse, formatErrorResponse } from "./protocol/json-rpc";
export type { ParseResult } from "./protocol/json-rpc";
export { formatError, formatInternalError, getErrorMessage } from "./protocol/errors";
export { SSETransport } from "./transports/sse";
export type { SSETransportConfig } from "./transports/sse";
export { StdioTransport } from "./transports/stdio";
export type { Transport } from "./transports/transport";
export type {
  JSONRPCRequest,
  JSONRPCNotification,
  JSONRPCResponse,
  JSONRPCErrorObject,
  JSONRPCMessage,
  JSONRPCMessageOrBatch,
  MCPMethod,
  InitializeParams,
  InitializeResult,
  ListToolsResult,
  CallToolParams,
  CallToolResult,
  MCPToolDefinition,
  ServerCapabilities,
  ServerInfo,
  MCPConfiguration,
  MethodHandler,
  CancellableRequest,
} from "./types";
export { JSONRPCError, ErrorCode, JSONRPC_VERSION } from "./types";

export { createToolRegistry } from "./registry/service";
export type { ToolRegistry, ToolRegistryOptions } from "./registry/service";
export { ToolCache } from "./registry/cache";
export type {
  ToolDefinition,
  ToolHandler,
  ToolContext,
  ToolMetadata,
  RegisterToolInput,
  UpdateToolInput,
  DeprecateToolInput,
  ToolFilter,
  RegistryConfig,
  RegistryResponse,
  RegistryResult,
  RegistryError,
} from "./registry/types";
export { DEFAULT_REGISTRY_CONFIG } from "./registry/types";
export { validateToolName, validateJSONSchema } from "./registry/validation";
