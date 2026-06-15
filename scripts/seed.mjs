/**
 * Seed CLI
 *
 * Usage:
 *   node scripts/seed.mjs            — Run all seeds
 *   node scripts/seed.mjs reset      — Drop all data and re-seed
 *   node scripts/seed.mjs minimal    — Minimal seed (users + workspaces only)
 */
import { createRequire } from "module";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");

// Load .env from project root
try {
  const envPath = join(ROOT, ".env");
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  // .env file is optional
}

// Resolve mongoose from @repo/database's node_modules (pnpm symlink)
const mongoose = createRequire(
  join(ROOT, "packages/database/node_modules/mongoose/index.js"),
)("mongoose");

// Resolve pino from @repo/logger's node_modules (pnpm symlink)
const pino = createRequire(
  join(ROOT, "packages/logger/node_modules/pino/package.json"),
)("pino");

const logger = pino({ level: "info", name: "seed" });

// Resolve bcrypt for password hashing
const bcrypt = createRequire(
  join(ROOT, "node_modules/.pnpm/bcrypt@5.1.1/node_modules/bcrypt/package.json"),
)("bcrypt");

// Seed data imports
const { USERS } = await import("./seed/data/users.mjs");
const { WORKSPACES } = await import("./seed/data/workspaces.mjs");
const { DOCUMENTS } = await import("./seed/data/documents.mjs");

// Factory imports
const { createDocumentData } = await import("./seed/factories/document.mjs");
const { createAuditLogEntries } = await import("./seed/factories/audit-log.mjs");

const TENANT_ID = "development";

async function connect() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error("DATABASE_URL environment variable is required");
    process.exit(1);
  }

  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return;
  }

  await mongoose.connect(DATABASE_URL, {
    minPoolSize: Number(process.env.DATABASE_POOL_MIN ?? 5),
    maxPoolSize: Number(process.env.DATABASE_POOL_MAX ?? 50),
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 15000,
    heartbeatFrequencyMS: 10000,
    retryWrites: true,
    w: "majority",
    readConcern: { level: "majority" },
  });
}

async function disconnect() {
  await mongoose.disconnect();
}

async function seedUsers() {
  const coll = mongoose.connection.db.collection("users");
  let created = 0;
  let skipped = 0;

  for (const userDef of USERS) {
    const existing = await coll.findOne({ email: userDef.email });
    if (existing) {
      skipped++;
      continue;
    }

    const passwordHash = await bcrypt.hash(userDef.password, 12);
    const doc = {
      email: userDef.email,
      emailVerified: userDef.emailVerified ? new Date() : undefined,
      name: userDef.name,
      passwordHash,
      isActive: userDef.isActive,
      roles: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await coll.insertOne(doc);
    userDef._id = doc._id;
    created++;
  }

  logger.info({ created, skipped }, "Users seeded");
  return created + skipped;
}

async function resolveUserIds() {
  const coll = mongoose.connection.db.collection("users");
  const emails = USERS.map((u) => u.email);
  const users = await coll.find({ email: { $in: emails } }).toArray();
  const userMap = new Map();
  for (const user of users) {
    const def = USERS.find((u) => u.email === user.email);
    if (def) userMap.set(def.id, user);
  }
  return userMap;
}

async function seedWorkspaces(userMap) {
  const coll = mongoose.connection.db.collection("workspaces");
  let created = 0;
  let skipped = 0;

  for (const wsDef of WORKSPACES) {
    const existing = await coll.findOne({ slug: wsDef.slug });
    if (existing) {
      skipped++;
      continue;
    }

    const now = new Date();
    const members = [];

    for (const m of wsDef.members) {
      const user = userMap.get(m.userId);
      if (!user) continue;
      members.push({
        userId: String(user._id),
        role: m.role,
        joinedAt: now,
      });
    }

    const doc = {
      tenantId: wsDef.slug,
      name: wsDef.name,
      slug: wsDef.slug,
      description: wsDef.description,
      ownerId: String(userMap.get(wsDef.members[0].userId)._id),
      memberCount: members.length,
      plan: wsDef.plan,
      isActive: true,
      members,
      settings: wsDef.settings || {},
      createdAt: now,
      updatedAt: now,
    };

    await coll.insertOne(doc);
    wsDef._id = doc._id;
    created++;
  }

  logger.info({ created, skipped }, "Workspaces seeded");
  return created + skipped;
}

async function seedDocuments(workspaceMap) {
  const coll = mongoose.connection.db.collection("documents");
  let created = 0;

  const acmeWs = WORKSPACES.find((w) => w.id === "seed-ws-acme");
  const acmeDoc = workspaceMap.get("seed-ws-acme");
  if (!acmeWs || !acmeDoc) {
    logger.warn("Acme Corp workspace not found — skipping documents");
    return 0;
  }

  const userMap = await resolveUserIds();
  const uploader = userMap.get("seed-user-admin");
  if (!uploader) {
    logger.warn("Admin user not found — skipping documents");
    return 0;
  }

  for (const docDef of DOCUMENTS) {
    const existing = await coll.findOne({
      tenantId: acmeDoc.slug,
      title: docDef.title,
    });
    if (existing) {
      continue;
    }

    const doc = createDocumentData(docDef, acmeDoc.slug, String(uploader._id));
    await coll.insertOne(doc);
    created++;
  }

  logger.info({ created }, "Documents seeded");
  return created;
}

async function seedAuditLogs(count, workspaceMap) {
  const coll = mongoose.connection.db.collection("audit_logs");
  const acmeDoc = workspaceMap.get("seed-ws-acme");
  if (!acmeDoc) {
    logger.warn("Acme Corp not found — skipping audit logs");
    return 0;
  }

  const userMap = await resolveUserIds();
  const userIds = [...userMap.values()].map((u) => String(u._id));

  const entries = createAuditLogEntries(count, acmeDoc.slug, userIds);
  if (entries.length === 0) {
    return 0;
  }

  await coll.insertMany(entries);
  logger.info({ count: entries.length }, "Audit logs seeded");
  return entries.length;
}

async function seedApiKeys(workspaceMap) {
  const coll = mongoose.connection.db.collection("api_keys");
  const acmeDoc = workspaceMap.get("seed-ws-acme");
  if (!acmeDoc) {
    logger.warn("Acme Corp not found — skipping API keys");
    return 0;
  }

  const userMap = await resolveUserIds();
  const admin = userMap.get("seed-user-admin");
  if (!admin) {
    logger.warn("Admin user not found — skipping API keys");
    return 0;
  }

  const keyHash1 = await bcrypt.hash("sk_test_active_" + randomHex(16), 12);
  const keyHash2 = await bcrypt.hash("sk_test_revoked_" + randomHex(16), 12);

  const existing = await coll.findOne({ keyHash: { $in: [keyHash1, keyHash2] } });
  if (existing) {
    logger.info("API keys already seeded — skipping");
    return 0;
  }

  const now = new Date();
  const keys = [
    {
      tenantId: acmeDoc.slug,
      name: "Production API Key",
      keyHash: keyHash1,
      keyPrefix: "sk_prod",
      scopes: ["workspace:read", "workspace:write", "document:read", "document:write"],
      isActive: true,
      createdBy: String(admin._id),
      createdAt: now,
      updatedAt: now,
    },
    {
      tenantId: acmeDoc.slug,
      name: "Development API Key (Revoked)",
      keyHash: keyHash2,
      keyPrefix: "sk_dev",
      scopes: ["workspace:read"],
      isActive: false,
      createdBy: String(admin._id),
      createdAt: new Date(now.getTime() - 86400000 * 30),
      updatedAt: now,
    },
  ];

  await coll.insertMany(keys);
  logger.info({ count: keys.length }, "API keys seeded");
  return keys.length;
}

async function seedSessions(workspaceMap) {
  const coll = mongoose.connection.db.collection("sessions");
  const acmeDoc = workspaceMap.get("seed-ws-acme");
  if (!acmeDoc) {
    logger.warn("Acme Corp not found — skipping sessions");
    return 0;
  }

  const userMap = await resolveUserIds();
  const now = new Date();
  let created = 0;

  for (const [_, user] of userMap) {
    const token = "sess_seed_" + randomHex(32);
    const existing = await coll.findOne({ token });
    if (existing) {
      continue;
    }

    await coll.insertOne({
      tenantId: acmeDoc.slug,
      userId: String(user._id),
      token,
      expiresAt: new Date(now.getTime() + 86400000 * 7),
      ipAddress: "127.0.0.1",
      userAgent: "SeedScript/1.0",
      isValid: true,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
    });
    created++;
  }

  logger.info({ created }, "Sessions seeded");
  return created;
}

async function seedInvitations(workspaceMap) {
  const coll = mongoose.connection.db.collection("invitations");
  const acmeDoc = workspaceMap.get("seed-ws-acme");
  if (!acmeDoc) {
    logger.warn("Acme Corp not found — skipping invitations");
    return 0;
  }

  const userMap = await resolveUserIds();
  const admin = userMap.get("seed-user-admin");
  if (!admin) {
    logger.warn("Admin user not found — skipping invitations");
    return 0;
  }

  const now = new Date();
  let created = 0;

  for (const inv of INVITATION_DEFS) {
    const token = "inv_seed_" + randomHex(24);
    const existing = await coll.findOne({ token });
    if (existing) {
      continue;
    }

    let expiresAt;
    let appliedAt;
    let status = inv.status;

    if (inv.status === "expired") {
      expiresAt = new Date(now.getTime() - 86400000);
      appliedAt = undefined;
    } else {
      expiresAt = new Date(now.getTime() + 86400000 * 7);
      appliedAt = inv.status === "accepted" ? new Date(now.getTime() - 86400000 * 2) : undefined;
    }

    await coll.insertOne({
      tenantId: acmeDoc.slug,
      workspaceId: String(acmeDoc._id),
      workspaceName: "Acme Corp",
      inviterId: String(admin._id),
      inviteeEmail: inv.email,
      role: inv.role,
      token,
      message: inv.message,
      status,
      expiresAt,
      acceptedAt: appliedAt && status === "accepted" ? appliedAt : undefined,
      createdAt: new Date(now.getTime() - 86400000 * 3),
      updatedAt: now,
    });
    created++;
  }

  logger.info({ created }, "Invitations seeded");
  return created;
}

const INVITATION_DEFS = [
  { email: "pending@example.com", role: "member", message: "Welcome to Acme Corp! Please join our workspace.", status: "pending" },
  { email: "pending2@example.com", role: "admin", message: "We need an admin to help manage the workspace.", status: "pending" },
  { email: "accepted@example.com", role: "member", message: "Join us!", status: "accepted" },
  { email: "expired@example.com", role: "viewer", message: "This invitation has expired.", status: "expired" },
];

function randomHex(bytes) {
  const chars = "abcdef0123456789";
  let result = "";
  for (let i = 0; i < bytes * 2; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

async function runSeed({ minimal } = {}) {
  await connect();

  const userCount = await seedUsers();
  const userMap = await resolveUserIds();
  const wsCount = await seedWorkspaces(userMap);
  const workspaceMap = new Map();
  {
    const docs = await mongoose.connection.db
      .collection("workspaces")
      .find({ slug: { $in: WORKSPACES.map((w) => w.slug) } })
      .toArray();
    for (const doc of docs) {
      const def = WORKSPACES.find((w) => w.slug === doc.slug);
      if (def) workspaceMap.set(def.id, doc);
    }
  }

  if (!minimal) {
    await seedDocuments(workspaceMap);
    await seedAuditLogs(50, workspaceMap);
    await seedApiKeys(workspaceMap);
    await seedSessions(workspaceMap);
    await seedInvitations(workspaceMap);
  }

  await disconnect();

  logger.info({ users: userCount, workspaces: wsCount }, minimal ? "Minimal seed complete" : "Full seed complete");
}

async function runReset() {
  await connect();

  const db = mongoose.connection.db;
  const collections = [
    "users",
    "workspaces",
    "documents",
    "audit_logs",
    "api_keys",
    "sessions",
    "invitations",
  ];

  for (const name of collections) {
    try {
      await db.collection(name).deleteMany({});
      logger.info({ collection: name }, "Cleared");
    } catch {
      logger.warn({ collection: name }, "Could not clear");
    }
  }

  logger.info("All seed data cleared");

  await disconnect();
}

function showUsage() {
  console.log(`
Usage:
  node scripts/seed.mjs              \u2014 Run all seeds
  node scripts/seed.mjs reset        \u2014 Drop all seed data and re-seed
  node scripts/seed.mjs minimal      \u2014 Seed users and workspaces only
`);
}

async function main() {
  const command = process.argv[2];

  switch (command) {
    case "reset": {
      const dbUrl = process.env.DATABASE_URL || "";
      const dbName = dbUrl.split("/").pop()?.split("?").shift() || "universal-mcp";
      console.log(`\n  WARNING: This will DELETE ALL data in database "${dbName}".`);
      console.log("  Press Ctrl+C within 5 seconds to cancel...\n");
      await new Promise((r) => setTimeout(r, 5000));

      await runReset();
      await runSeed({ minimal: false });
      break;
    }
    case "minimal":
      await runSeed({ minimal: true });
      break;
    case undefined:
    case "":
      await runSeed({ minimal: false });
      break;
    default:
      showUsage();
      process.exit(1);
  }
}

main().catch((err) => {
  logger.error({ err }, "Seed failed");
  process.exit(1);
});
