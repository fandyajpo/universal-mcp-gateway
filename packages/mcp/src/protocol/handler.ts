import { JSONRPCError, ErrorCode } from "../types";
import type {
  JSONRPCRequest,
  JSONRPCResponse,
  JSONRPCMessage,
  Transport,
  MethodHandler,
  MCPConfiguration,
  CallToolParams,
  MCPToolDefinition,
  CancellableRequest,
} from "../types";
import { formatError, formatInternalError } from "./errors";
import { parseJSONRPC, formatErrorResponse } from "./json-rpc";
import { MethodRegistry } from "./methods";
import type { Logger } from "@repo/logger";

export interface ProtocolHandlerConfig {
  transport: Transport;
  logger: Logger;
  serverInfo: { name: string; version: string };
  capabilities?: {
    tools?: { listChanged?: boolean };
    resources?: { subscribe?: boolean; listChanged?: boolean };
    prompts?: { listChanged?: boolean };
  };
  protocolVersion?: string;
  toolProvider?: () => MCPToolDefinition[] | Promise<MCPToolDefinition[]>;
}

export class ProtocolHandler {
  private transport: Transport;
  private logger: Logger;
  private registry = new MethodRegistry();
  private initialized = false;
  private config: MCPConfiguration;
  private pendingRequests = new Map<string | number, CancellableRequest>();
  private toolProvider?: () => MCPToolDefinition[] | Promise<MCPToolDefinition[]>;
  private closed = false;

  constructor(opts: ProtocolHandlerConfig) {
    this.transport = opts.transport;
    this.logger = opts.logger;
    this.toolProvider = opts.toolProvider;
    this.config = {
      serverInfo: opts.serverInfo,
      capabilities: opts.capabilities ?? {},
      protocolVersion: opts.protocolVersion ?? "2024-11-05",
    };

    this.registerDefaultMethods();
    this.transport.onMessage((raw: string) => { void this.handleRawMessage(raw); });
  }

  private registerDefaultMethods(): void {
    this.registry.register("initialize", this.handleInitialize.bind(this));
    this.registry.register("ping", this.handlePing.bind(this));
    this.registry.register("tools/list", this.handleToolsList.bind(this));
    this.registry.register("tools/call", this.handleToolsCall.bind(this));
    this.registry.register("notifications/initialized", this.handleInitialized.bind(this));
    this.registry.register("notifications/cancelled", this.handleCancelled.bind(this));
  }

  registerMethod(method: string, handler: MethodHandler): void {
    this.registry.register(method, handler);
  }

  private async handleInitialize(_params: unknown): Promise<unknown> {
    return {
      protocolVersion: this.config.protocolVersion,
      capabilities: this.config.capabilities,
      serverInfo: this.config.serverInfo,
    };
  }

  private async handlePing(_params: unknown): Promise<Record<string, never>> {
    return {};
  }

  private async handleToolsList(): Promise<{ tools: MCPToolDefinition[] }> {
    const tools = this.toolProvider ? await this.toolProvider() : [];
    return { tools };
  }

  private async handleToolsCall(params: unknown): Promise<unknown> {
    const callParams = params as CallToolParams;
    if (!callParams.name) {
      throw new JSONRPCError(ErrorCode.INVALID_PARAMS, "Tool name is required");
    }
    return { content: [{ type: "text" as const, text: `Tool ${callParams.name} executed` }] };
  }

  private async handleInitialized(): Promise<void> {
    this.initialized = true;
  }

  private async handleCancelled(params: unknown): Promise<void> {
    const cancelParams = params as { id?: string | number };
    if (cancelParams.id !== undefined) {
      const pending = this.pendingRequests.get(cancelParams.id);
      if (pending) {
        pending.abortController.abort();
        this.pendingRequests.delete(cancelParams.id);
      }
    }
  }

  private async handleRawMessage(raw: string): Promise<void> {
    if (this.closed) return;

    const { message, error } = parseJSONRPC(raw);

    if (error) {
      const response = formatErrorResponse(null, error);
      await this.transport.send(response);
      return;
    }

    if (Array.isArray(message)) {
      await this.handleBatch(message);
      return;
    }

    await this.handleSingle(message!);
  }

  private async handleBatch(messages: JSONRPCMessage[]): Promise<void> {
    const results: JSONRPCResponse[] = [];
    for (const msg of messages) {
      const result = await this.processMessage(msg);
      if (result) {
        results.push(result);
      }
    }
    if (results.length > 0) {
      await this.transport.send(JSON.stringify(results));
    }
  }

  private async handleSingle(message: JSONRPCMessage): Promise<void> {
    const result = await this.processMessage(message);
    if (result) {
      await this.transport.send(JSON.stringify(result));
    }
  }

  private async processMessage(
    message: JSONRPCMessage,
  ): Promise<JSONRPCResponse | null> {
    const isNotification = "method" in message && !("id" in message);
    const isResponse = "result" in message || "error" in message;

    if (isResponse) {
      this.logger.debug({ type: "response", id: message.id }, "Received response message");
      return null;
    }

    if (isNotification) {
      const notification = message;
      this.logger.debug({ type: "notification", method: notification.method, params: notification.params }, "Received notification");
      try {
        const handler = this.registry.find(notification.method);
        if (handler) {
          await handler(notification.params, {});
        }
      } catch (err) {
        this.logger.warn({ err, method: notification.method }, "Notification handler failed");
      }
      return null;
    }

    const request = message as JSONRPCRequest;
    this.logger.debug({ type: "request", method: request.method, id: request.id }, "Received request");

    if (request.method !== "initialize" && !this.initialized) {
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: formatError(ErrorCode.INVALID_REQUEST, "Server not initialized. Send initialize first"),
      };
    }

    const handler = this.registry.find(request.method);

    if (!handler) {
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: formatError(ErrorCode.METHOD_NOT_FOUND),
      };
    }

    const abortController = new AbortController();
    const pending: CancellableRequest = { id: request.id, abortController };
    this.pendingRequests.set(request.id, pending);

    try {
      const result = await handler(request.params ?? {}, { abortSignal: abortController.signal });
      return { jsonrpc: "2.0", id: request.id, result };
    } catch (err) {
      if (err instanceof JSONRPCError) {
        return {
          jsonrpc: "2.0",
          id: request.id,
          error: formatError(err.code, err.message, err.data),
        };
      }
      this.logger.error({ err, method: request.method, id: request.id }, "Request handler error");
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: formatInternalError(err),
      };
    } finally {
      this.pendingRequests.delete(request.id);
    }
  }

  async start(): Promise<void> {
    this.logger.info("Protocol handler started");
  }

  async close(): Promise<void> {
    this.closed = true;
    for (const [, pending] of this.pendingRequests) {
      pending.abortController.abort();
    }
    this.pendingRequests.clear();
    await this.transport.close();
    this.logger.info("Protocol handler closed");
  }
}
