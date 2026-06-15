import { randomBytes, createHash, timingSafeEqual } from "node:crypto";

import { createLogger } from "@repo/logger";

const logger = createLogger("@repo/auth:recovery-codes");

const CODE_LENGTH = 10;
const CODE_COUNT = 8;

function generateSingleCode(): string {
  const buffer = randomBytes(CODE_LENGTH);
  return buffer.toString("base64url").slice(0, CODE_LENGTH);
}

export function generateRecoveryCodes(count: number = CODE_COUNT): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(generateSingleCode());
  }
  return codes;
}

function hashWithSHA256(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

function constantTimeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export function hashRecoveryCode(code: string): string {
  return hashWithSHA256(code);
}

export function verifyRecoveryCode(
  code: string,
  hashedCodes: string[],
): { valid: boolean; index: number } {
  const hashed = hashWithSHA256(code);
  for (let i = 0; i < hashedCodes.length; i++) {
    const hashedCode = hashedCodes[i];
    if (!hashedCode) continue;
    if (constantTimeEqual(hashed, hashedCode)) {
      logger.info("recovery code verified");
      return { valid: true, index: i };
    }
  }
  return { valid: false, index: -1 };
}

export function hashRecoveryCodes(codes: string[]): string[] {
  return codes.map(hashRecoveryCode);
}
