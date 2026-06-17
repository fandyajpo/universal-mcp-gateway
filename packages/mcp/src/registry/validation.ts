import type { ToolFilter } from "./types";

const TOOL_NAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,62}[a-zA-Z0-9]$/;
const MAX_NAME_LENGTH = 64;

export function validateToolName(name: unknown): string | undefined {
  if (typeof name !== "string") {
    return "Tool name must be a string";
  }
  if (name.length === 0) {
    return "Tool name must not be empty";
  }
  if (name.length > MAX_NAME_LENGTH) {
    return `Tool name must be at most ${MAX_NAME_LENGTH} characters`;
  }
  if (name.length === 1 && !/^[a-zA-Z0-9]$/.test(name)) {
    return "Tool name must be alphanumeric";
  }
  if (!TOOL_NAME_REGEX.test(name)) {
    return "Tool name must contain only alphanumeric characters and hyphens, and cannot start or end with a hyphen";
  }
  return undefined;
}

export function validateJSONSchema(schema: unknown): string | undefined {
  if (schema === null || schema === undefined) {
    return "Input schema is required";
  }
  if (typeof schema !== "object" || Array.isArray(schema)) {
    return "Input schema must be a JSON object";
  }
  const s = schema as Record<string, unknown>;
  if (typeof s.type !== "string") {
    return "Input schema must have a 'type' property";
  }
  if (s.type !== "object") {
    return "Input schema type must be 'object'";
  }
  if (s.properties !== undefined) {
    if (typeof s.properties !== "object" || Array.isArray(s.properties)) {
      return "Input schema 'properties' must be a JSON object";
    }
  }
  if (s.required !== undefined) {
    if (!Array.isArray(s.required)) {
      return "Input schema 'required' must be an array";
    }
    for (const r of s.required) {
      if (typeof r !== "string") {
        return "Each item in 'required' must be a string";
      }
    }
  }
  return undefined;
}

export function validateToolFilter(filter: ToolFilter): string | undefined {
  if (filter.category !== undefined && typeof filter.category !== "string") {
    return "Category filter must be a string";
  }
  if (filter.tag !== undefined && typeof filter.tag !== "string") {
    return "Tag filter must be a string";
  }
  return undefined;
}
