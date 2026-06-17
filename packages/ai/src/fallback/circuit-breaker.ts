import { createLogger } from "@repo/logger";

import type { CircuitBreakerState, CircuitState } from "./types";

const logger = createLogger("circuit-breaker");

const CIRCUIT_PREFIX = "circuit";
const CIRCUIT_TTL = 600;

const MAX_BACKOFF = 600_000;
const INITIAL_BACKOFF = 60_000;
const FAILURE_THRESHOLD = 3;
const FAILURE_WINDOW_MS = 300_000;

function getCircuitKey(workspaceId: string, modelId: string): string {
  return `${CIRCUIT_PREFIX}:${workspaceId}:${modelId}`;
}

function calculateBackoff(attempts: number): number {
  return Math.min(INITIAL_BACKOFF * Math.pow(2, attempts), MAX_BACKOFF);
}

function getDefaultState(): CircuitBreakerState {
  return {
    open: false,
    failureCount: 0,
    lastFailureAt: 0,
    openedAt: 0,
    halfOpenAttempts: 0,
  };
}

export async function getCircuitState(
  workspaceId: string,
  modelId: string,
): Promise<CircuitState> {
  try {
    const { get } = await import("@repo/cache");
    const key = getCircuitKey(workspaceId, modelId);
    const raw = await get(key);

    if (!raw) {
      return "closed";
    }

    const state = JSON.parse(raw) as CircuitBreakerState;

    if (!state.open) {
      return "closed";
    }

    const elapsed = Date.now() - state.openedAt;
    const backoff = calculateBackoff(state.halfOpenAttempts);

    if (elapsed >= backoff) {
      return "half_open";
    }

    return "open";
  } catch {
    return "closed";
  }
}

async function saveState(
  workspaceId: string,
  modelId: string,
  state: CircuitBreakerState,
): Promise<void> {
  try {
    const { set } = await import("@repo/cache");
    const key = getCircuitKey(workspaceId, modelId);
    await set(key, JSON.stringify(state), CIRCUIT_TTL);
  } catch {
    logger.warn({ modelId }, "Failed to save circuit breaker state");
  }
}

export async function recordFailure(
  workspaceId: string,
  modelId: string,
): Promise<CircuitState> {
  const key = getCircuitKey(workspaceId, modelId);

  try {
    const { get } = await import("@repo/cache");
    const raw = await get(key);
    let state: CircuitBreakerState;

    if (raw) {
      state = JSON.parse(raw) as CircuitBreakerState;
    } else {
      state = getDefaultState();
    }

    const now = Date.now();
    const withinWindow = now - state.lastFailureAt < FAILURE_WINDOW_MS;

    if (withinWindow) {
      state.failureCount += 1;
    } else {
      state.failureCount = 1;
    }

    state.lastFailureAt = now;

    if (state.failureCount >= FAILURE_THRESHOLD) {
      state.open = true;
      state.openedAt = now;
      state.halfOpenAttempts += 1;
      logger.warn({ modelId, key }, "Circuit breaker opened");
    }

    await saveState(workspaceId, modelId, state);
    return state.open ? "open" : "closed";
  } catch {
    return "closed";
  }
}

export async function recordSuccess(
  workspaceId: string,
  modelId: string,
): Promise<void> {
  try {
    const state = getDefaultState();
    await saveState(workspaceId, modelId, state);
    logger.info({ modelId }, "Circuit breaker closed (success)");
  } catch {
    logger.warn({ modelId }, "Failed to record success in circuit breaker");
  }
}

export async function resetCircuit(
  workspaceId: string,
  modelId: string,
): Promise<void> {
  try {
    const { del } = await import("@repo/cache");
    const key = getCircuitKey(workspaceId, modelId);
    await del(key);
  } catch {
    logger.warn({ modelId }, "Failed to reset circuit breaker");
  }
}
