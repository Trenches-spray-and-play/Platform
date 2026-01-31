// Simple toast notification utility
// Can be swapped with react-hot-toast or sonner later

type ToastType = "success" | "error" | "info" | "warning";

interface ToastOptions {
  duration?: number;
  position?: "top" | "bottom";
}

// Event system for toast notifications
const toastListeners: Array<(message: string, type: ToastType, options?: ToastOptions) => void> = [];

export const toast = {
  /**
   * Show a success toast
   */
  success: (message: string, options?: ToastOptions) => {
    console.log("✅ Toast Success:", message);
    toastListeners.forEach((listener) => listener(message, "success", options));
  },

  /**
   * Show an error toast
   */
  error: (message: string, options?: ToastOptions) => {
    console.error("❌ Toast Error:", message);
    toastListeners.forEach((listener) => listener(message, "error", options));
  },

  /**
   * Show an info toast
   */
  info: (message: string, options?: ToastOptions) => {
    console.log("ℹ️ Toast Info:", message);
    toastListeners.forEach((listener) => listener(message, "info", options));
  },

  /**
   * Show a warning toast
   */
  warning: (message: string, options?: ToastOptions) => {
    console.warn("⚠️ Toast Warning:", message);
    toastListeners.forEach((listener) => listener(message, "warning", options));
  },

  /**
   * Subscribe to toast notifications
   * Returns unsubscribe function
   */
  subscribe: (listener: (message: string, type: ToastType, options?: ToastOptions) => void) => {
    toastListeners.push(listener);
    return () => {
      const index = toastListeners.indexOf(listener);
      if (index > -1) {
        toastListeners.splice(index, 1);
      }
    };
  },
};

// Export type for components
export type { ToastType, ToastOptions };
