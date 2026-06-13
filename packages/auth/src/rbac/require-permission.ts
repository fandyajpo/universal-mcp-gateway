import type { Permission } from "./permissions";
import type { RBACService } from "./service";
import { createLogger } from "@repo/logger";

const logger = createLogger("@repo/auth:rbac:guard");

let rbacService: RBACService | null = null;

export function setRBACService(service: RBACService): void {
  rbacService = service;
  logger.info("RBAC service initialized for permission guards");
}

export function requirePermission(permission: Permission) {
  return async function check(
    userId: string,
    workspaceId: string,
  ): Promise<{ allowed: true } | { allowed: false; error: string; status: number }> {
    if (!rbacService) {
      logger.error("RBAC service not initialized");
      return { allowed: false, error: "Internal server error", status: 500 };
    }

    const hasPermission = await rbacService.checkPermission(userId, workspaceId, permission);
    if (!hasPermission) {
      logger.warn({ userId, workspaceId, permission }, "permission denied");
      return { allowed: false, error: "Forbidden", status: 403 };
    }

    return { allowed: true };
  };
}

export type PermissionGuard = ReturnType<typeof requirePermission>;
