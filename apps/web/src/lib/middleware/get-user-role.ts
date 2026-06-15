import type { WorkspaceRepository } from "@repo/database";

export type UserRole = "owner" | "admin" | "member" | "viewer";

export function createGetUserRole(workspaceRepo: WorkspaceRepository) {
  return async (userId: string, workspaceId: string): Promise<UserRole | null> => {
    const ws = await workspaceRepo.findById(workspaceId);
    if (!ws) return null;
    if (ws.ownerId === userId) return "owner";
    const member = ws.members?.find((m) => m.userId === userId && !m.deletedAt);
    if (!member) return null;
    return member.role;
  };
}
