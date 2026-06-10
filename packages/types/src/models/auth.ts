import type { WorkspaceRole } from "../enums";
import type { UserId, WorkspaceId } from "../types/branded";

export interface User {
  id: UserId;
  email: string;
  name: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: UserId;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface Workspace {
  id: WorkspaceId;
  name: string;
  slug: string;
  ownerId: UserId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMember {
  userId: UserId;
  workspaceId: WorkspaceId;
  role: WorkspaceRole;
  joinedAt: Date;
}
