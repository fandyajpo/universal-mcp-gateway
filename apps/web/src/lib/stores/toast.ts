import { create } from "zustand";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
}

interface ToastStore {
  toasts: ToastMessage[];
  mounted: boolean;
  mount: () => void;
  unmount: () => void;
  toast: (message: Omit<ToastMessage, "id">) => void;
  dismiss: (id: string) => void;
}

const AUTO_DISMISS_MS = 5000;

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  mounted: false,

  mount: (): void => {
    set({ mounted: true });
  },

  unmount: (): void => {
    set({ mounted: false, toasts: [] });
  },

  toast: (message: Omit<ToastMessage, "id">): void => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { ...message, id }] }));
    setTimeout((): void => {
      const current = get();
      if (current.mounted) {
        current.dismiss(id);
      }
    }, AUTO_DISMISS_MS);
  },

  dismiss: (id: string): void => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));
