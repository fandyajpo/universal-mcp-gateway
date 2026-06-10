import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose, { Schema, Model } from "mongoose";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

import {
  connect,
  disconnect,
  isConnected,
  healthCheck,
  getConnection,
} from "./connection";
import { ApiKeyModel } from "./models/api-key";
import { AuditLogModel } from "./models/audit-log";
import { DocumentModel } from "./models/document";
import { SessionModel } from "./models/session";
import { UserModel } from "./models/user";
import { WorkspaceModel } from "./models/workspace";
import { ApiKeyRepository } from "./repositories/api-key";
import { AuditLogRepository } from "./repositories/audit-log";
import { BaseRepository } from "./repositories/base";
import { DocumentRepository } from "./repositories/document";
import { SessionRepository } from "./repositories/session";
import { TenantAwareRepository } from "./repositories/tenant-aware";
import { UserRepository } from "./repositories/user";
import { WorkspaceRepository } from "./repositories/workspace";
import { baseSchemaFields, softDeletePlugin, toJSONTransform } from "./schema";

let mongoServer: MongoMemoryServer;

function getId(doc: Record<string, unknown>): string {
  return String(doc._id);
}

function getRaw(doc: unknown): Record<string, unknown> {
  return doc as Record<string, unknown>;
}

interface ITestEntity {
  [key: string]: unknown;
  name: string;
  value: number;
  tenantId: string;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const testSchema = new Schema<ITestEntity>({
  ...baseSchemaFields,
  name: { type: String, required: true },
  value: { type: Number, required: true },
});

softDeletePlugin(testSchema);
toJSONTransform(testSchema);

let TestModel: Model<ITestEntity>;
let repo: BaseRepository<ITestEntity>;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri: string = mongoServer.getUri();

  await connect(uri, {
    minPoolSize: 1,
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
  });

  TestModel = mongoose.model<ITestEntity>("TestEntity", testSchema);
  repo = new BaseRepository(TestModel);
});

afterAll(async () => {
  await disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await TestModel.deleteMany({});
});

// ── Connection Manager ─────────────────────────────

describe("connection manager", () => {
  it("connects and isConnected returns true", () => {
    expect(isConnected()).toBe(true);
  });

  it("healthCheck returns ok on connected state", async () => {
    const result = await healthCheck();
    expect(result.ok).toBe(true);
    expect(result.latency).toBeGreaterThanOrEqual(0);
  });

  it("getConnection returns the mongoose connection", () => {
    const conn = getConnection();
    expect(conn).toBe(mongoose.connection);
  });
});

// ── BaseRepository CRUD ────────────────────────────

describe("BaseRepository", () => {
  it("creates a document", async () => {
    const doc = await repo.create({ name: "test", value: 42, tenantId: "tenant-1" });
    expect(doc.name).toBe("test");
    expect(doc.value).toBe(42);
  });

  it("finds by id", async () => {
    const created = await repo.create({ name: "find-me", value: 1, tenantId: "t1" });
    const id = String(created._id);
    const found = await repo.findById(id);
    expect(found).not.toBeNull();
    expect(found?.name).toBe("find-me");
  });

  it("finds one with filter", async () => {
    await repo.create({ name: "a", value: 10, tenantId: "t1" });
    await repo.create({ name: "b", value: 20, tenantId: "t1" });
    const found = await repo.findOne({ name: "b" });
    if (found) {
      expect(found.value).toBe(20);
    } else {
      expect.fail("Expected document to be found");
    }
  });

  it("finds many with pagination", async () => {
    for (let i = 0; i < 10; i++) {
      await repo.create({ name: `item-${i}`, value: i, tenantId: "t1" });
    }
    const results = await repo.findMany(
      { tenantId: "t1" },
      { skip: 2, limit: 3, sort: { value: 1 } },
    );
    expect(results).toHaveLength(3);
    expect(results[0]?.value).toBe(2);
  });

  it("updates by id", async () => {
    const created = await repo.create({ name: "update-me", value: 1, tenantId: "t1" });
    const updated = await repo.updateById(String(created._id), { value: 999 });
    expect(updated).not.toBeNull();
    expect(updated?.value).toBe(999);
  });

  it("bulk creates documents", async () => {
    const docs = await repo.createMany([
      { name: "bulk-1", value: 1, tenantId: "t1" },
      { name: "bulk-2", value: 2, tenantId: "t1" },
    ]);
    expect(docs).toHaveLength(2);
  });

  it("counts documents", async () => {
    await repo.createMany([
      { name: "a", value: 1, tenantId: "t1" },
      { name: "b", value: 2, tenantId: "t1" },
    ]);
    const count = await repo.count({ tenantId: "t1" });
    expect(count).toBe(2);
  });

  it("checks existence", async () => {
    await repo.create({ name: "exists-test", value: 1, tenantId: "t1" });
    const exists = await repo.exists({ name: "exists-test" });
    expect(exists).toBe(true);
    const notExists = await repo.exists({ name: "nope" });
    expect(notExists).toBe(false);
  });

  it("soft deletes by id", async () => {
    const created = await repo.create({ name: "delete-me", value: 1, tenantId: "t1" });
    const deleted = await repo.deleteById(String(created._id));
    expect(deleted).not.toBeNull();
    expect(deleted?.deletedAt).not.toBeNull();

    const found = await repo.findById(String(created._id));
    expect(found).toBeNull();
  });

  it("hard deletes by id", async () => {
    const created = await repo.create({ name: "hard-delete", value: 1, tenantId: "t1" });
    await repo.hardDeleteById(String(created._id));
    const found = await repo.findById(String(created._id));
    expect(found).toBeNull();
  });

  it("updates many documents", async () => {
    await repo.createMany([
      { name: "a", value: 1, tenantId: "t1" },
      { name: "b", value: 2, tenantId: "t1" },
    ]);
    const modified = await repo.updateMany({ tenantId: "t1" }, { value: 0 });
    expect(modified).toBe(2);
  });
});

// ── TenantAwareRepository ──────────────────────────

describe("TenantAwareRepository", () => {
  let tenantRepo: TenantAwareRepository<ITestEntity>;
  let otherTenantRepo: TenantAwareRepository<ITestEntity>;

  beforeAll(() => {
    tenantRepo = new TenantAwareRepository(TestModel, "tenant-alpha");
    otherTenantRepo = new TenantAwareRepository(TestModel, "tenant-beta");
  });

  it("create automatically sets tenantId", async () => {
    const doc = await tenantRepo.create({ name: "scoped", value: 1 });
    expect(doc.tenantId).toBe("tenant-alpha");
  });

  it("findMany only returns scoped documents", async () => {
    await tenantRepo.create({ name: "alpha-1", value: 1 });
    await otherTenantRepo.create({ name: "beta-1", value: 2 });

    const alphaDocs = await tenantRepo.findMany();
    expect(alphaDocs).toHaveLength(1);
    expect(alphaDocs[0]?.name).toBe("alpha-1");
  });

  it("findById only finds scoped document", async () => {
    const created = await tenantRepo.create({ name: "scoped-find", value: 1 });
    const found = await tenantRepo.findById(String(created._id));
    expect(found).not.toBeNull();

    const notFound = await otherTenantRepo.findById(String(created._id));
    expect(notFound).toBeNull();
  });

  it("updateById only updates scoped document", async () => {
    const created = await tenantRepo.create({ name: "scoped-update", value: 1 });

    await otherTenantRepo.updateById(String(created._id), { value: 999 });
    const stillOld = await tenantRepo.findById(String(created._id));
    expect(stillOld?.value).toBe(1);

    await tenantRepo.updateById(String(created._id), { value: 888 });
    const updated = await tenantRepo.findById(String(created._id));
    expect(updated?.value).toBe(888);
  });

  it("deleteById only soft-deletes scoped document", async () => {
    const created = await tenantRepo.create({ name: "scoped-delete", value: 1 });

    await otherTenantRepo.deleteById(String(created._id));
    const stillExists = await tenantRepo.findById(String(created._id));
    expect(stillExists).not.toBeNull();

    await tenantRepo.deleteById(String(created._id));
    const gone = await tenantRepo.findById(String(created._id));
    expect(gone).toBeNull();
  });

  it("withoutTenantScope bypasses tenant filter", async () => {
    await tenantRepo.create({ name: "a", value: 1 });
    await otherTenantRepo.create({ name: "b", value: 2 });

    const unscoped = tenantRepo.withoutTenantScope();
    const all = await unscoped.findMany({});
    expect(all).toHaveLength(2);
  });
});

// ── Soft Delete Plugin ─────────────────────────────

describe("softDeletePlugin", () => {
  it("excludes soft-deleted documents from normal queries", async () => {
    await repo.create({ name: "active", value: 1, tenantId: "t1" });
    const toDelete = await repo.create({ name: "deleted", value: 2, tenantId: "t1" });
    await repo.deleteById(String(toDelete._id));

    const all = await repo.findMany({ tenantId: "t1" });
    expect(all).toHaveLength(1);
    expect(all[0]?.name).toBe("active");
  });
});

// ── UserRepository ──────────────────────────────────

describe("UserRepository", () => {
  let userRepo: UserRepository;
  const baseUser = {
    email: "alice@example.com",
    name: "Alice",
    passwordHash: "hashed-pw-123",
    mfaSecret: "mfa-secret-xyz",
    recoveryCodes: ["code1", "code2"],
    isActive: true,
  };

  beforeAll(() => {
    userRepo = new UserRepository();
  });

  beforeEach(async () => {
    await UserModel.deleteMany({});
  });

  it("creates a user and excludes sensitive fields on read", async () => {
    const created = await userRepo.create(baseUser);
    expect(created.email).toBe("alice@example.com");

    const found = await userRepo.findByEmail("alice@example.com");
    expect(found).not.toBeNull();
    expect(found?.name).toBe("Alice");
    expect(found?.passwordHash).toBeUndefined();
    expect(found?.mfaSecret).toBeUndefined();
    expect(found?.recoveryCodes).toBeUndefined();
  });

  it("finds active users", async () => {
    await userRepo.create(baseUser);
    await userRepo.create({
      ...baseUser,
      email: "bob@example.com",
      name: "Bob",
      isActive: false,
    });
    const active = await userRepo.findActive();
    expect(active).toHaveLength(1);
    expect(active[0]?.name).toBe("Alice");
  });

  it("searches users by name", async () => {
    await userRepo.create(baseUser);
    await userRepo.create({ ...baseUser, email: "bob@example.com", name: "Bob" });
    const results = await userRepo.searchByName("bob");
    expect(results).toHaveLength(1);
    expect(results[0]?.name).toBe("Bob");
  });

  it("sets MFA secret and enables MFA", async () => {
    const created = await userRepo.create(baseUser);
    const id = getId(getRaw(created));
    await userRepo.setMfaSecret(id, "new-secret");

    const raw = await UserModel.findById(id).lean();
    expect(raw).not.toBeNull();
    expect(getRaw(raw).mfaSecret as string).toBe("new-secret");
    expect(getRaw(raw).mfaEnabled as boolean).toBe(true);
  });

  it("verifies and consumes recovery code", async () => {
    const created = await userRepo.create(baseUser);
    const id = getId(getRaw(created));

    const valid = await userRepo.verifyRecoveryCode(id, "code1");
    expect(valid).toBe(true);

    const replayed = await userRepo.verifyRecoveryCode(id, "code1");
    expect(replayed).toBe(false);
  });
});

// ── WorkspaceRepository ─────────────────────────────

describe("WorkspaceRepository", () => {
  let wsRepo: WorkspaceRepository;

  beforeAll(() => {
    wsRepo = new WorkspaceRepository("tenant-ws-1");
  });

  beforeEach(async () => {
    await WorkspaceModel.deleteMany({});
  });

  it("creates and finds by slug", async () => {
    await wsRepo.create({ name: "My Workspace", slug: "my-workspace", ownerId: "user-1" });
    const found = await wsRepo.findBySlug("my-workspace");
    expect(found).not.toBeNull();
    expect(found?.tenantId).toBe("tenant-ws-1");
  });

  it("finds by owner", async () => {
    await wsRepo.create({ name: "Ws A", slug: "ws-a", ownerId: "user-1" });
    await wsRepo.create({ name: "Ws B", slug: "ws-b", ownerId: "user-1" });
    const owned = await wsRepo.findByOwner("user-1");
    expect(owned).toHaveLength(2);
  });

  it("searches by name or slug", async () => {
    await wsRepo.create({ name: "Alpha Corp", slug: "alpha", ownerId: "u1" });
    await wsRepo.create({ name: "Beta Inc", slug: "beta", ownerId: "u1" });
    const results = await wsRepo.searchByNameOrSlug("beta");
    expect(results).toHaveLength(1);
    expect(results[0]?.name).toBe("Beta Inc");
  });

  it("updates settings", async () => {
    const created = await wsRepo.create({ name: "Settings Test", slug: "settings", ownerId: "u1" });
    const id = getId(getRaw(created));
    const updated = await wsRepo.updateSettings(id, { theme: "dark" });
    expect(updated).not.toBeNull();
    expect(updated?.settings?.theme).toBe("dark");
  });
});

// ── SessionRepository ───────────────────────────────

describe("SessionRepository", () => {
  let sessRepo: SessionRepository;

  beforeAll(() => {
    sessRepo = new SessionRepository("tenant-sess-1");
  });

  beforeEach(async () => {
    await SessionModel.deleteMany({});
  });

  it("creates and finds by token", async () => {
    const future = new Date(Date.now() + 3600000);
    await sessRepo.create({ token: "tok-123", userId: "u1", expiresAt: future });
    const found = await sessRepo.findByToken("tok-123");
    expect(found).not.toBeNull();
    expect(found?.userId).toBe("u1");
  });

  it("finds active sessions for a user", async () => {
    const future = new Date(Date.now() + 3600000);
    await sessRepo.create({ token: "tok-1", userId: "u1", expiresAt: future });
    await sessRepo.create({ token: "tok-2", userId: "u1", expiresAt: future });
    await sessRepo.create({ token: "tok-3", userId: "u1", expiresAt: future, isValid: false });
    const active = await sessRepo.findActiveByUser("u1");
    expect(active).toHaveLength(2);
  });

  it("invalidates a single session", async () => {
    const future = new Date(Date.now() + 3600000);
    await sessRepo.create({ token: "tok-invalidate", userId: "u1", expiresAt: future });
    await sessRepo.invalidateSession("tok-invalidate");
    const found = await sessRepo.findByToken("tok-invalidate");
    expect(found?.isValid).toBe(false);
  });

  it("invalidates all user sessions", async () => {
    const future = new Date(Date.now() + 3600000);
    await sessRepo.create({ token: "t1", userId: "u2", expiresAt: future });
    await sessRepo.create({ token: "t2", userId: "u2", expiresAt: future });
    const count = await sessRepo.invalidateAllUserSessions("u2");
    expect(count).toBe(2);
  });

  it("cleanups expired sessions", async () => {
    const past = new Date(Date.now() - 3600000);
    const future = new Date(Date.now() + 3600000);
    await sessRepo.create({ token: "expired", userId: "u3", expiresAt: past });
    await sessRepo.create({ token: "active", userId: "u3", expiresAt: future });
    const count = await sessRepo.cleanupExpired();
    expect(count).toBe(1);
  });

  it("enforces tenant scope", async () => {
    const other = new SessionRepository("tenant-other");
    const future = new Date(Date.now() + 3600000);
    await sessRepo.create({ token: "tok-scope", userId: "u1", expiresAt: future });
    const found = await other.findByToken("tok-scope");
    expect(found).toBeNull();
  });
});

// ── ApiKeyRepository ────────────────────────────────

describe("ApiKeyRepository", () => {
  let apiKeyRepo: ApiKeyRepository;

  beforeAll(() => {
    apiKeyRepo = new ApiKeyRepository("tenant-key-1");
  });

  beforeEach(async () => {
    await ApiKeyModel.deleteMany({});
  });

  it("creates and excludes keyHash on read", async () => {
    await apiKeyRepo.create({
      name: "Prod Key",
      keyHash: "hash-abc-123",
      keyPrefix: "sk_prod",
      scopes: ["read"],
      createdBy: "u1",
    });
    const keys = await apiKeyRepo.findByWorkspace();
    expect(keys).toHaveLength(1);
    expect(keys[0]?.name).toBe("Prod Key");
    expect(getRaw(keys[0]).keyHash).toBeUndefined();
  });

  it("finds by key hash (excludes keyHash by default)", async () => {
    await apiKeyRepo.create({
      name: "Dev Key",
      keyHash: "hash-xyz-789",
      keyPrefix: "sk_dev",
      scopes: ["write"],
      createdBy: "u1",
    });
    const found = await apiKeyRepo.findByKeyHash("hash-xyz-789");
    expect(found).not.toBeNull();
    expect(found?.name).toBe("Dev Key");
    expect(found).toBeDefined();
    expect(getRaw(found).keyHash).toBeUndefined();
  });

  it("rotates key hash", async () => {
    const created = await apiKeyRepo.create({
      name: "Rotate Test",
      keyHash: "hash-old",
      keyPrefix: "sk_test",
      scopes: [],
      createdBy: "u1",
    });
    const id = getId(getRaw(created));
    await apiKeyRepo.rotateKey(id, "hash-new");
    const raw = await ApiKeyModel.findById(id).lean();
    expect(raw).not.toBeNull();
    expect(getRaw(raw).keyHash as string).toBe("hash-new");
  });

  it("revokes key", async () => {
    const created = await apiKeyRepo.create({
      name: "Revoke Test",
      keyHash: "hash-rev",
      keyPrefix: "sk_test",
      scopes: [],
      createdBy: "u1",
    });
    const id = getId(getRaw(created));
    await apiKeyRepo.revokeKey(id);
    const raw = await ApiKeyModel.findById(id).lean();
    expect(raw).not.toBeNull();
    expect(getRaw(raw).isActive as boolean).toBe(false);
  });

  it("records usage timestamp", async () => {
    const created = await apiKeyRepo.create({
      name: "Usage Test",
      keyHash: "hash-usage",
      keyPrefix: "sk_test",
      scopes: [],
      createdBy: "u1",
    });
    const id = getId(getRaw(created));
    await apiKeyRepo.recordUsage(id);
    const raw = await ApiKeyModel.findById(id).lean();
    expect(raw).not.toBeNull();
    expect(getRaw(raw).lastUsedAt).toBeTruthy();
  });
});

// ── AuditLogRepository ──────────────────────────────

describe("AuditLogRepository", () => {
  let auditRepo: AuditLogRepository;

  beforeAll(() => {
    auditRepo = new AuditLogRepository("tenant-audit-1");
  });

  beforeEach(async () => {
    await AuditLogModel.deleteMany({});
  });

  it("logs an entry", async () => {
    const entry = await auditRepo.log({
      action: "user.login",
      userId: "u1",
      ipAddress: "127.0.0.1",
    });
    expect(entry.tenantId).toBe("tenant-audit-1");
    expect(entry.action).toBe("user.login");
  });

  it("logAsync writes without blocking", async () => {
    auditRepo.logAsync({
      action: "async.test",
      userId: "u1",
    });
    await new Promise((r) => setTimeout(r, 500));
    const logs = await auditRepo.findByWorkspace();
    expect(logs).toHaveLength(1);
    expect(logs[0]?.action).toBe("async.test");
  });

  it("filters by user", async () => {
    await auditRepo.log({ action: "a", userId: "u1" });
    await auditRepo.log({ action: "b", userId: "u2" });
    const filtered = await auditRepo.findByUser("u1");
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.action).toBe("a");
  });

  it("filters by entity", async () => {
    await auditRepo.log({ action: "doc.create", entityType: "document", entityId: "doc-1" });
    await auditRepo.log({ action: "doc.update", entityType: "document", entityId: "doc-1" });
    await auditRepo.log({ action: "ws.update", entityType: "workspace", entityId: "ws-1" });
    const docAudits = await auditRepo.findByEntity("document", "doc-1");
    expect(docAudits).toHaveLength(2);
  });

  it("filters by date range", async () => {
    const now = Date.now();
    await auditRepo.log({ action: "old", createdAt: new Date(now - 86400000) });
    await auditRepo.log({ action: "recent", createdAt: new Date(now) });
    const filtered = await auditRepo.findByWorkspace({
      dateFrom: new Date(now - 3600000),
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.action).toBe("recent");
  });
});

// ── DocumentRepository ──────────────────────────────

describe("DocumentRepository", () => {
  let docRepo: DocumentRepository;

  beforeAll(() => {
    docRepo = new DocumentRepository("tenant-doc-1");
  });

  beforeEach(async () => {
    await DocumentModel.deleteMany({});
  });

  it("creates and filters by status", async () => {
    await docRepo.create({
      title: "Report.pdf",
      source: "upload",
      status: "ready",
      uploadedBy: "u1",
    });
    await docRepo.create({
      title: "Draft.docx",
      source: "upload",
      status: "processing",
      uploadedBy: "u1",
    });
    const ready = await docRepo.findByStatus("ready");
    expect(ready).toHaveLength(1);
    expect(ready[0]?.title).toBe("Report.pdf");
  });

  it("filters by content type and source", async () => {
    await docRepo.create({
      title: "Doc A",
      source: "upload",
      contentType: "application/pdf",
      status: "ready",
      uploadedBy: "u1",
    });
    await docRepo.create({
      title: "Doc B",
      source: "webhook",
      contentType: "application/json",
      status: "ready",
      uploadedBy: "u1",
    });
    const filtered = await docRepo.findByWorkspace({
      contentType: "application/pdf",
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.title).toBe("Doc A");
  });

  it("searches documents by text", async () => {
    await docRepo.create({
      title: "Quarterly Report 2025",
      source: "upload",
      status: "ready",
      tags: ["finance", "quarterly"],
      uploadedBy: "u1",
    });
    await docRepo.create({
      title: "Engineering Notes",
      source: "upload",
      status: "ready",
      tags: ["engineering"],
      uploadedBy: "u1",
    });
    await new Promise((r) => setTimeout(r, 200));
    const results = await docRepo.search("Quarterly");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0]?.title).toMatch(/Quarterly/i);
  });

  it("updates status and marks processed", async () => {
    const created = await docRepo.create({
      title: "Processable.pdf",
      source: "upload",
      status: "processing",
      uploadedBy: "u1",
    });
    const id = getId(getRaw(created));
    await docRepo.markProcessed(id);
    const raw = await DocumentModel.findById(id).lean();
    expect(raw).not.toBeNull();
    expect(getRaw(raw).status as string).toBe("ready");
    expect(getRaw(raw).processedAt).toBeTruthy();
  });

  it("counts documents by workspace", async () => {
    await docRepo.create({
      title: "File A", source: "upload", status: "ready", uploadedBy: "u1",
    });
    await docRepo.create({
      title: "File B", source: "upload", status: "ready", uploadedBy: "u1",
    });
    const count = await docRepo.countByWorkspace();
    expect(count).toBe(2);
  });

  it("enforces tenant scope", async () => {
    const other = new DocumentRepository("tenant-other");
    await docRepo.create({
      title: "Scoped Doc", source: "upload", status: "ready", uploadedBy: "u1",
    });
    const all = await other.findByWorkspace();
    expect(all).toHaveLength(0);
  });
});
