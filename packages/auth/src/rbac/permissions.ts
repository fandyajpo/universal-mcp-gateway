export const PERMISSIONS = [
  "workspace:read",
  "workspace:write",
  "workspace:delete",
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
] as const;

export type Permission = (typeof PERMISSIONS)[number];
