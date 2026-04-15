"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { Toast } from "@/components/ui/toast";

interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
  actionLabel?: string;
  actionHref?: string;
}

interface ToastContextType {
  showToast: (
    message: string,
    type?: "success" | "error" | "warning" | "info",
    duration?: number,
    action?: { label: string; href: string }
  ) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((
    message: string,
    type: "success" | "error" | "warning" | "info" = "error",
    duration = 5000,
    action?: { label: string; href: string }
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [
      ...prev,
      {
        id,
        message,
        type,
        duration,
        actionLabel: action?.label,
        actionHref: action?.href
      }
    ]);
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          actionLabel={toast.actionLabel}
          actionHref={toast.actionHref}
          onClose={() => hideToast(toast.id)}
        />
      ))}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}



