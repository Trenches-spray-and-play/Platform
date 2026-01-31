"use client";

import { useUIStore } from "@/store/uiStore";
import styles from "./ToastContainer.module.css";

export default function ToastContainer() {
    const toasts = useUIStore((state) => state.toasts);
    const removeToast = useUIStore((state) => state.removeToast);

    if (toasts.length === 0) return null;

    return (
        <div className={styles.container}>
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`${styles.toast} ${styles[toast.type]}`}
                    onClick={() => removeToast(toast.id)}
                >
                    <span className={styles.icon}>
                        {toast.type === 'success' && '✓'}
                        {toast.type === 'error' && '✕'}
                        {toast.type === 'info' && '◈'}
                        {toast.type === 'warning' && '⚠'}
                    </span>
                    <span className={styles.message}>{toast.message}</span>
                    <button className={styles.closeBtn}>×</button>
                </div>
            ))}
        </div>
    );
}
