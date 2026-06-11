import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LayoutState {
  sidebarCollapsed: boolean;
  rightPanelOpen: boolean;
  mobileSidebarOpen: boolean;
  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleRightPanel: () => void;
  setRightPanelOpen: (open: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      rightPanelOpen: false,
      mobileSidebarOpen: false,
      toggleSidebarCollapsed: (): void => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },
      setSidebarCollapsed: (collapsed: boolean): void => {
        set({ sidebarCollapsed: collapsed });
      },
      toggleRightPanel: (): void => {
        set((state) => ({ rightPanelOpen: !state.rightPanelOpen }));
      },
      setRightPanelOpen: (open: boolean): void => {
        set({ rightPanelOpen: open });
      },
      setMobileSidebarOpen: (open: boolean): void => {
        set({ mobileSidebarOpen: open });
      },
    }),
    {
      name: "layout-store",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        rightPanelOpen: state.rightPanelOpen,
      }),
    },
  ),
);
