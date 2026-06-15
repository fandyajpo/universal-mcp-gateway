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
  logger.info({ to: params.to, workspaceName: params.workspaceName }, "sending invitation email (dev mode)");
}

export function buildInvitationAcceptUrl(token: string): string {
  const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  return `${baseUrl}/invitation/${token}?action=accept`;
}

export function buildInvitationDeclineUrl(token: string): string {
  const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  return `${baseUrl}/invitation/${token}?action=decline`;
}
