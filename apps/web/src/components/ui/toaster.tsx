"use client";

import { useEffect } from "react";

import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui";
import { useToastStore } from "@/lib/stores/toast";

import type { ReactNode } from "react";

export function useToast(): { toast: (message: { title: string; description?: string; variant?: "default" | "destructive" | "success" }) => void } {
  const store = useToastStore();

  if (process.env.NODE_ENV === "development" && !store.mounted) {
    console.warn("[useToast] called but no Toaster is mounted. Toasts will be queued and displayed when Toaster mounts.");
  }

  return { toast: store.toast };
}

export function Toaster({ children }: { children: ReactNode }): React.ReactElement {
  const mount = useToastStore((s) => s.mount);
  const unmount = useToastStore((s) => s.unmount);
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  useEffect(() => {
    mount();
    return (): void => { unmount(); };
  }, [mount, unmount]);

  return (
    <ToastProvider>
      {children}
      {toasts.map((msg) => (
        <Toast key={msg.id} variant={msg.variant} onOpenChange={(open) => { if (!open) dismiss(msg.id); }}>
          <div className="grid gap-1">
            <ToastTitle>{msg.title}</ToastTitle>
            {msg.description && <ToastDescription>{msg.description}</ToastDescription>}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
