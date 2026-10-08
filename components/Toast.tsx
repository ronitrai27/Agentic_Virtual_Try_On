"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { Sparkles, CheckCircle2, Info, X, Loader2, AlertCircle } from "lucide-react";

export type ToastType = "info" | "success" | "sparkles" | "loading" | "error";

interface ToastMessage {
  id: string;
  message: string;
  type?: ToastType;
}

interface ToastOptions {
  message?: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => string;
  updateToast: (id: string, options: ToastOptions) => void;
  removeToast: (id: string) => void;
  promiseToast: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error?: string | ((err: any) => string);
    }
  ) => Promise<T>;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timersRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const removeToast = useCallback((id: string) => {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration = 3000): string => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);

      if (type !== "loading") {
        timersRef.current[id] = setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const updateToast = useCallback(
    (id: string, options: ToastOptions) => {
      if (timersRef.current[id]) {
        clearTimeout(timersRef.current[id]);
        delete timersRef.current[id];
      }

      setToasts((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                message: options.message !== undefined ? options.message : t.message,
                type: options.type !== undefined ? options.type : t.type,
              }
            : t
        )
      );

      const finalType = options.type;
      if (finalType !== "loading") {
        const duration = options.duration ?? 3000;
        timersRef.current[id] = setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const promiseToast = useCallback(
    async <T,>(
      promise: Promise<T>,
      messages: {
        loading: string;
        success: string | ((data: T) => string);
        error?: string | ((err: any) => string);
      }
    ): Promise<T> => {
      const id = showToast(messages.loading, "loading");
      try {
        const result = await promise;
        const successMsg =
          typeof messages.success === "function" ? messages.success(result) : messages.success;
        updateToast(id, { message: successMsg, type: "success" });
        return result;
      } catch (err: any) {
        const errorMsg =
          messages.error !== undefined
            ? typeof messages.error === "function"
              ? messages.error(err)
              : messages.error
            : err?.message || "Something went wrong";
        updateToast(id, { message: errorMsg, type: "error" });
        throw err;
      }
    },
    [showToast, updateToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, updateToast, removeToast, promiseToast }}>
      {children}
      {/* Center-Top Toast Container */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col items-center gap-2 select-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center gap-2.5 px-4 py-3.5 bg-white text-black font-inter text-xs font-medium rounded-md shadow-xl border border-neutral-300 backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-3 duration-200"
          >
            {toast.type === "loading" ? (
              <Loader2 className="w-3.5 h-3.5 text-black animate-spin shrink-0" />
            ) : toast.type === "sparkles" ? (
              <Sparkles className="w-3.5 h-3.5 text-black fill-black shrink-0" />
            ) : toast.type === "success" ? (
              <CheckCircle2 className="w-3.5 h-3.5 fill-black text-white shrink-0" />
            ) : toast.type === "error" ? (
              <AlertCircle className="w-3.5 h-3.5 fill-black text-white shrink-0" />
            ) : (
              <Info className="w-3.5 h-3.5 fill-black text-white shrink-0" />
            )}
            <span className="leading-none">{toast.message}</span>
            {toast.type !== "loading" && (
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="ml-1 p-0.5 text-neutral-400 hover:text-black rounded-full transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
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
