import type { Permission } from "./permissions";
import { PERMISSIONS } from "./permissions";

const ALL = PERMISSIONS;

const ADMIN: Permission[] = [
  "workspace:read",
  "workspace:write",
  "workspace:chat",
  "workspace:admin",
  "connector:read",
  "connector:write",
  "connector:install",
  "agent:read",
  "agent:write",
  "agent:deploy",
  "rag:read",
  "rag:write",
  "rag:index",
  "admin:users",
  "admin:billing",
  "admin:audit",
];

const MEMBER: Permission[] = [
  "workspace:read",
  "workspace:write",
  "workspace:chat",
  "connector:read",
  "connector:write",
  "connector:install",
  "agent:read",
  "agent:write",
  "agent:deploy",
  "rag:read",
  "rag:write",
  "rag:index",
];

const VIEWER: Permission[] = [
  "workspace:read",
  "connector:read",
  "agent:read",
  "rag:read",
];

export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";

export const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  owner: 100,
  admin: 80,
  member: 50,
  viewer: 10,
};

export const ROLE_PERMISSIONS: Record<WorkspaceRole, readonly Permission[]> = {
  owner: ALL,
  admin: ADMIN,
  member: MEMBER,
  viewer: VIEWER,
};

export function roleHasPermission(role: WorkspaceRole, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[role];
  return perms.includes(permission);
}

export function roleAtLeast(role: WorkspaceRole, minimum: WorkspaceRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minimum];
}
