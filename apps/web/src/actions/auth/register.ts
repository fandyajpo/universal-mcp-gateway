"use server";

import { redirect } from "next/navigation";

import { createAuthServer } from "@repo/auth";
import { connect } from "@repo/database";
import { registerSchema } from "@repo/validation";

export interface RegisterActionResult {
  success: boolean;
  error?: string;
  code?: string;
}

export async function registerAction(
  _prevState: RegisterActionResult,
  formData: FormData,
): Promise<RegisterActionResult> {
  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return {
      success: false,
      error: firstError?.message ?? "Invalid input",
      code: "validation_error",
    };
  }

  try {
    await connect();
    const server = createAuthServer();

    await server.api.signUpEmail({
      body: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.toLowerCase().includes("already exists") || message.toLowerCase().includes("duplicate")) {
      return { success: false, error: "An account with this email already exists.", code: "email_exists" };
    }
    if (message.toLowerCase().includes("rate") || message.toLowerCase().includes("too many")) {
      return { success: false, error: "Too many registration attempts. Please try again later.", code: "rate_limited" };
    }

    return { success: false, error: "Registration failed. Please try again.", code: "registration_failed" };
  }

  redirect("/verify-email");
}
