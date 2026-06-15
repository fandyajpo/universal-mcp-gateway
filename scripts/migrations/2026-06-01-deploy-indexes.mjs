/**
 * Migration: Deploy MongoDB Indexes
 *
 * Creates all indexes defined in Mongoose schema files.
 * Safe to run multiple times — MongoDB skips existing indexes.
 *
 * ⚠ Run during low-traffic window. Index creation is background by default.
 */
const COLLECTIONS = [
  "users",
  "workspaces",
  "sessions",
  "api_keys",
  "audit_logs",
  "documents",
  "invitations",
];

export async function up(db) {
  for (const name of COLLECTIONS) {
    const indexes = await db.collection(name).indexes();
    const existing = new Set(indexes.map((i) => i.name));
    for (const idx of INDEX_MAP[name] || []) {
      if (!existing.has(idx.name)) {
        await db.collection(name).createIndex(idx.key, idx.options);
      }
    }
  }
}

export async function down(db) {
  for (const name of COLLECTIONS) {
    const indexes = await db.collection(name).indexes();
    for (const idx of INDEX_MAP[name] || []) {
      if (indexes.some((i) => i.name === idx.name)) {
        try {
          await db.collection(name).dropIndex(idx.name);
        } catch {
          // ignore
        }
      }
    }
  }
}

const INDEX_MAP = {
  users: [
    { name: "idx_users_email", key: { email: 1 }, options: { unique: true } },
    {
      name: "idx_users_emailVerified_isActive",
      key: { emailVerified: 1, isActive: 1 },
    },
  ],
  workspaces: [
    {
      name: "idx_workspaces_tenantId",
      key: { tenantId: 1 },
      options: { unique: true },
    },
    { name: "idx_workspaces_name_description_text", key: { name: "text", description: "text" } },
  ],
  sessions: [
    { name: "idx_sessions_token", key: { token: 1 }, options: { unique: true } },
    { name: "idx_sessions_userId", key: { userId: 1 } },
    {
      name: "idx_sessions_tenantId_lastActivityAt",
      key: { tenantId: 1, lastActivityAt: -1 },
    },
    { name: "idx_sessions_expiresAt", key: { expiresAt: 1 }, options: { expireAfterSeconds: 0 } },
  ],
  api_keys: [
    { name: "idx_api_keys_keyHash", key: { keyHash: 1 }, options: { unique: true } },
    { name: "idx_api_keys_tenantId", key: { tenantId: 1 } },
  ],
  audit_logs: [
    { name: "idx_audit_logs_tenantId", key: { tenantId: 1 } },
    { name: "idx_audit_logs_actorId", key: { actorId: 1 } },
    {
      name: "idx_audit_logs_entityType_entityId_createdAt",
      key: { entityType: 1, entityId: 1, createdAt: -1 },
    },
    {
      name: "idx_audit_logs_tenantId_createdAt",
      key: { tenantId: 1, createdAt: -1 },
    },
  ],
  documents: [
    { name: "idx_documents_tenantId", key: { tenantId: 1 } },
    {
      name: "idx_documents_tenantId_updatedAt",
      key: { tenantId: 1, updatedAt: -1 },
    },
  ],
  invitations: [
    { name: "idx_invitations_email", key: { email: 1 } },
    { name: "idx_invitations_token", key: { token: 1 }, options: { unique: true } },
    { name: "idx_invitations_workspaceId", key: { workspaceId: 1 } },
    {
      name: "idx_invitations_email_workspaceId_status",
      key: { email: 1, workspaceId: 1, status: 1 },
    },
  ],
};
