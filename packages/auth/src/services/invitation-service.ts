import { randomBytes, createHash } from "node:crypto";

import { sendInvitationEmail } from "../emails/invitation-email";
import type { RBACService } from "../rbac/service";
import { WorkspaceModel, InvitationModel } from "@repo/database";
import type { InvitationRepository, UserRepository, WorkspaceRepository, IInvitation } from "@repo/database";
import { createLogger } from "@repo/logger";
import { WorkspaceRole } from "@repo/types";

const logger = createLogger("@repo/auth:invitation-service");

export interface InvitationServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface InvitationServiceMethods {
  create(data: {
    workspaceId: string;
    workspaceName: string;
    inviterId: string;
    inviteeEmail: string;
    role: string;
    message?: string;
  }): Promise<InvitationServiceResult<IInvitation>>;
  accept(token: string, userId: string): Promise<InvitationServiceResult<void>>;
  decline(token: string): Promise<InvitationServiceResult<void>>;
  resend(token: string, userId: string): Promise<InvitationServiceResult<void>>;
  cancel(invitationId: string, userId: string): Promise<InvitationServiceResult<void>>;
  list(
    workspaceId: string,
    userId: string,
    filters?: { status?: string; skip?: number; limit?: number },
  ): Promise<InvitationServiceResult<{ invitations: IInvitation[]; total: number }>>;
  getByToken(token: string): Promise<InvitationServiceResult<IInvitation>>;
}

export function createInvitationService(
  invitationRepo: InvitationRepository,
  workspaceRepo: WorkspaceRepository,
  userRepo: UserRepository,
  rbacService: RBACService,
): InvitationServiceMethods {
  const MAX_INVITATIONS_PER_DAY = 20;
  const INVITATION_TTL_DAYS = 7;

  function generateToken(): string {
    return randomBytes(32).toString("hex");
  }

  function hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  async function create(data: {
    workspaceId: string;
    workspaceName: string;
    inviterId: string;
    inviteeEmail: string;
    role: string;
    message?: string;
  }): Promise<InvitationServiceResult<IInvitation>> {
    try {
      const validRoles: readonly string[] = Object.values(WorkspaceRole);
      if (!validRoles.includes(data.role)) {
        return { success: false, error: "Invalid role", code: "VALIDATION_ERROR" };
      }

      const isAdmin = await rbacService.hasRole(data.inviterId, data.workspaceId, "admin");
      if (!isAdmin) {
        return { success: false, error: "Only admins can invite members", code: "FORBIDDEN" };
      }

      const workspace = await workspaceRepo.withoutTenantScope().findById(data.workspaceId);
      if (!workspace) {
        return { success: false, error: "Workspace not found", code: "NOT_FOUND" };
      }

      const existingUser = await userRepo.findByEmail(data.inviteeEmail);
      if (existingUser) {
        const targetUserId = (existingUser as unknown as { _id: string })._id;
        const alreadyMember = workspace.members?.some(
          (m) => m.userId === targetUserId && !m.deletedAt,
        );
        if (alreadyMember) {
          return { success: false, error: "User is already a member of this workspace", code: "CONFLICT" };
        }
      }

      const existingPending = await invitationRepo.findOne({
        workspaceId: data.workspaceId,
        inviteeEmail: data.inviteeEmail,
        status: "pending",
      });
      if (existingPending) {
        return { success: false, error: "An invitation has already been sent to this email", code: "CONFLICT" };
      }

      const todayCount = await invitationRepo.countByWorkspaceToday(data.workspaceId);
      if (todayCount >= MAX_INVITATIONS_PER_DAY) {
        return {
          success: false,
          error: "Daily invitation limit reached (max 20 per day)",
          code: "RATE_LIMITED",
        };
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + INVITATION_TTL_DAYS);

      const rawToken = generateToken();
      const hashedToken = hashToken(rawToken);

      const invitation = await invitationRepo.create({
        workspaceId: data.workspaceId,
        workspaceName: data.workspaceName,
        inviterId: data.inviterId,
        inviteeEmail: data.inviteeEmail,
        role: data.role as (typeof WorkspaceRole)[keyof typeof WorkspaceRole],
        token: hashedToken,
        message: data.message,
        status: "pending",
        expiresAt,
      });

      try {
        sendInvitationEmail({
          to: data.inviteeEmail,
          inviterName: "A workspace admin",
          workspaceName: data.workspaceName,
          role: data.role,
          token: rawToken,
          message: data.message,
        });
      } catch (emailError) {
        logger.warn({ error: emailError, invitationId: (invitation as unknown as { _id: string })._id }, "failed to send invitation email");
      }

      logger.info({ workspaceId: data.workspaceId, inviteeEmail: data.inviteeEmail, inviterId: data.inviterId }, "invitation created");
      return { success: true, data: { ...invitation, token: rawToken } };
    } catch (error) {
      logger.error({ error, workspaceId: data.workspaceId }, "invitation creation failed");
      return { success: false, error: "Failed to create invitation", code: "INTERNAL_ERROR" };
    }
  }

  async function getByToken(token: string): Promise<InvitationServiceResult<IInvitation>> {
    try {
      const invitation = await invitationRepo.findByToken(token);
      if (!invitation) {
        return { success: false, error: "Invitation not found", code: "NOT_FOUND" };
      }

      if (invitation.status === "pending" && invitation.expiresAt < new Date()) {
        await invitationRepo.updateStatus(
          (invitation as unknown as { _id: string })._id,
          "expired",
        );
        invitation.status = "expired";
      }

      return { success: true, data: { ...invitation, token } };
    } catch (error) {
      logger.error({ error, token: token.slice(0, 8) }, "failed to get invitation by token");
      return { success: false, error: "Failed to get invitation", code: "INTERNAL_ERROR" };
    }
  }

  async function accept(token: string, userId: string): Promise<InvitationServiceResult<void>> {
    try {
      const hashedToken = hashToken(token);
      const invitation = await invitationRepo.findByToken(token);
      if (!invitation) {
        return { success: false, error: "Invitation not found", code: "NOT_FOUND" };
      }

      if (invitation.expiresAt < new Date()) {
        const invitationId = (invitation as unknown as { _id: string })._id;
        await invitationRepo.updateStatus(invitationId, "expired");
        return { success: false, error: "Invitation has expired", code: "BAD_REQUEST" };
      }

      const user = await userRepo.findById(userId);
      if (!user) {
        return { success: false, error: "User not found", code: "NOT_FOUND" };
      }

      const userEmail = (user as unknown as { email: string }).email;
      if (userEmail.toLowerCase() !== invitation.inviteeEmail.toLowerCase()) {
        return {
          success: false,
          error: "This invitation was sent to a different email address",
          code: "FORBIDDEN",
        };
      }

      const workspace = await workspaceRepo.withoutTenantScope().findById(invitation.workspaceId);
      if (!workspace) {
        return { success: false, error: "Workspace not found", code: "NOT_FOUND" };
      }

      const alreadyMember = workspace.members?.some(
        (m) => m.userId === userId && !m.deletedAt,
      );
      if (alreadyMember) {
        return { success: false, error: "You are already a member of this workspace", code: "CONFLICT" };
      }

      const claimed = await InvitationModel.findOneAndUpdate(
        { _id: (invitation as unknown as { _id: string })._id, status: "pending" },
        { $set: { status: "accepted", acceptedAt: new Date(), token: hashedToken } },
        { new: true },
      ).lean();

      if (!claimed) {
        return { success: false, error: "Invitation has already been accepted", code: "CONFLICT" };
      }

      const entry = {
        userId,
        role: invitation.role,
        joinedAt: new Date(),
      };

      await WorkspaceModel.updateOne(
        { _id: invitation.workspaceId, "members.userId": { $ne: userId } },
        { $push: { members: entry }, $inc: { memberCount: 1 } },
      );

      logger.info({ workspaceId: invitation.workspaceId, userId }, "invitation accepted");
      return { success: true };
    } catch (error) {
      logger.error({ error, token: token.slice(0, 8) }, "invitation acceptance failed");
      return { success: false, error: "Failed to accept invitation", code: "INTERNAL_ERROR" };
    }
  }

  async function decline(token: string): Promise<InvitationServiceResult<void>> {
    try {
      const hashedToken = hashToken(token);
      const claimed = await InvitationModel.findOneAndUpdate(
        { token: hashedToken, status: "pending" },
        { $set: { status: "declined", declinedAt: new Date() } },
      ).lean();

      if (!claimed) {
        const existing = await invitationRepo.findByToken(token);
        if (!existing) {
          return { success: false, error: "Invitation not found", code: "NOT_FOUND" };
        }
        return { success: false, error: `Invitation is ${existing.status}, not pending`, code: "BAD_REQUEST" };
      }

      logger.info({ workspaceId: (claimed as unknown as { workspaceId: string }).workspaceId }, "invitation declined");
      return { success: true };
    } catch (error) {
      logger.error({ error, token: token.slice(0, 8) }, "invitation decline failed");
      return { success: false, error: "Failed to decline invitation", code: "INTERNAL_ERROR" };
    }
  }

  async function resend(token: string, userId: string): Promise<InvitationServiceResult<void>> {
    try {
      const invitation = await invitationRepo.findByToken(token);
      if (!invitation) {
        return { success: false, error: "Invitation not found", code: "NOT_FOUND" };
      }

      const isAdmin = await rbacService.hasRole(userId, invitation.workspaceId, "admin");
      if (!isAdmin) {
        return { success: false, error: "Only admins can resend invitations", code: "FORBIDDEN" };
      }

      if (invitation.status !== "pending") {
        return { success: false, error: `Cannot resend a ${invitation.status} invitation`, code: "BAD_REQUEST" };
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + INVITATION_TTL_DAYS);

      const rawToken = generateToken();
      const hashedToken = hashToken(rawToken);

      const invitationId = (invitation as unknown as { _id: string })._id;
      await invitationRepo.updateStatus(invitationId, "pending", {
        expiresAt,
        token: hashedToken,
      });

      try {
        sendInvitationEmail({
          to: invitation.inviteeEmail,
          inviterName: "A workspace admin",
          workspaceName: invitation.workspaceName,
          role: invitation.role,
          token: rawToken,
        });
      } catch (emailError) {
        logger.warn({ error: emailError, token }, "failed to resend invitation email");
      }

      logger.info({ workspaceId: invitation.workspaceId, token }, "invitation resent");
      return { success: true };
    } catch (error) {
      logger.error({ error, token }, "invitation resend failed");
      return { success: false, error: "Failed to resend invitation", code: "INTERNAL_ERROR" };
    }
  }

  async function cancel(invitationId: string, userId: string): Promise<InvitationServiceResult<void>> {
    try {
      const invitation = await invitationRepo.findById(invitationId);
      if (!invitation) {
        return { success: false, error: "Invitation not found", code: "NOT_FOUND" };
      }

      const isAdmin = await rbacService.hasRole(userId, invitation.workspaceId, "admin");
      if (!isAdmin) {
        return { success: false, error: "Only admins can cancel invitations", code: "FORBIDDEN" };
      }

      await invitationRepo.updateStatus(invitationId, "cancelled", {
        cancelledAt: new Date(),
      });

      logger.info({ invitationId, workspaceId: invitation.workspaceId }, "invitation cancelled");
      return { success: true };
    } catch (error) {
      logger.error({ error, invitationId }, "invitation cancellation failed");
      return { success: false, error: "Failed to cancel invitation", code: "INTERNAL_ERROR" };
    }
  }

  async function list(
    workspaceId: string,
    userId: string,
    filters?: { status?: string; skip?: number; limit?: number },
  ): Promise<InvitationServiceResult<{ invitations: IInvitation[]; total: number }>> {
    try {
      const isMember = await rbacService.hasRole(userId, workspaceId, "member");
      if (!isMember) {
        return { success: false, error: "Only workspace members can view invitations", code: "FORBIDDEN" };
      }

      const result = await invitationRepo.findByWorkspace(workspaceId, filters);

      return { success: true, data: result };
    } catch (error) {
      logger.error({ error, workspaceId }, "failed to list invitations");
      return { success: false, error: "Failed to list invitations", code: "INTERNAL_ERROR" };
    }
  }

  return {
    create,
    getByToken,
    accept,
    decline,
    resend,
    cancel,
    list,
  };
}

export type InvitationService = InvitationServiceMethods;
