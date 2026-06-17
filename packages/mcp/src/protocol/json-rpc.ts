import { ErrorCode } from "../types";
import type { JSONRPCRequest, JSONRPCNotification, JSONRPCResponse, JSONRPCErrorObject, JSONRPCMessage } from "../types";
import { formatError } from "./errors";

export interface ParseResult {
  message?: JSONRPCMessage | JSONRPCMessage[];
  error?: JSONRPCErrorObject;
}

const MAX_FIELD_SIZE = 100_000;

function exceedsMaxSize(value: unknown): boolean {
  if (typeof value === "string" && value.length > MAX_FIELD_SIZE) {
    return true;
  }
  return false;
}

function checkFieldSizes(obj: Record<string, unknown>): boolean {
  for (const key of Object.keys(obj)) {
    if (exceedsMaxSize(key)) return true;
    const val = obj[key];
    if (exceedsMaxSize(val)) return true;
    if (val !== null && typeof val === "object" && !Array.isArray(val)) {
      if (checkFieldSizes(val as Record<string, unknown>)) return true;
    }
    if (Array.isArray(val)) {
      for (const item of val) {
        if (item !== null && typeof item === "object" && !Array.isArray(item)) {
          if (checkFieldSizes(item as Record<string, unknown>)) return true;
        }
      }
    }
  }
  return false;
}

function isValidId(id: unknown): id is string | number | null {
  if (id === null) return true;
  if (typeof id === "string") return id.length > 0;
  if (typeof id === "number") return Number.isFinite(id) && !Number.isNaN(id);
  return false;
}

function parseSingleMessage(obj: unknown): JSONRPCRequest | JSONRPCNotification | JSONRPCResponse | JSONRPCErrorObject {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return formatError(ErrorCode.INVALID_REQUEST, undefined, "Expected a JSON object");
  }

  const msg = obj as Record<string, unknown>;

  if (msg.jsonrpc !== "2.0") {
    return formatError(ErrorCode.INVALID_REQUEST, undefined, 'jsonrpc must be "2.0"');
  }

  if (checkFieldSizes(msg)) {
    return formatError(ErrorCode.INVALID_REQUEST, undefined, "Field exceeds maximum size");
  }

  const hasMethod = typeof msg.method === "string" && msg.method.length > 0;
  const hasId = "id" in msg;
  const hasResult = "result" in msg;
  const hasError = "error" in msg;

  if (hasResult || hasError) {
    const response: JSONRPCResponse = {
      jsonrpc: "2.0",
      id: isValidId(msg.id) ? msg.id : null,
      ...(hasResult ? { result: msg.result } : {}),
      ...(hasError ? { error: msg.error as JSONRPCErrorObject } : {}),
    };
    return response;
  }

  if (!hasMethod) {
    return formatError(ErrorCode.INVALID_REQUEST, undefined, "Method is required and must be a non-empty string");
  }

  if (hasId) {
    if (!isValidId(msg.id)) {
      return formatError(ErrorCode.INVALID_REQUEST, undefined, "Invalid request id");
    }
    const request: JSONRPCRequest = {
      jsonrpc: "2.0",
      method: msg.method as string,
      id: msg.id!,
    };
    if ("params" in msg) {
      request.params = msg.params;
    }
    return request;
  }

  const notification: JSONRPCNotification = {
    jsonrpc: "2.0",
    method: msg.method as string,
  };
  if ("params" in msg) {
    notification.params = msg.params;
  }
  return notification;
}

export function parseJSONRPC(raw: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: formatError(ErrorCode.PARSE_ERROR, "Parse error") };
  }

  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      return { error: formatError(ErrorCode.INVALID_REQUEST, undefined, "Batch array must not be empty") };
    }
    const messages: JSONRPCMessage[] = [];
    for (const item of parsed) {
      const result = parseSingleMessage(item);
      if ("code" in result && "message" in result && !("jsonrpc" in result)) {
        return { error: result };
      }
      messages.push(result as JSONRPCMessage);
    }
    return { message: messages };
  }

  const result = parseSingleMessage(parsed);
  if ("code" in result && "message" in result && !("jsonrpc" in result)) {
    return { error: result };
  }
  return { message: result as JSONRPCMessage };
}

export function formatResponse(id: string | number | null, result: unknown): string {
  return JSON.stringify({ jsonrpc: "2.0", id, result });
}

export function formatErrorResponse(id: string | number | null, error: JSONRPCErrorObject): string {
  return JSON.stringify({ jsonrpc: "2.0", id, error });
}
