import { createLogger } from "@repo/logger";

const logger = createLogger("@repo/auth:email-password");

export interface EmailPasswordConfig {
  sendVerificationEmail?: (data: {
    user: { email: string; name: string };
    token: string;
    url: string;
  }) => Promise<void>;
  sendResetPassword?: (data: {
    user: { email: string; name: string };
    url: string;
  }) => Promise<void>;
  requireEmailVerification?: boolean;
}

export function createEmailPasswordProvider(
  config?: EmailPasswordConfig,
): {
  enabled: true;
  password: {
    hash: (password: string) => Promise<string>;
    verify: (data: { hash: string; password: string }) => Promise<boolean>;
  };
  requireEmailVerification: boolean;
  sendResetPassword?: (data: {
    user: { email: string; name: string };
    url: string;
  }) => Promise<void>;
} {
  return {
    enabled: true,
    password: {
      async hash(password: string): Promise<string> {
        const { hashPassword } = await import("@repo/crypto");
        logger.debug("hashing password with bcrypt cost 12");
        return hashPassword(password);
      },
      async verify(data: { hash: string; password: string }): Promise<boolean> {
        const { verifyPassword } = await import("@repo/crypto");
        logger.debug("verifying password");
        return verifyPassword(data.password, data.hash);
      },
    },
    requireEmailVerification: config?.requireEmailVerification ?? true,
    sendResetPassword: config?.sendResetPassword,
  };
}

export type EmailPasswordProvider = ReturnType<typeof createEmailPasswordProvider>;
