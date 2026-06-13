"use client";

import { useQuery } from "@tanstack/react-query";

interface Workspace {
  _id: string;
  name: string;
  slug: string;
  avatar?: string;
  memberCount: number;
  ownerId: string;
}

interface WorkspacesResponse {
  data: Workspace[] | null;
  error: string | null;
}

export function useUserWorkspaces(): {
  workspaces: Workspace[] | undefined;
  isLoading: boolean;
  error: string | null;
} {
  const { data, isLoading, error } = useQuery<WorkspacesResponse>({
    queryKey: ["user-workspaces"],
    queryFn: async () => {
      const response = await fetch("/api/workspaces");
      if (!response.ok) {
        throw new Error("Failed to fetch workspaces");
      }
      return response.json() as Promise<WorkspacesResponse>;
    },
  });

  return {
    workspaces: data?.data ?? undefined,
    isLoading,
    error: error instanceof Error ? error.message : (data?.error ?? null),
  };
}
