import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { admin, bearer, multiSession } from "better-auth/plugins";

import { sendPasswordResetEmail, buildPasswordResetUrl, extractResetToken } from "./emails/password-reset-email";
import { sendVerificationEmail, buildVerificationEmailUrl } from "./emails/verification-email";
import { sendWelcomeEmail } from "./emails/welcome-email";
import { workspacePlugin } from "./plugins";
import { createEmailPasswordProvider } from "./providers/email-password";
import { createOAuthProviders } from "./providers/oauth";
import { getConfig } from "@repo/config";
import { getConnection } from "@repo/database";
import { createLogger } from "@repo/logger";

const logger = createLogger("@repo/auth");

function getDb(): import("mongodb").Db {
  const conn = getConnection();
  const db = conn.db;
  if (!db) {
    throw new Error("MongoDB not connected — call connect() first");
  }
  return db;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function createAuthServer() {
  const config = getConfig();
  const database = getDb();

  return betterAuth({
    appName: config.app.name,
    baseURL: config.auth.url,
    secret: config.auth.secret,

    database: mongodbAdapter(database, {
      usePlural: true,
    }),

    emailAndPassword: createEmailPasswordProvider({
      requireEmailVerification: true,
      sendResetPassword({ user, url }) {
        const token = extractResetToken(url);
        const resetUrl = token ? buildPasswordResetUrl(token) : url;
        sendPasswordResetEmail({ to: user.email, name: user.name, url: resetUrl });
        return Promise.resolve();
      },
    }),

    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail({ user, token }) {
        const url = buildVerificationEmailUrl(token);
        sendVerificationEmail({ to: user.email, name: user.name, token, url });
        return Promise.resolve();
      },
      autoSignInAfterVerification: true,
    },

    socialProviders: createOAuthProviders(),

    user: {
      additionalFields: {
        workspaceId: {
          type: "string",
          required: false,
        },
      },
    },

    session: {
      additionalFields: {
        workspaceId: {
          type: "string",
          required: false,
        },
      },
    },

    plugins: [
      multiSession({ maximumSessions: 5 }),
      admin({}),
      bearer({}),
      workspacePlugin(),
    ],

    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            try {
              const { WorkspaceRepository } = await import("@repo/database");
              const repo = new WorkspaceRepository(user.id);
              const emailPrefix = user.email.split("@")[0]?.toLowerCase() ?? "user";
              const slug = `${emailPrefix}-${user.id.slice(0, 8)}`;
              const workspace = await repo.create({
                tenantId: user.id,
                name: `${user.name}'s Workspace`,
                slug,
                ownerId: user.id,
                isActive: true,
              });
              const doc = workspace as unknown as { _id?: { toString: () => string }; id?: string };
              const workspaceId = doc._id ? doc._id.toString() : doc.id;
              logger.info({ workspaceId, userId: user.id }, "created default workspace for user");
              sendWelcomeEmail({ to: user.email, name: user.name });
            } catch (error) {
              logger.error({ error, userId: user.id }, "failed to create default workspace");
            }
          },
        },
      },
    },
  });
}

export type AuthServer = Awaited<ReturnType<typeof createAuthServer>>;
