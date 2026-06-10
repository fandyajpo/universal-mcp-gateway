import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKeyBytes(key: string | Buffer): Buffer {
  if (typeof key === "string") {
    return Buffer.from(key, "base64");
  }
  return key;
}

export function encrypt(plaintext: string, key: string | Buffer): string {
  const keyBytes = getKeyBytes(key);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, keyBytes, iv, { authTagLength: AUTH_TAG_LENGTH });

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString("base64");
}

export function decrypt(ciphertext: string, key: string | Buffer): string {
  const keyBytes = getKeyBytes(key);
  const combined = Buffer.from(ciphertext, "base64");

  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, keyBytes, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  return decipher.update(encrypted, undefined, "utf8") + decipher.final("utf8");
}

export function generateEncryptionKey(): string {
  return randomBytes(32).toString("base64");
}

export function encryptObject(obj: unknown, key: string | Buffer): string {
  return encrypt(JSON.stringify(obj), key);
}

export function decryptObject(ciphertext: string, key: string | Buffer): unknown {
  const plaintext = decrypt(ciphertext, key);
  return JSON.parse(plaintext) as T;
}
