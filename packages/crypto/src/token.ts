import { randomBytes, randomInt } from "node:crypto";

const API_KEY_PREFIX = "umgw_";
const API_KEY_BYTES = 36;

export function generateApiKey(prefix: string = API_KEY_PREFIX): string {
  const bytes = randomBytes(API_KEY_BYTES);
  const encoded = bytes.toString("base64url");
  return `${prefix}${encoded}`;
}

export function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

export function generateVerificationCode(length = 6): string {
  const max = Math.pow(10, length);
  const code = randomInt(0, max);
  return code.toString().padStart(length, "0");
}

export function generateSecret(): string {
  return randomBytes(32).toString("base64");
}
