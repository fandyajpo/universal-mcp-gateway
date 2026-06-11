import { create } from "zustand";

interface LayoutState {
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
}

export const useLayoutStore = create<LayoutState>()((set) => ({
  mobileSidebarOpen: false,
  setMobileSidebarOpen: (open: boolean): void => {
    set({ mobileSidebarOpen: open });
  },
}));
