import mongoose from "mongoose";

import { createLogger } from "@repo/logger";

const logger = createLogger("database");

export interface HealthCheckResult {
  ok: boolean;
  latency: number;
  error?: string;
}

export interface ConnectionConfig {
  minPoolSize?: number;
  maxPoolSize?: number;
  socketTimeoutMS?: number;
  serverSelectionTimeoutMS?: number;
  heartbeatFrequencyMS?: number;
  retryWrites?: boolean;
  w?: string;
  readConcern?: { level: string };
}

const DEFAULT_CONFIG: Required<ConnectionConfig> = {
  minPoolSize: 5,
  maxPoolSize: 50,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 30000,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  w: "majority",
  readConcern: { level: "majority" },
};

let connectionPromise: Promise<void> | null = null;
let eventListenersAttached = false;

function attachEventListeners(): void {
  if (eventListenersAttached) return;
  eventListenersAttached = true;

  mongoose.connection.on("connected", () => {
    logger.info("MongoDB connected");
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
  });

  mongoose.connection.on("reconnected", () => {
    logger.info("MongoDB reconnected");
  });

  mongoose.connection.on("error", (err) => {
    logger.error({ err }, "MongoDB connection error");
  });
}

export async function connect(url?: string, config?: ConnectionConfig): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  const DATABASE_URL = url ?? (await getDatabaseUrl());

  const opts: ConnectionConfig = { ...DEFAULT_CONFIG, ...config };

  // Load env-based pool overrides when no explicit config provided
  const configPoolMin = config?.minPoolSize;
  const configPoolMax = config?.maxPoolSize;
  if (configPoolMin === undefined || configPoolMax === undefined) {
    try {
      const { getConfig } = await import("@repo/config");
      const cfg = getConfig();
      if (configPoolMin === undefined) opts.minPoolSize = cfg.database.poolMin;
      if (configPoolMax === undefined) opts.maxPoolSize = cfg.database.poolMax;
    } catch {
      // Fall through to defaults if config not loaded
    }
  }

  attachEventListeners();

  connectionPromise = mongoose.connect(DATABASE_URL, opts as mongoose.ConnectOptions).then(() => {
    logger.info(
      {
        minPoolSize: opts.minPoolSize,
        maxPoolSize: opts.maxPoolSize,
        serverSelectionTimeoutMS: opts.serverSelectionTimeoutMS,
        socketTimeoutMS: opts.socketTimeoutMS,
      },
      "MongoDB connection established",
    );
  }).catch((err: unknown) => {
    logger.error({ err }, "MongoDB connection failed");
    connectionPromise = null;
    throw err;
  });

  return connectionPromise;
}

async function getDatabaseUrl(): Promise<string> {
  const { getConfig } = await import("@repo/config");
  const config = getConfig();
  return config.database.url;
}

export async function disconnect(): Promise<void> {
  connectionPromise = null;
  await mongoose.disconnect();
  logger.info("MongoDB disconnected gracefully");
}

export function getConnection(): mongoose.Connection {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
  if (mongoose.connection.readyState === 0) {
    throw new Error("Database not connected. Call connect() first.");
  }
  return mongoose.connection;
}

export function getPoolStats(): {
  active: number | undefined;
  idle: number | undefined;
  available: number | undefined;
} {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return { active: undefined, idle: undefined, available: undefined };
    }
    const pool = extractPool();
    return pool;
  } catch {
    return { active: undefined, idle: undefined, available: undefined };
  }
}

function extractPool(): {
  active: number | undefined;
  idle: number | undefined;
  available: number | undefined;
} {
  const client = mongoose.connection.getClient();
  const topology = (client as unknown as { topology?: { s?: { pool?: { active: number; available: number } } } }).topology;
  if (!topology?.s?.pool) {
    return { active: undefined, idle: undefined, available: undefined };
  }
  return {
    active: topology.s.pool.active,
    idle: topology.s.pool.available - topology.s.pool.active,
    available: topology.s.pool.available,
  };
}

export function isConnected(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
  return mongoose.connection.readyState === 1;
}

export async function healthCheck(): Promise<HealthCheckResult> {
  const start = Date.now();

  try {
    const db = mongoose.connection.db;
    if (!db) {
      return { ok: false, latency: Date.now() - start, error: "No database instance" };
    }
    await db.admin().ping();
    return { ok: true, latency: Date.now() - start };
  } catch (err) {
    return {
      ok: false,
      latency: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
