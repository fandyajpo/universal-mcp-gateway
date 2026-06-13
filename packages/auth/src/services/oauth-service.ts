import type { AuthServer } from "../auth-server";
import { createLogger } from "@repo/logger";

const logger = createLogger("@repo/auth:oauth-service");

export interface OAuthServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface LinkAccountResult {
  linked: boolean;
  provider: string;
}

export interface UnlinkAccountResult {
  unlinked: boolean;
  providerId: string;
}

export interface OAuthServiceMethods {
  linkAccount(provider: string, sessionToken: string, options?: { callbackURL?: string }): Promise<OAuthServiceResult<LinkAccountResult>>;
  unlinkAccount(providerId: string, accountId?: string): Promise<OAuthServiceResult<UnlinkAccountResult>>;
  listAccounts(): Promise<OAuthServiceResult<{ providerId: string; accountId: string; userId: string }[]>>;
}

export function createOAuthService(auth: AuthServer): OAuthServiceMethods {
  function authHeaders(sessionToken?: string): Headers {
    const headers = new Headers();
    if (sessionToken) {
      headers.set("Authorization", `Bearer ${sessionToken}`);
    }
    return headers;
  }

  async function linkAccount(
    provider: string,
    sessionToken: string,
    options?: { callbackURL?: string },
  ): Promise<OAuthServiceResult<LinkAccountResult>> {
    try {
      await auth.api.linkSocialAccount({
        headers: authHeaders(sessionToken),
        body: {
          provider,
          callbackURL: options?.callbackURL,
        },
      });

      logger.info({ provider }, "social account linked");
      return { success: true, data: { linked: true, provider } };
    } catch (error) {
      logger.error({ error, provider }, "failed to link social account");
      return { success: false, error: `Failed to link ${provider} account.`, code: "LINK_FAILED" };
    }
  }

  async function unlinkAccount(
    providerId: string,
    accountId?: string,
  ): Promise<OAuthServiceResult<UnlinkAccountResult>> {
    try {
      await auth.api.unlinkAccount({
        body: {
          providerId,
          accountId,
        },
      });

      logger.info({ providerId }, "social account unlinked");
      return { success: true, data: { unlinked: true, providerId } };
    } catch (error) {
      logger.error({ error, providerId }, "failed to unlink social account");
      return { success: false, error: `Failed to unlink ${providerId} account.`, code: "UNLINK_FAILED" };
    }
  }

  async function listAccounts(): Promise<OAuthServiceResult<{ providerId: string; accountId: string; userId: string }[]>> {
    try {
      const accounts: { providerId: string; accountId: string; userId: string }[] = await auth.api.listUserAccounts();

      return { success: true, data: accounts };
    } catch (error) {
      logger.error({ error }, "failed to list accounts");
      return { success: false, error: "Failed to list linked accounts.", code: "LIST_FAILED" };
    }
  }

  return {
    linkAccount,
    unlinkAccount,
    listAccounts,
  };
}

export type OAuthService = OAuthServiceMethods;
