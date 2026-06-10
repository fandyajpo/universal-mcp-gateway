import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export function hashString(input: string, algorithm: "sha256" | "sha512" = "sha256"): string {
  return createHash(algorithm).update(input, "utf8").digest("hex");
}

export function hashEquals(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);

  if (aBuf.length !== bBuf.length) {
    const hashedA = createHash("sha256").update(aBuf).digest();
    const hashedB = createHash("sha256").update(bBuf).digest();
    return timingSafeEqual(hashedA, hashedB);
  }

  return timingSafeEqual(aBuf, bBuf);
}

export function hmac(input: string, key: string | Buffer): string {
  const keyBytes = typeof key === "string" ? Buffer.from(key, "utf8") : key;
  return createHmac("sha256", keyBytes).update(input, "utf8").digest("hex");
}
