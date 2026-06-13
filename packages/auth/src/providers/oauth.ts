import { createLogger } from "@repo/logger";

const logger = createLogger("@repo/auth:oauth");

export interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  enabled?: boolean;
}

export interface OAuthConfig {
  google?: OAuthProviderConfig;
  github?: OAuthProviderConfig;
}

export function createOAuthProviders(config?: OAuthConfig): Record<string, {
  clientId: string;
  clientSecret: string;
  enabled: boolean;
}> {
  const providers: Record<string, { clientId: string; clientSecret: string; enabled: boolean }> = {};

  const googleConfig = config?.google ?? {
    clientId: process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET ?? "",
  };

  if (googleConfig.clientId && googleConfig.clientSecret) {
    providers.google = {
      clientId: googleConfig.clientId,
      clientSecret: googleConfig.clientSecret,
      enabled: googleConfig.enabled ?? true,
    };
    logger.info("Google OAuth provider configured");
  } else {
    logger.warn("Google OAuth not configured — missing client ID or secret");
  }

  const githubConfig = config?.github ?? {
    clientId: process.env.AUTH_GITHUB_ID ?? process.env.GITHUB_CLIENT_ID ?? "",
    clientSecret: process.env.AUTH_GITHUB_SECRET ?? process.env.GITHUB_CLIENT_SECRET ?? "",
  };

  if (githubConfig.clientId && githubConfig.clientSecret) {
    providers.github = {
      clientId: githubConfig.clientId,
      clientSecret: githubConfig.clientSecret,
      enabled: githubConfig.enabled ?? true,
    };
    logger.info("GitHub OAuth provider configured");
  } else {
    logger.warn("GitHub OAuth not configured — missing client ID or secret");
  }

  return providers;
}

export type OAuthProviders = ReturnType<typeof createOAuthProviders>;
