import { createLogger } from "@repo/logger";

const logger = createLogger("@repo/auth:emails");

export interface WelcomeEmailParams {
  to: string;
  name: string;
}

export function sendWelcomeEmail(params: WelcomeEmailParams): void {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
</head>
<body style="font-family: sans-serif; padding: 24px;">
  <h1>Welcome to Universal MCP Gateway!</h1>
  <p>Hi ${params.name},</p>
  <p>Your email has been verified and your account is now active.</p>
  <p>You can now log in and start using the platform.</p>
  <p><a href="${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/sign-in" style="display: inline-block; padding: 12px 24px; background: #0052cc; color: #fff; text-decoration: none; border-radius: 6px;">Sign In</a></p>
  <hr />
  <p style="color: #666; font-size: 12px;">If you did not create an account, please contact support.</p>
</body>
</html>`;

  logger.info({ to: params.to, subject: "Welcome to Universal MCP Gateway" }, "sending welcome email (dev mode)");
  logger.info({ to: params.to, subject: "Welcome to Universal MCP Gateway", body: html }, "welcome email content");
}
