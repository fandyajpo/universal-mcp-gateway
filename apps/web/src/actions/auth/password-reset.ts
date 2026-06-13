"use server";

import { emailSchema, resetPasswordSchema } from "@repo/validation";

export interface RequestResetResult {
  success: boolean;
  message?: string;
}

export interface ResetPasswordActionResult {
  success: boolean;
  error?: string;
  code?: string;
}

export async function requestResetAction(
  _prevState: RequestResetResult,
  formData: FormData,
): Promise<RequestResetResult> {
  const raw = formData.get("email") as string;

  const parsed = emailSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: true,
      message: "If an account exists, a reset link has been sent.",
    };
  }

  try {
    const [{ connect }, { createPasswordResetService }] = await Promise.all([
      import("@repo/database"),
      import("@repo/auth"),
    ]);

    await connect();
    const service = createPasswordResetService();
    await service.requestReset(parsed.data);
  } catch {
    // Silently ignore errors to prevent user enumeration
  }

  return {
    success: true,
    message: "If an account exists, a reset link has been sent.",
  };
}

export async function resetPasswordAction(
  _prevState: ResetPasswordActionResult,
  formData: FormData,
): Promise<ResetPasswordActionResult> {
  const raw = {
    token: formData.get("token") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return {
      success: false,
      error: firstError?.message ?? "Invalid input",
      code: "validation_error",
    };
  }

  try {
    const [{ connect }, { createPasswordResetService }] = await Promise.all([
      import("@repo/database"),
      import("@repo/auth"),
    ]);

    await connect();
    const service = createPasswordResetService();
    const result = await service.resetPassword(parsed.data.token, parsed.data.password);

    if (!result.success) {
      return {
        success: false,
        error: result.error ?? "Password reset failed. The link may be invalid or expired.",
        code: "reset_failed",
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.toLowerCase().includes("invalid") || message.toLowerCase().includes("expired")) {
      return {
        success: false,
        error: "Password reset failed. The link may be invalid or expired.",
        code: "invalid_token",
      };
    }

    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
      code: "unknown",
    };
  }

  return { success: true };
}
