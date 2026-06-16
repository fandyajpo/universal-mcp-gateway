import { createLogger } from "@repo/logger";

const logger = createLogger("@repo/auth:resend");

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    logger.info({ to: params.to, subject: params.subject }, "RESEND_API_KEY not set — dev mode, email logged");
    return;
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM ?? "noreply@universalmcp.com",
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      logger.error({ error, to: params.to }, "Failed to send email via Resend");
    } else {
      logger.info({ to: params.to, subject: params.subject }, "Email sent via Resend");
    }
  } catch (err) {
    logger.error({ err, to: params.to }, "Failed to send email via Resend");
  }
}
