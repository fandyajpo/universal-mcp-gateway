"use server";

import { cookies } from "next/headers";

export interface SetupMFAResult {
  success: boolean;
  secret?: string;
  qrCodeDataUrl?: string;
  error?: string;
}

export interface VerifyAndEnableMFAResult {
  success: boolean;
  recoveryCodes?: string[];
  error?: string;
  code?: string;
}

export interface VerifyMFAResult {
  success: boolean;
  error?: string;
  code?: string;
}

export interface DisableMFAResult {
  success: boolean;
  error?: string;
  code?: string;
}

export interface RegenerateRecoveryCodesResult {
  success: boolean;
  recoveryCodes?: string[];
  error?: string;
}

export async function setupMFAAction(): Promise<SetupMFAResult> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("umgw_session")?.value;
    if (!sessionToken) {
      return { success: false, error: "Not authenticated" };
    }

    const [{ connect }, { createAuthServer, createMFAService }] = await Promise.all([
      import("@repo/database"),
      import("@repo/auth"),
    ]);

    await connect();
    const server = createAuthServer();
    const session = await server.api.getSession({ headers: { Authorization: `Bearer ${sessionToken}` } });

    if (!session) {
      return { success: false, error: "Not authenticated" };
    }

    const userId = session.user.id;
    const email = session.user.email;

    const mfa = createMFAService();
    const result = await mfa.setupMFA(userId, email);

    return { success: true, secret: result.secret, qrCodeDataUrl: result.qrCodeDataUrl };
  } catch (error) {
    return { success: false, error: "Failed to set up MFA" };
  }
}

export async function verifyAndEnableMFAAction(
  _prevState: VerifyAndEnableMFAResult,
  formData: FormData,
): Promise<VerifyAndEnableMFAResult> {
  const codeRaw = formData.get("code");

  if (typeof codeRaw !== "string" || codeRaw.length !== 6 || !/^\d{6}$/.test(codeRaw)) {
    return { success: false, error: "Invalid verification code", code: "validation_error" };
  }

  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("umgw_session")?.value;
    if (!sessionToken) {
      return { success: false, error: "Not authenticated", code: "not_authenticated" };
    }

    const [{ connect }, { createAuthServer, createMFAService }] = await Promise.all([
      import("@repo/database"),
      import("@repo/auth"),
    ]);

    await connect();
    const server = createAuthServer();
    const session = await server.api.getSession({ headers: { Authorization: `Bearer ${sessionToken}` } });

    if (!session) {
      return { success: false, error: "Not authenticated", code: "not_authenticated" };
    }

    const userId = session.user.id;
    const mfa = createMFAService();
    const verified = await mfa.verifyAndEnableMFA(userId, codeRaw);

    if (!verified) {
      return { success: false, error: "Invalid verification code. Please try again.", code: "invalid_code" };
    }

    const recoveryCodes = await mfa.generateNewRecoveryCodes(userId);

    return { success: true, recoveryCodes };
  } catch (error) {
    return { success: false, error: "Verification failed. Please try again.", code: "unknown" };
  }
}

export async function verifyMFAAction(
  _prevState: VerifyMFAResult,
  formData: FormData,
): Promise<VerifyMFAResult> {
  const codeRaw = formData.get("code");
  const challengeId = formData.get("challengeId") as string;
  const trustDevice = formData.get("trustDevice") === "on";

  if (typeof codeRaw !== "string" || codeRaw.length !== 6 || !/^\d{6}$/.test(codeRaw)) {
    return { success: false, error: "Invalid verification code", code: "validation_error" };
  }

  if (!challengeId) {
    return { success: false, error: "Invalid session. Please sign in again.", code: "invalid_challenge" };
  }

  try {
    const [{ connect }, { createMFAService }] = await Promise.all([
      import("@repo/database"),
      import("@repo/auth"),
    ]);

    await connect();
    const mfa = createMFAService();

    const challenge = await mfa.getChallenge(challengeId);
    if (!challenge) {
      return { success: false, error: "Session expired. Please sign in again.", code: "challenge_expired" };
    }

    const verified = await mfa.verifyMFACode(challenge.userId, codeRaw);
    if (!verified) {
      return { success: false, error: "Invalid verification code", code: "invalid_code" };
    }

    const cookieStore = await cookies();
    cookieStore.set("umgw_session", challenge.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    if (trustDevice) {
      const trustToken = mfa.createTrustToken(challenge.userId);
      cookieStore.set("umgw_mfa_trust", trustToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    await mfa.deleteChallenge(challengeId);

    return { success: true };
  } catch (error) {
    return { success: false, error: "Verification failed. Please try again.", code: "unknown" };
  }
}

export async function skipMFAWithRecoveryAction(
  _prevState: VerifyMFAResult,
  formData: FormData,
): Promise<VerifyMFAResult> {
  const code = formData.get("code") as string;
  const challengeId = formData.get("challengeId") as string;

  if (!code || code.length < 8) {
    return { success: false, error: "Invalid recovery code", code: "validation_error" };
  }

  if (!challengeId) {
    return { success: false, error: "Invalid session. Please sign in again.", code: "invalid_challenge" };
  }

  try {
    const [{ connect }, { createMFAService }] = await Promise.all([
      import("@repo/database"),
      import("@repo/auth"),
    ]);

    await connect();
    const mfa = createMFAService();

    const challenge = await mfa.getChallenge(challengeId);
    if (!challenge) {
      return { success: false, error: "Session expired. Please sign in again.", code: "challenge_expired" };
    }

    const valid = await mfa.verifyAndConsumeRecoveryCode(challenge.userId, code);
    if (!valid) {
      return { success: false, error: "Invalid or already used recovery code", code: "invalid_recovery" };
    }

    const cookieStore = await cookies();
    cookieStore.set("umgw_session", challenge.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    await mfa.deleteChallenge(challengeId);

    return { success: true };
  } catch (error) {
    return { success: false, error: "Verification failed. Please try again.", code: "unknown" };
  }
}

export async function disableMFAAction(
  _prevState: DisableMFAResult,
  formData: FormData,
): Promise<DisableMFAResult> {
  const code = formData.get("code") as string;

  if (!code) {
    return { success: false, error: "Verification code is required", code: "validation_error" };
  }

  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("umgw_session")?.value;
    if (!sessionToken) {
      return { success: false, error: "Not authenticated", code: "not_authenticated" };
    }

    const [{ connect }, { createAuthServer, createMFAService }] = await Promise.all([
      import("@repo/database"),
      import("@repo/auth"),
    ]);

    await connect();
    const server = createAuthServer();
    const session = await server.api.getSession({ headers: { Authorization: `Bearer ${sessionToken}` } });

    if (!session) {
      return { success: false, error: "Not authenticated", code: "not_authenticated" };
    }

    const userId = session.user.id;
    const mfa = createMFAService();
    const disabled = await mfa.disableMFA(userId, code);

    if (!disabled) {
      return { success: false, error: "Invalid verification or recovery code", code: "invalid_code" };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to disable MFA. Please try again.", code: "unknown" };
  }
}

export async function regenerateRecoveryCodesAction(): Promise<RegenerateRecoveryCodesResult> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("umgw_session")?.value;
    if (!sessionToken) {
      return { success: false, error: "Not authenticated" };
    }

    const [{ connect }, { createAuthServer, createMFAService }] = await Promise.all([
      import("@repo/database"),
      import("@repo/auth"),
    ]);

    await connect();
    const server = createAuthServer();
    const session = await server.api.getSession({ headers: { Authorization: `Bearer ${sessionToken}` } });

    if (!session) {
      return { success: false, error: "Not authenticated" };
    }

    const userId = session.user.id;
    const mfa = createMFAService();
    const codes = await mfa.generateNewRecoveryCodes(userId);

    return { success: true, recoveryCodes: codes };
  } catch (error) {
    return { success: false, error: "Failed to generate recovery codes" };
  }
}
