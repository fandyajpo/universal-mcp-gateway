import { createRequire } from "module";
import { join, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(__filename, "..", "..", "..", "..");

export async function createWorkspaceData(workspaceDef, userMap) {
  const now = new Date();
  const members = [];

  for (const m of workspaceDef.members) {
    const user = userMap.get(m.userId);
    if (!user) continue;
    members.push({
      userId: String(user._id),
      role: m.role,
      joinedAt: now,
    });
  }

  return {
    tenantId: workspaceDef.slug,
    name: workspaceDef.name,
    slug: workspaceDef.slug,
    description: workspaceDef.description,
    ownerId: String(userMap.get(workspaceDef.members[0].userId)._id),
    memberCount: members.length,
    plan: workspaceDef.plan,
    isActive: true,
    members,
    settings: workspaceDef.settings || {},
    createdAt: now,
    updatedAt: now,
  };
}
