"use server";

import { cookies } from "next/headers";

import { loginSchema } from "@repo/validation";

export interface LoginActionResult {
  success: boolean;
  error?: string;
  code?: string;
  mfaRequired?: boolean;
  challengeId?: string;
}

export async function loginAction(
  _prevState: LoginActionResult,
  formData: FormData,
): Promise<LoginActionResult> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    rememberMe: formData.get("rememberMe") === "on",
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return {
      success: false,
      error: firstError?.message ?? "Invalid input",
      code: "validation_error",
    };
  }

  try {
    const [{ connect, UserModel }, { createAuthServer, createMFAService }] = await Promise.all([
      import("@repo/database"),
      import("@repo/auth"),
    ]);

    await connect();
    const server = createAuthServer();

    const response = await server.api.signInEmail({
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
        rememberMe: parsed.data.rememberMe,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.token) {
      return { success: false, error: "Authentication failed", code: "unknown" };
    }

    const session = await server.api.getSession({
      headers: { Authorization: `Bearer ${response.token}` },
    });

    if (!session) {
      return { success: false, error: "Authentication failed", code: "unknown" };
    }

    const user = await UserModel.findById(session.user.id).select("mfaEnabled").lean();
    const mfaEnabled = user?.mfaEnabled === true;

    if (mfaEnabled) {
      const cookieStore = await cookies();
      const trustCookie = cookieStore.get("umgw_mfa_trust")?.value;

      const mfa = createMFAService();

      if (trustCookie) {
        const isTrusted = mfa.verifyTrustToken(trustCookie, session.user.id);
        if (isTrusted) {
          cookieStore.set("umgw_session", response.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: parsed.data.rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7,
          });
          return { success: true };
        }
      }

      const challengeId = await mfa.createChallenge(response.token, session.user.id, session.user.email);

      return {
        success: true,
        mfaRequired: true,
        challengeId,
      };
    }

    const cookieStore = await cookies();
    cookieStore.set("umgw_session", response.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: parsed.data.rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7,
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.toLowerCase().includes("email not verified")) {
      return { success: false, error: "Please verify your email before signing in", code: "email_not_verified" };
    }
    if (message.toLowerCase().includes("invalid email") || message.toLowerCase().includes("invalid password")) {
      return { success: false, error: "Invalid email or password", code: "invalid_credentials" };
    }
    if (message.toLowerCase().includes("locked") || message.toLowerCase().includes("suspended")) {
      return { success: false, error: "Account temporarily locked. Try again later.", code: "account_locked" };
    }
    if (message.toLowerCase().includes("rate") || message.toLowerCase().includes("too many")) {
      return { success: false, error: "Too many attempts. Please try again later.", code: "rate_limited" };
    }

    return { success: false, error: "An unexpected error occurred", code: "unknown" };
  }
}
