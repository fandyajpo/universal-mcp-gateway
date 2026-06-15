/**
 * Migration CLI
 *
 * Usage:
 *   node scripts/migrate.mjs up          — Run pending migrations
 *   node scripts/migrate.mjs down        — Roll back last migration
 *   node scripts/migrate.mjs create <n>  — Create a new migration file
 *   node scripts/migrate.mjs status      — List migration status
 */
import { createRequire } from "module";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { readFileSync, readdirSync, writeFileSync, existsSync } from "fs";
import { createHash } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");

// Load .env from project root (no dotenv dependency needed)
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
  // .env file is optional — fall through to process.env
}

// Resolve mongoose from @repo/database's node_modules (pnpm symlink)
const mongoose = createRequire(
  join(ROOT, "packages/database/node_modules/mongoose/index.js"),
)("mongoose");

// Resolve pino from @repo/logger's node_modules (pnpm symlink)
const pino = createRequire(
  join(ROOT, "packages/logger/node_modules/pino/package.json"),
)("pino");

const logger = pino({ level: "info", name: "migrate" });

const MIGRATIONS_DIR = join(__dirname, "migrations");
const COLLECTION_NAME = "_migrations";

function getDb() {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database not available");
  return db;
}

async function ensureCollection(db) {
  const collections = await db
    .listCollections({ name: COLLECTION_NAME })
    .toArray();
  if (collections.length === 0) {
    await db.createCollection(COLLECTION_NAME);
  }
  await db.collection(COLLECTION_NAME).createIndex({ id: 1 }, { unique: true });
}

function parseMigrationFileName(fileName) {
  const match = fileName.match(/^(\d{14})-(.+)\.mjs$/);
  if (!match) return null;
  return { id: match[1], name: match[2] };
}

function computeChecksum(filePath) {
  const content = readFileSync(filePath, "utf-8");
  return createHash("sha256").update(content).digest("hex");
}

function listMigrationFiles() {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".mjs") && f !== "template.mjs")
    .sort();

  const migrations = [];

  for (const file of files) {
    const parsed = parseMigrationFileName(file);
    if (!parsed) continue;

    const filePath = join(MIGRATIONS_DIR, file);
    migrations.push({
      id: parsed.id,
      name: parsed.name,
      filePath,
      checksum: computeChecksum(filePath),
    });
  }

  return migrations;
}

async function getAppliedMigrations(db) {
  return db
    .collection(COLLECTION_NAME)
    .find({})
    .sort({ id: 1 })
    .toArray();
}

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

async function tryStartTransaction(db) {
  try {
    const session = mongoose.connection.startSession();
    session.startTransaction({
      readConcern: { level: "majority" },
      writeConcern: { w: "majority" },
    });
    return session;
  } catch {
    logger.warn("Transactions not available — running without transaction");
    return undefined;
  }
}

async function runUp() {
  await connect();
  const db = getDb();
  await ensureCollection(db);

  const allFiles = listMigrationFiles();
  const applied = await getAppliedMigrations(db);
  const appliedIds = new Set(applied.map((r) => r.id));

  const pending = allFiles.filter((f) => !appliedIds.has(f.id));

  if (pending.length === 0) {
    logger.info("No pending migrations");
    await disconnect();
    return;
  }

  logger.info({ count: pending.length }, "Running pending migrations");

  for (const migration of pending) {
    const start = Date.now();
    logger.info({ id: migration.id, name: migration.name }, "Applying migration");

    try {
      const mod = await import(migration.filePath);
      if (typeof mod.up !== "function") {
        throw new Error(`Migration ${migration.id} does not export up()`);
      }

      const session = await tryStartTransaction(db);
      try {
        await mod.up(session ? db : db);
        if (session) {
          await session.commitTransaction();
        }
      } catch (err) {
        if (session) {
          await session.abortTransaction();
        }
        throw err;
      } finally {
        if (session) {
          await session.endSession();
        }
      }

      const duration = Date.now() - start;
      await db.collection(COLLECTION_NAME).insertOne({
        id: migration.id,
        name: migration.name,
        appliedAt: new Date(),
        duration,
        checksum: migration.checksum,
      });

      logger.info({ id: migration.id, durationMs: duration }, "Migration applied");
    } catch (err) {
      logger.error({ id: migration.id, err }, "Migration failed");
      throw err;
    }
  }

  await disconnect();
}

async function runDown() {
  await connect();
  const db = getDb();
  await ensureCollection(db);

  const applied = await getAppliedMigrations(db);
  if (applied.length === 0) {
    logger.info("No migrations to roll back");
    await disconnect();
    return;
  }

  const last = applied[applied.length - 1];
  const migrationFile = join(MIGRATIONS_DIR, `${last.id}-${last.name}.mjs`);

  if (!existsSync(migrationFile)) {
    throw new Error(`Migration file not found: ${migrationFile}`);
  }

  logger.info({ id: last.id, name: last.name }, "Rolling back migration");

  const mod = await import(migrationFile);
  if (typeof mod.down !== "function") {
    throw new Error(`Migration ${last.id} does not export down()`);
  }

  const session = await tryStartTransaction(db);
  try {
    await mod.down(session ? db : db);
    if (session) {
      await session.commitTransaction();
    }
  } catch (err) {
    if (session) {
      await session.abortTransaction();
    }
    throw err;
  } finally {
    if (session) {
      await session.endSession();
    }
  }

  await db.collection(COLLECTION_NAME).deleteOne({ id: last.id });
  logger.info({ id: last.id, name: last.name }, "Migration rolled back");
  await disconnect();
}

async function runCreate(name) {
  if (!name) {
    console.error("Usage: node scripts/migrate.mjs create <name>");
    process.exit(1);
  }

  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T.Z]/g, "")
    .slice(0, 14);
  const fileName = `${timestamp}-${name}.mjs`;
  const filePath = join(MIGRATIONS_DIR, fileName);

  const template = `export async function up(db) {
  // Migration: ${name}
}

export async function down(db) {
  // Revert: ${name}
}
`;

  writeFileSync(filePath, template, "utf-8");
  logger.info({ file: fileName }, "Migration created");
}

async function runStatus() {
  await connect();
  const db = getDb();
  await ensureCollection(db);

  const allFiles = listMigrationFiles();
  const applied = await getAppliedMigrations(db);
  const appliedMap = new Map(applied.map((r) => [r.id, r]));

  if (allFiles.length === 0 && applied.length === 0) {
    logger.info("No migrations found");
    await disconnect();
    return;
  }

  const allIds = new Set();
  for (const f of allFiles) allIds.add(f.id);
  for (const r of applied) allIds.add(r.id);

  const sortedIds = [...allIds].sort();

  console.log("\nMigration Status:");
  console.log("\u2500".repeat(80));
  console.log(`  ${"ID".padEnd(16)} ${"Name".padEnd(30)} Status       Duration`);
  console.log("\u2500".repeat(80));

  for (const id of sortedIds) {
    const file = allFiles.find((f) => f.id === id);
    const record = appliedMap.get(id);
    const name = file?.name ?? record?.name ?? "unknown";
    const status = record ? "applied" : "pending";
    const duration = record ? `${record.duration}ms` : "\u2014";
    console.log(`  ${id.padEnd(16)} ${name.padEnd(30)} ${status.padEnd(12)} ${duration}`);
  }

  console.log("\u2500".repeat(80));
  console.log(
    `  Total: ${sortedIds.length} (${applied.length} applied, ${sortedIds.length - applied.length} pending)`,
  );

  await disconnect();
}

function showUsage() {
  console.log(`
Usage:
  node scripts/migrate.mjs up          \u2014 Run pending migrations
  node scripts/migrate.mjs down        \u2014 Roll back last migration
  node scripts/migrate.mjs create <n>  \u2014 Create a new migration file
  node scripts/migrate.mjs status      \u2014 List migration status
`);
}

async function main() {
  const command = process.argv[2];

  switch (command) {
    case "up":
      await runUp();
      break;
    case "down":
      await runDown();
      break;
    case "create":
      await runCreate(process.argv[3]);
      break;
    case "status":
      await runStatus();
      break;
    default:
      showUsage();
      process.exit(1);
  }
}

main().catch((err) => {
  logger.error({ err }, "Migration failed");
  process.exit(1);
});
