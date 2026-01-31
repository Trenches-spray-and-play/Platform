import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface UIState {
    activeModal: string | null;
    modalData: any;
    openModal: (name: string, data?: any) => void;
    closeModal: () => void;
    toasts: Toast[];
    addToast: (message: string, type?: ToastType, duration?: number) => void;
    removeToast: (id: string) => void;
    globalLoading: boolean;
    setGlobalLoading: (loading: boolean) => void;
}

// Base store configuration
const storeConfig = (set: any, get: any) => ({
    activeModal: null as string | null,
    modalData: null,
    openModal: (name: string, data = null) => set({ activeModal: name, modalData: data }, false, 'openModal'),
    closeModal: () => set({ activeModal: null, modalData: null }, false, 'closeModal'),

    toasts: [] as Toast[],
    addToast: (message: string, type: ToastType = 'info', duration = 5000) => {
        const id = crypto.randomUUID();
        const newToast: Toast = { id, message, type };

        set((state: UIState) => ({
            toasts: [...state.toasts, newToast]
        }), false, 'addToast');

        if (duration > 0) {
            setTimeout(() => {
                get().removeToast(id);
            }, duration);
        }
    },
    removeToast: (id: string) => set((state: UIState) => ({
        toasts: state.toasts.filter(t => t.id !== id)
    }), false, 'removeToast'),

    globalLoading: false,
    setGlobalLoading: (loading: boolean) => set({ globalLoading: loading }, false, 'setGlobalLoading'),
});

// Create store based on environment
const isDev = process.env.NODE_ENV === 'development';

export const useUIStore = isDev
    ? create<UIState>()(devtools(storeConfig, { name: 'UI Store' }))
    : create<UIState>()(storeConfig);
