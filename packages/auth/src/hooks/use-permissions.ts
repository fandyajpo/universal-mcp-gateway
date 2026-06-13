"use client";

import { useCallback } from "react";

import { create } from "zustand";

interface PermissionsState {
  permissions: Record<string, boolean>;
  isLoading: boolean;
  error: string | null;
  setPermissions: (permissions: Record<string, boolean>) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const usePermissionsStore = create<PermissionsState>()((set) => ({
  permissions: {},
  isLoading: true,
  error: null,
  setPermissions: (permissions: Record<string, boolean>): void => {
    set({ permissions, isLoading: false, error: null });
  },
  setLoading: (isLoading: boolean): void => {
    set({ isLoading });
  },
  setError: (error: string | null): void => {
    set({ error, isLoading: false });
  },
  reset: (): void => {
    set({ permissions: {}, isLoading: true, error: null });
  },
}));

export function usePermissions(): { can: (permission: string) => boolean; isLoading: boolean; error: string | null } {
  const isLoading: boolean = usePermissionsStore((state) => state.isLoading);
  const error: string | null = usePermissionsStore((state) => state.error);
  const permissions: Record<string, boolean> = usePermissionsStore((state) => state.permissions);

  const can = useCallback(
    (permission: string): boolean => {
      return permissions[permission] ?? false;
    },
    [permissions],
  );

  return { can, isLoading, error };
}

export function useSetPermissions(): {
  setPermissions: (permissions: Record<string, boolean>) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
} {
  const setPermissions: (permissions: Record<string, boolean>) => void = usePermissionsStore((state) => state.setPermissions);
  const setLoading: (isLoading: boolean) => void = usePermissionsStore((state) => state.setLoading);
  const setError: (error: string | null) => void = usePermissionsStore((state) => state.setError);
  const reset: () => void = usePermissionsStore((state) => state.reset);

  return { setPermissions, setLoading, setError, reset };
}
