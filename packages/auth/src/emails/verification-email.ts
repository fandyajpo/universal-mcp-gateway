import { createLogger } from "@repo/logger";

const logger = createLogger("@repo/auth:emails");

export interface VerificationEmailParams {
  to: string;
  name: string;
  token: string;
  url?: string;
}

export function sendVerificationEmail(params: VerificationEmailParams): void {
  const verificationUrl =
    params.url ?? `${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/api/auth/verify-email?token=${params.token}`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
</head>
<body style="font-family: sans-serif; padding: 24px;">
  <h1>Verify your email</h1>
  <p>Hi ${params.name},</p>
  <p>Thanks for signing up! Please verify your email address by clicking the link below:</p>
  <p><a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background: #0052cc; color: #fff; text-decoration: none; border-radius: 6px;">Verify Email</a></p>
  <p>Or copy and paste this URL into your browser:</p>
  <p><code>${verificationUrl}</code></p>
  <p>This link will expire in 24 hours.</p>
  <hr />
  <p style="color: #666; font-size: 12px;">If you did not create an account, you can safely ignore this email.</p>
</body>
</html>`;

  logger.info({ to: params.to, subject: "Verify your email" }, "sending verification email (dev mode)");
  logger.info({ to: params.to, subject: "Verify your email", body: html }, "verification email content");
}

export function buildVerificationEmailUrl(token: string): string {
  const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  return `${baseUrl}/api/auth/verify-email?token=${token}`;
}
