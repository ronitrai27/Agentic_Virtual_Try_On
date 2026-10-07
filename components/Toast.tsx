"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Sparkles, CheckCircle2, Info, X } from "lucide-react";

interface ToastMessage {
  id: string;
  message: string;
  type?: "info" | "success" | "sparkles";
}

interface ToastContextType {
  showToast: (message: string, type?: "info" | "success" | "sparkles") => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (message: string, type: "info" | "success" | "sparkles" = "info") => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    },
    [],
  );

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Center-Top Toast Container */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col items-center gap-2 select-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center gap-2.5 px-4 py-2 bg-white text-black font-inter text-xs font-medium rounded-lg shadow-xl border border-neutral-300 backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-3 duration-200"
          >
            {toast.type === "sparkles" ? (
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            ) : toast.type === "success" ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            )}
            <span className="leading-none">{toast.message}</span>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="ml-1 p-0.5 text-neutral-400 hover:text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
