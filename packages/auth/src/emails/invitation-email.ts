import { createLogger } from "@repo/logger";

const logger = createLogger("@repo/auth:emails");

export interface InvitationEmailParams {
  to: string;
  inviterName: string;
  workspaceName: string;
  role: string;
  token: string;
  message?: string;
  url?: string;
}

export function sendInvitationEmail(params: InvitationEmailParams): void {
  const baseUrl = params.url ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  const acceptUrl = `${baseUrl}/invitation/${params.token}?action=accept`;
  const declineUrl = `${baseUrl}/invitation/${params.token}?action=decline`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
</head>
<body style="font-family: sans-serif; padding: 24px;">
  <h1>You've been invited to ${params.workspaceName}</h1>
  <p>${params.inviterName} has invited you to join the workspace <strong>${params.workspaceName}</strong> with the role of <strong>${params.role}</strong>.</p>
  ${params.message ? `<p>Personal message: <em>${params.message}</em></p>` : ""}
  <p>Click the button below to accept the invitation:</p>
  <p><a href="${acceptUrl}" style="display: inline-block; padding: 12px 24px; background: #0052cc; color: #fff; text-decoration: none; border-radius: 6px;">Accept Invitation</a></p>
  <p>If you don't want to join, you can decline:</p>
  <p><a href="${declineUrl}" style="display: inline-block; padding: 12px 24px; background: #e5484d; color: #fff; text-decoration: none; border-radius: 6px;">Decline</a></p>
  <p>Or copy and paste this URL into your browser to accept:</p>
  <p><code>${acceptUrl}</code></p>
  <hr />
  <p style="color: #666; font-size: 12px;">This invitation expires in 7 days. If you did not expect this invitation, you can safely ignore this email.</p>
</body>
</html>`;

  logger.info({ to: params.to, subject: `Invitation to join ${params.workspaceName}` }, "sending invitation email (dev mode)");
  logger.debug({ to: params.to, subject: `Invitation to join ${params.workspaceName}`, body: html }, "invitation email content");
}

export function buildInvitationAcceptUrl(token: string): string {
  const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  return `${baseUrl}/invitation/${token}?action=accept`;
}

export function buildInvitationDeclineUrl(token: string): string {
  const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  return `${baseUrl}/invitation/${token}?action=decline`;
}
