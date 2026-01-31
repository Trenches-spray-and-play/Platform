"use client";

import { useEffect, useState, useCallback } from "react";
import { toast, ToastType, ToastOptions } from "@/lib/toast";
import styles from "./ToastContainer.module.css";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  options?: ToastOptions;
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const unsubscribe = toast.subscribe((message, type, options) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = { id, message, type, options };
      
      setToasts((prev) => [...prev, newToast]);

      // Auto-remove after duration (default 4s)
      const duration = options?.duration ?? 4000;
      setTimeout(() => {
        removeToast(id);
      }, duration);
    });

    return unsubscribe;
  }, [removeToast]);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      default:
        return "•";
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className={styles.container}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${styles.toast} ${styles[t.type]}`}
          role="alert"
        >
          <span className={styles.icon}>{getIcon(t.type)}</span>
          <span className={styles.message}>{t.message}</span>
          <button
            className={styles.close}
            onClick={() => removeToast(t.id)}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
