import { randomBytes } from "node:crypto";

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

export async function hashRecoveryCode(code: string): Promise<string> {
  const { hashPassword } = await import("@repo/crypto");
  return hashPassword(code);
}

export async function verifyRecoveryCode(
  code: string,
  hashedCodes: string[],
): Promise<{ valid: boolean; index: number }> {
  for (let i = 0; i < hashedCodes.length; i++) {
    const { verifyPassword } = await import("@repo/crypto");
    const hashedCode = hashedCodes[i];
    if (!hashedCode) continue;
    const valid = await verifyPassword(code, hashedCode);
    if (valid) {
      logger.info("recovery code verified");
      return { valid: true, index: i };
    }
  }
  return { valid: false, index: -1 };
}

export async function hashRecoveryCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map(hashRecoveryCode));
}
