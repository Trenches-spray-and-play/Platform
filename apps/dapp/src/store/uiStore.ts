import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface UIState {
    // Modals
    activeModal: string | null;
    modalData: any;
    openModal: (name: string, data?: any) => void;
    closeModal: () => void;

    // Toasts
    toasts: Toast[];
    addToast: (message: string, type?: ToastType, duration?: number) => void;
    removeToast: (id: string) => void;

    // Loading
    globalLoading: boolean;
    setGlobalLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>()(
    devtools(
        (set, get) => ({
            activeModal: null,
            modalData: null,
            openModal: (name, data = null) => set({ activeModal: name, modalData: data }, false, 'openModal'),
            closeModal: () => set({ activeModal: null, modalData: null }, false, 'closeModal'),

            toasts: [],
            addToast: (message, type = 'info', duration = 5000) => {
                const id = crypto.randomUUID();
                const newToast: Toast = { id, message, type };

                set((state) => ({
                    toasts: [...state.toasts, newToast]
                }), false, 'addToast');

                if (duration > 0) {
                    setTimeout(() => {
                        get().removeToast(id);
                    }, duration);
                }
            },
            removeToast: (id) => set((state) => ({
                toasts: state.toasts.filter(t => t.id !== id)
            }), false, 'removeToast'),

            globalLoading: false,
            setGlobalLoading: (loading) => set({ globalLoading: loading }, false, 'setGlobalLoading'),
        }),
        { name: 'UI Store' }
    )
);
