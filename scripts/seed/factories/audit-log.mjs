import { randomBytes } from "crypto";

const ACTIONS = [
  "workspace.created",
  "workspace.updated",
  "workspace.member.added",
  "workspace.member.removed",
  "workspace.member.role_changed",
  "document.uploaded",
  "document.deleted",
  "document.viewed",
  "document.processed",
  "api_key.created",
  "api_key.revoked",
  "connector.installed",
  "connector.uninstalled",
  "connector.sync_started",
  "connector.sync_completed",
  "connector.sync_failed",
  "settings.updated",
  "auth.login",
  "auth.login_failed",
  "auth.logout",
  "invitation.sent",
  "invitation.accepted",
  "invitation.declined",
  "invitation.cancelled",
];

const ENTITY_TYPES = [
  "workspace",
  "document",
  "api_key",
  "connector",
  "invitation",
  "member",
  "settings",
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysAgo) {
  const now = Date.now();
  const past = now - daysAgo * 86400000;
  return new Date(past + Math.random() * (now - past));
}

export function createAuditLogEntries(count, workspaceId, userIds) {
  const entries = [];

  for (let i = 0; i < count; i++) {
    const action = pick(ACTIONS);
    const entityType = pick(ENTITY_TYPES);
    const userId = pick(userIds);
    const createdAt = randomDate(30);

    entries.push({
      tenantId: workspaceId,
      userId,
      action,
      entityType,
      entityId: randomBytes(24).toString("hex"),
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) SeedScript/1.0",
      metadata: { source: "seed" },
      createdAt,
      updatedAt: createdAt,
    });
  }

  entries.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  return entries;
}
