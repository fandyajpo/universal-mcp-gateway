import { createLogger } from "@repo/logger";

const logger = createLogger("@repo/auth:emails");

export interface PasswordResetEmailParams {
  to: string;
  name: string;
  url: string;
}

export function sendPasswordResetEmail(params: PasswordResetEmailParams): void {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
</head>
<body style="font-family: sans-serif; padding: 24px;">
  <h1>Reset Your Password</h1>
  <p>Hi ${params.name},</p>
  <p>We received a request to reset your password. Click the button below to set a new password:</p>
  <p><a href="${params.url}" style="display: inline-block; padding: 12px 24px; background: #0052cc; color: #fff; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
  <p>Or copy and paste this URL into your browser:</p>
  <p><code>${params.url}</code></p>
  <p>This link will expire in 1 hour.</p>
  <hr />
  <p style="color: #666; font-size: 12px;">If you did not request a password reset, you can safely ignore this email.</p>
</body>
</html>`;

  logger.info({ to: params.to, subject: "Reset Your Password" }, "sending password reset email (dev mode)");
  logger.info({ to: params.to, subject: "Reset Your Password", body: html }, "password reset email content");
}

export function buildPasswordResetUrl(token: string): string {
  const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  return `${baseUrl}/reset-password?token=${token}`;
}

export function extractResetToken(url: string): string | null {
  try {
    return new URL(url).searchParams.get("token");
  } catch {
    return null;
  }
}
