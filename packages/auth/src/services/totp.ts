import QRCode from "qrcode";
import speakeasy from "speakeasy";

import { createLogger } from "@repo/logger";

const logger = createLogger("@repo/auth:totp");

export function generateTOTPSecret(): string {
  const secret = speakeasy.generateSecret({ length: 32 });
  return secret.base32;
}

export function generateTOTPUri(secret: string, email: string): string {
  return speakeasy.otpauthURL({
    secret,
    label: email,
    issuer: "Universal MCP Gateway",
    encoding: "base32",
  });
}

export async function generateQRCodeDataUrl(uri: string): Promise<string> {
  return QRCode.toDataURL(uri, {
    width: 256,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
}

export function verifyTOTPCode(secret: string, code: string): boolean {
  try {
    return speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token: code,
      window: 1,
    });
  } catch (error) {
    logger.error({ error }, "TOTP verification failed");
    return false;
  }
}
