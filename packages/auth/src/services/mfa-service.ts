import { createHash } from "node:crypto";
import { generateRecoveryCodes, hashRecoveryCodes } from "./recovery-codes";
import { generateTOTPSecret, generateTOTPUri, generateQRCodeDataUrl, verifyTOTPCode } from "./totp";
import { createCacheClient } from "@repo/cache";
import { encrypt, decrypt, hmac } from "@repo/crypto";
import { UserModel } from "@repo/database";
import { createLogger } from "@repo/logger";

const logger = createLogger("@repo/auth:mfa");

const MFA_CHALLENGE_TTL = 300;
const MFA_TRUST_TTL = 30 * 24 * 60 * 60;
const MFA_CACHE_PREFIX = "mfa_challenge";

function getMFATrustSecret(): string {
  const secret = process.env.MFA_TRUST_SECRET ?? process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("MFA_TRUST_SECRET or AUTH_SECRET environment variable is required");
  }
  return secret;
}

function deriveEncryptionKey(): string {
  const raw = process.env.MFA_ENCRYPTION_KEY ?? process.env.AUTH_SECRET;
  if (!raw) {
    throw new Error("MFA_ENCRYPTION_KEY or AUTH_SECRET environment variable is required");
  }
  const keyBytes = createHash("sha256").update(raw, "utf8").digest();
  return keyBytes.toString("base64");
}

export interface MFASetupResult {
  secret: string;
  uri: string;
  qrCodeDataUrl: string;
}

export interface MFAChallenge {
  sessionToken: string;
  userId: string;
  email: string;
}

export function createMFAService(): MFAService {
  const mfaTrustSecret = getMFATrustSecret();
  const cache = createCacheClient();

  async function setupMFA(userId: string, email: string): Promise<MFASetupResult> {
    const secret = generateTOTPSecret();
    const uri = generateTOTPUri(secret, email);
    const qrCodeDataUrl = await generateQRCodeDataUrl(uri);

    const encryptionKey = deriveEncryptionKey();
    const encryptedSecret = encrypt(secret, encryptionKey);

    await UserModel.findByIdAndUpdate(userId, { mfaSecret: encryptedSecret });

    logger.info({ userId }, "MFA setup initiated");
    return { secret, uri, qrCodeDataUrl };
  }

  async function verifyAndEnableMFA(userId: string, code: string): Promise<boolean> {
    const user = await UserModel.findById(userId).select("mfaSecret").lean();
    if (!user?.mfaSecret) {
      logger.warn({ userId }, "MFA setup not initiated — no secret found");
      return false;
    }

    const encryptionKey = deriveEncryptionKey();
    const decryptedSecret = decrypt(user.mfaSecret, encryptionKey);

    const valid = verifyTOTPCode(decryptedSecret, code);
    if (!valid) {
      logger.warn({ userId }, "MFA verification code invalid");
      return false;
    }

    await UserModel.findByIdAndUpdate(userId, { mfaEnabled: true });
    logger.info({ userId }, "MFA enabled");
    return true;
  }

  async function verifyMFACode(userId: string, code: string): Promise<boolean> {
    const user = await UserModel.findById(userId).select("mfaSecret mfaEnabled").lean();
    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      return false;
    }

    const encryptionKey = deriveEncryptionKey();
    const decryptedSecret = decrypt(user.mfaSecret, encryptionKey);

    return verifyTOTPCode(decryptedSecret, code);
  }

  async function verifyAndConsumeRecoveryCode(userId: string, code: string): Promise<boolean> {
    const hashed = createHash("sha256").update(code).digest("hex");
    const result = await UserModel.updateOne(
      { _id: userId, recoveryCodes: hashed },
      { $pull: { recoveryCodes: hashed } },
    );
    if (result.modifiedCount === 0) {
      return false;
    }
    logger.info({ userId }, "recovery code consumed");
    return true;
  }

  async function disableMFA(userId: string, code: string): Promise<boolean> {
    const verified = await verifyMFACode(userId, code) || await verifyAndConsumeRecoveryCode(userId, code);
    if (!verified) {
      return false;
    }

    await UserModel.findByIdAndUpdate(userId, {
      mfaEnabled: false,
      mfaSecret: null,
      recoveryCodes: [],
    });
    logger.info({ userId }, "MFA disabled");
    return true;
  }

  async function generateNewRecoveryCodes(userId: string): Promise<string[]> {
    const codes = generateRecoveryCodes();
    const hashed = hashRecoveryCodes(codes);

    await UserModel.findByIdAndUpdate(userId, { recoveryCodes: hashed });
    logger.info({ userId }, "new recovery codes generated");
    return codes;
  }

  async function getMFAStatus(userId: string): Promise<{ enabled: boolean }> {
    const user = await UserModel.findById(userId).select("mfaEnabled").lean();
    return { enabled: user?.mfaEnabled ?? false };
  }

  async function createChallenge(sessionToken: string, userId: string, email: string): Promise<string> {
    const challengeId = crypto.randomUUID();
    const challenge: MFAChallenge = { sessionToken, userId, email };
    await cache.set(`${MFA_CACHE_PREFIX}:${challengeId}`, challenge, { ex: MFA_CHALLENGE_TTL });
    return challengeId;
  }

  async function getChallenge(challengeId: string): Promise<MFAChallenge | null> {
    return cache.get<MFAChallenge>(`${MFA_CACHE_PREFIX}:${challengeId}`);
  }

  async function deleteChallenge(challengeId: string): Promise<void> {
    await cache.del(`${MFA_CACHE_PREFIX}:${challengeId}`);
  }

  function createTrustToken(userId: string): string {
    const expiry = Math.floor(Date.now() / 1000) + MFA_TRUST_TTL;
    const payload = `${userId}:${expiry}`;
    const signature = hmac(payload, mfaTrustSecret);
    return `${payload}.${signature}`;
  }

  function verifyTrustToken(token: string, userId: string): boolean {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return false;

      const payload = `${parts[0]}:${parts[1]}`;
      const expectedSignature = hmac(payload, mfaTrustSecret);
      if (parts[2] !== expectedSignature) return false;

      const expiryStr = parts[1];
      if (!expiryStr) return false;
      const expiry = parseInt(expiryStr, 10);
      if (isNaN(expiry) || Math.floor(Date.now() / 1000) > expiry) return false;

      return parts[0] === userId;
    } catch {
      return false;
    }
  }

  return {
    setupMFA,
    verifyAndEnableMFA,
    verifyMFACode,
    verifyAndConsumeRecoveryCode,
    disableMFA,
    generateNewRecoveryCodes,
    getMFAStatus,
    createChallenge,
    getChallenge,
    deleteChallenge,
    createTrustToken,
    verifyTrustToken,
  };
}

export interface MFAService {
  setupMFA(userId: string, email: string): Promise<MFASetupResult>;
  verifyAndEnableMFA(userId: string, code: string): Promise<boolean>;
  verifyMFACode(userId: string, code: string): Promise<boolean>;
  verifyAndConsumeRecoveryCode(userId: string, code: string): Promise<boolean>;
  disableMFA(userId: string, code: string): Promise<boolean>;
  generateNewRecoveryCodes(userId: string): Promise<string[]>;
  getMFAStatus(userId: string): Promise<{ enabled: boolean }>;
  createChallenge(sessionToken: string, userId: string, email: string): Promise<string>;
  getChallenge(challengeId: string): Promise<MFAChallenge | null>;
  deleteChallenge(challengeId: string): Promise<void>;
  createTrustToken(userId: string): string;
  verifyTrustToken(token: string, userId: string): boolean;
}
