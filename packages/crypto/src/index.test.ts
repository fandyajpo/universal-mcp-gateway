import { describe, it, expect } from "vitest";

import {
  encrypt,
  decrypt,
  generateEncryptionKey,
  encryptObject,
  decryptObject,
} from "./encryption";
import { hashString, hashEquals, hmac } from "./hash";
import { hashPassword, verifyPassword, needsRehash } from "./password";
import {
  generateApiKey,
  generateResetToken,
  generateVerificationCode,
  generateSecret,
} from "./token";

// ── Password Utilities ─────────────────────────────

describe("hashPassword / verifyPassword", () => {
  it("hashes and verifies password correctly", async () => {
    const password = "SecureP@ss1";
    const hash = await hashPassword(password);
    expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);
    await expect(verifyPassword(password, hash)).resolves.toBe(true);
  });

  it("rejects wrong password", async () => {
    const hash = await hashPassword("correct-password");
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });
});

describe("needsRehash", () => {
  it("returns true for cost less than 12", async () => {
    const lowCostHash = await hashPassword("test");
    const result = needsRehash(lowCostHash, 15);
    expect(result).toBe(true);
  });

  it("returns false for cost >= current", async () => {
    const hash = await hashPassword("test");
    const result = needsRehash(hash, 4);
    expect(result).toBe(false);
  });

  it("returns true for invalid hash", () => {
    expect(needsRehash("invalid")).toBe(true);
  });
});

// ── Encryption Utilities ───────────────────────────

describe("encrypt / decrypt", () => {
  const key = generateEncryptionKey();

  it("encrypts and decrypts a string", () => {
    const plaintext = "Hello, World!";
    const ciphertext = encrypt(plaintext, key);
    expect(ciphertext).not.toBe(plaintext);
    const decrypted = decrypt(ciphertext, key);
    expect(decrypted).toBe(plaintext);
  });

  it("decrypt with wrong key throws", () => {
    const ciphertext = encrypt("secret", key);
    const wrongKey = generateEncryptionKey();
    expect(() => decrypt(ciphertext, wrongKey)).toThrow();
  });

  it("decrypt with tampered ciphertext throws", () => {
    const ciphertext = encrypt("secret", key);
    const tampered = ciphertext.slice(0, -4) + "AAAA";
    expect(() => decrypt(tampered, key)).toThrow();
  });

  it("accepts key as Buffer", () => {
    const keyBuf = Buffer.from(key, "base64");
    const ciphertext = encrypt("test", keyBuf);
    expect(decrypt(ciphertext, keyBuf)).toBe("test");
  });

  it("produces different ciphertexts for same plaintext (random IV)", () => {
    const a = encrypt("same", key);
    const b = encrypt("same", key);
    expect(a).not.toBe(b);
  });
});

describe("generateEncryptionKey", () => {
  it("returns a valid base64-encoded 32-byte key", () => {
    const key = generateEncryptionKey();
    const decoded = Buffer.from(key, "base64");
    expect(decoded.length).toBe(32);
  });
});

describe("encryptObject / decryptObject", () => {
  const key = generateEncryptionKey();

  it("round-trips objects", () => {
    const obj = { userId: "usr-1", role: "admin", permissions: ["read", "write"] };
    const ciphertext = encryptObject(obj, key);
    const decrypted: typeof obj = decryptObject(ciphertext, key) as typeof obj;
    expect(decrypted).toEqual(obj);
  });
});

// ── Hash Utilities ─────────────────────────────────

describe("hashString", () => {
  it("returns SHA-256 hex hash by default", () => {
    const hash = hashString("hello");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });

  it("returns SHA-512 hex hash when specified", () => {
    const hash = hashString("hello", "sha512");
    expect(hash).toHaveLength(128);
  });

  it("is deterministic", () => {
    expect(hashString("hello")).toBe(hashString("hello"));
  });
});

describe("hashEquals", () => {
  it("returns true for equal strings", () => {
    expect(hashEquals("abc", "abc")).toBe(true);
  });

  it("returns false for different strings", () => {
    expect(hashEquals("abc", "xyz")).toBe(false);
  });

  it("handles different-length inputs without error", () => {
    expect(hashEquals("short", "a-much-longer-string")).toBe(false);
  });
});

describe("hmac", () => {
  it("creates an HMAC-SHA256 signature", () => {
    const sig = hmac("message", "secret-key");
    expect(sig).toHaveLength(64);
    expect(sig).toMatch(/^[a-f0-9]+$/);
  });

  it("is deterministic for same inputs", () => {
    expect(hmac("test", "key")).toBe(hmac("test", "key"));
  });

  it("produces different output for different keys", () => {
    expect(hmac("test", "key-a")).not.toBe(hmac("test", "key-b"));
  });
});

// ── Token Generation ───────────────────────────────

describe("generateApiKey", () => {
  it("returns key matching expected format", () => {
    const key = generateApiKey();
    expect(key).toMatch(/^umgw_[A-Za-z0-9_-]{48}$/);
  });

  it("uses custom prefix when provided", () => {
    const key = generateApiKey("sk_");
    expect(key).toMatch(/^sk_[A-Za-z0-9_-]{48}$/);
  });

  it("generates unique keys", () => {
    const keys = new Set(Array.from({ length: 100 }, () => generateApiKey()));
    expect(keys.size).toBe(100);
  });
});

describe("generateResetToken", () => {
  it("returns a 64-character hex string", () => {
    const token = generateResetToken();
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[a-f0-9]+$/);
  });
});

describe("generateVerificationCode", () => {
  it("returns a 6-digit code by default", () => {
    const code = generateVerificationCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it("returns a code of specified length", () => {
    const code = generateVerificationCode(8);
    expect(code).toMatch(/^\d{8}$/);
  });
});

describe("generateSecret", () => {
  it("returns a base64 string", () => {
    const secret = generateSecret();
    expect(() => Buffer.from(secret, "base64")).not.toThrow();
    expect(secret.length).toBeGreaterThan(0);
  });
});
