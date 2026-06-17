import type { HealthStatus } from "./types";
import { createLogger } from "@repo/logger";

const logger = createLogger("router/health");

const healthStore = new Map<string, HealthStatus>();

export function setHealth(modelId: string, status: HealthStatus): void {
  healthStore.set(modelId, status);
  logger.info({ modelId, status }, "Model health updated");
}

export function getHealth(modelId: string): HealthStatus {
  return healthStore.get(modelId) ?? "healthy";
}

export function getAllHealth(): Record<string, HealthStatus> {
  return Object.fromEntries(healthStore.entries());
}

export function resetHealth(modelId: string): void {
  healthStore.delete(modelId);
}

export async function getHealthWithCircuit(
  modelId: string,
  workspaceId: string,
): Promise<HealthStatus> {
  const status = getHealth(modelId);
  if (status === "down") {
    return "down";
  }

  try {
    const { getCircuitState } = await import("../fallback/circuit-breaker");
    const circuitState = await getCircuitState(workspaceId, modelId);

    if (circuitState === "open") {
      return "down";
    }

    if (circuitState === "half_open") {
      return "degraded";
    }
  } catch {
    return status;
  }

  return status;
}
