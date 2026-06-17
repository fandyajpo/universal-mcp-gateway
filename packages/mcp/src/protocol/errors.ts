import { ErrorCode, JSONRPCError } from "../types";
import type { JSONRPCErrorObject } from "../types";

const ERROR_MESSAGES: Record<number, string> = {
  [ErrorCode.PARSE_ERROR]: "Parse error",
  [ErrorCode.INVALID_REQUEST]: "Invalid Request",
  [ErrorCode.METHOD_NOT_FOUND]: "Method not found",
  [ErrorCode.INVALID_PARAMS]: "Invalid params",
  [ErrorCode.INTERNAL_ERROR]: "Internal error",
};

export function getErrorMessage(code: number): string {
  return ERROR_MESSAGES[code] ?? "Server error";
}

export function formatError(code: number, message?: string, data?: unknown): JSONRPCErrorObject {
  return {
    code,
    message: message ?? getErrorMessage(code),
    ...(data !== undefined ? { data } : {}),
  };
}

export function formatInternalError(error: unknown): JSONRPCErrorObject {
  if (error instanceof JSONRPCError) {
    return formatError(error.code, error.message, error.data);
  }
  return formatError(ErrorCode.INTERNAL_ERROR, "Internal error");
}
