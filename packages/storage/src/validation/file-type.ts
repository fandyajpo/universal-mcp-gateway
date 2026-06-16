import { SIGNATURES } from "./magic-bytes";

export interface FileTypeResult {
  valid: boolean;
  detectedType: string;
}

const DEFAULT_ALLOWED_TYPES = [
  "pdf",
  "png",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "csv",
  "json",
  "markdown",
  "plain",
  "zip",
];

const ENTITY_TYPE_MAP: Record<string, string[]> = {
  documents: DEFAULT_ALLOWED_TYPES,
  images: ["png", "jpeg", "gif", "webp", "svg"],
  avatars: ["png", "jpeg", "gif", "webp"],
  connectors: ["json", "zip"],
  temp: DEFAULT_ALLOWED_TYPES,
};

function readAllowedTypesFromEnv(): string[] | null {
  const envValue = typeof process !== "undefined" ? process.env.ALLOWED_FILE_TYPES : undefined;
  if (!envValue) return null;
  return envValue.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
}

export function validateFileType(buffer: Uint8Array, allowedTypes?: string[]): FileTypeResult {
  if (buffer.length === 0) {
    return { valid: false, detectedType: "unknown" };
  }

  const typesToCheck = allowedTypes ?? readAllowedTypesFromEnv() ?? DEFAULT_ALLOWED_TYPES;

  for (const signature of SIGNATURES) {
    if (typesToCheck.includes(signature.name) && signature.check(buffer)) {
      return { valid: true, detectedType: signature.name };
    }
  }

  const detectedType = detectTypeUnrestricted(buffer);
  return { valid: false, detectedType };
}

export function getAllowedTypesForEntity(entity: string): string[] {
  return ENTITY_TYPE_MAP[entity] ?? DEFAULT_ALLOWED_TYPES;
}

function detectTypeUnrestricted(buffer: Uint8Array): string {
  for (const signature of SIGNATURES) {
    if (signature.check(buffer)) {
      return signature.name;
    }
  }
  return "unknown";
}
