import { createLogger } from "@repo/logger";

import { sendEmail } from "./resend";

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
  <p>Your account is ready. You can now log in and start using the platform.</p>
  <p><a href="${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/chat" style="display: inline-block; padding: 12px 24px; background: #0052cc; color: #fff; text-decoration: none; border-radius: 6px;">Go to Dashboard</a></p>
  <hr />
  <p style="color: #666; font-size: 12px;">If you did not create this account, please contact support.</p>
</body>
</html>`;

  logger.info({ to: params.to, subject: "Welcome to Universal MCP Gateway" }, "sending welcome email");

  void sendEmail({
    to: params.to,
    subject: "Welcome to Universal MCP Gateway",
    html,
  });
}
