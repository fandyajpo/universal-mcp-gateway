import { createLogger } from "@repo/logger";

const logger = createLogger("@repo/auth:password-reset");

export interface PasswordResetResult {
  success: boolean;
  error?: string;
}

export interface PasswordResetService {
  requestReset(email: string): Promise<PasswordResetResult>;
  resetPassword(token: string, newPassword: string): Promise<PasswordResetResult>;
}

export function createPasswordResetService(): PasswordResetService {
  async function requestReset(email: string): Promise<PasswordResetResult> {
    try {
      const [{ connect }, { createAuthServer }] = await Promise.all([
        import("@repo/database"),
        import("../auth-server"),
      ]);

      await connect();
      const server = createAuthServer();

      await server.api.requestPasswordReset({
        body: { email },
      });

      logger.info({ email }, "password reset email sent");
    } catch (error) {
      logger.error({ error, email }, "password reset request failed");
    }

    return { success: true };
  }

  async function resetPassword(token: string, newPassword: string): Promise<PasswordResetResult> {
    try {
      const [{ connect }, { createAuthServer }] = await Promise.all([
        import("@repo/database"),
        import("../auth-server"),
      ]);

      await connect();
      const server = createAuthServer();

      await server.api.resetPassword({
        body: { newPassword, token },
      });

      logger.info("password reset successful");
      return { success: true };
    } catch (error) {
      logger.error({ error }, "password reset failed");
      return { success: false, error: "Password reset failed. The link may be invalid or expired." };
    }
  }

  return { requestReset, resetPassword };
}
