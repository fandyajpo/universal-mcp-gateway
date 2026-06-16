"use server";

import { createHash, timingSafeEqual } from "node:crypto";

import { connect, UserModel } from "@repo/database";
import { createLogger } from "@repo/logger";

const logger = createLogger("actions/auth/re-authenticate");

const SESSION_AGE_THRESHOLD_MS = 15 * 60 * 1000;

export async function verifySessionAction(): Promise<{ valid: boolean; recent: boolean; ageMs?: number }> {
  try {
    const { headers } = await import("next/headers");
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    const sessionToken = headersList.get("x-session-token");

    if (!userId || !sessionToken) {
      return { valid: false, recent: false };
    }

    await connect();

    const user = await UserModel.findById(userId).select("createdAt").lean().exec();
    if (!user) {
      return { valid: false, recent: false };
    }

    const sessionCreatedAt = user.createdAt instanceof Date ? user.createdAt.getTime() : Date.now();
    const ageMs = Date.now() - sessionCreatedAt;

    return {
      valid: true,
      recent: ageMs < SESSION_AGE_THRESHOLD_MS,
      ageMs,
    };
  } catch (error) {
    logger.error({ error }, "Failed to verify session");
    return { valid: false, recent: false };
  }
}

export async function reauthenticateAction(
  password: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { headers } = await import("next/headers");
    const headersList = await headers();
    const userId = headersList.get("x-user-id");

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    await connect();

    const user = await UserModel.findById(userId).select("passwordHash").lean().exec();
    if (!user?.passwordHash) {
      return { success: false, error: "User not found" };
    }

    const hash = createHash("sha256").update(password).digest();
    const stored = Buffer.from(user.passwordHash, "base64");

    if (hash.length !== stored.length) {
      return { success: false, error: "Invalid password" };
    }

    const match = timingSafeEqual(hash, stored);
    if (!match) {
      return { success: false, error: "Invalid password" };
    }

    logger.info({ userId }, "Re-authentication successful");
    return { success: true };
  } catch (error) {
    logger.error({ error }, "Re-authentication failed");
    return { success: false, error: "Re-authentication failed" };
  }
}
