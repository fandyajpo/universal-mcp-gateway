"use client";

import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from "@tanstack/react-query";

import {
  getInvitationsAction,
  cancelInvitationAction,
  resendInvitationAction,
  respondToInvitationAction,
  type InvitationData,
} from "@/actions/workspace/members";

export function useInvitations(workspaceId: string): UseQueryResult<InvitationData[]> {
  return useQuery({
    queryKey: ["invitations", workspaceId],
    queryFn: async () => {
      const result = await getInvitationsAction(workspaceId);
      if (!result.success) {
        throw new Error(result.error ?? "Failed to load invitations");
      }
      return result.invitations ?? [];
    },
    enabled: !!workspaceId,
  });
}

export function useCancelInvitation(workspaceId: string): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const result = await cancelInvitationAction(invitationId, workspaceId);
      if (!result.success) {
        throw new Error(result.error ?? "Failed to cancel invitation");
      }
    },
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: ["invitations", workspaceId] });
    },
  });
}

export function useResendInvitation(workspaceId: string): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const result = await resendInvitationAction(token, workspaceId);
      if (!result.success) {
        throw new Error(result.error ?? "Failed to resend invitation");
      }
    },
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: ["invitations", workspaceId] });
    },
  });
}

export function useRespondToInvitation(): UseMutationResult<void, Error, { token: string; action: "accept" | "decline" }> {
  return useMutation({
    mutationFn: async ({
      token,
      action,
    }: {
      token: string;
      action: "accept" | "decline";
    }) => {
      const result = await respondToInvitationAction(token, action);
      if (!result.success) {
        throw new Error(result.error ?? `Failed to ${action} invitation`);
      }
    },
  });
}
