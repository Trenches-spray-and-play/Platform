import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

interface User {
    id: string;
    handle: string;
    balance: string;
    beliefScore: number;
    boostPoints: number;
}

interface Wallet {
    address: string;
    chain: string;
    type: 'evm' | 'solana';
}

interface AuthState {
    user: User | null;
    wallet: Wallet | null;
    isConnected: boolean;
    setUser: (user: User | null) => void;
    setWallet: (wallet: Wallet | null) => void;
    disconnect: () => void;
}

export const useAuthStore = create<AuthState>()(
    devtools(
        persist(
            (set) => ({
                user: null,
                wallet: null,
                isConnected: false,
                setUser: (user) => set({ user }, false, 'setUser'),
                setWallet: (wallet) => set({ wallet, isConnected: !!wallet }, false, 'setWallet'),
                disconnect: () => set({ user: null, wallet: null, isConnected: false }, false, 'disconnect'),
            }),
            {
                name: 'auth-storage',
            }
        ),
        { name: 'Auth Store' }
    )
);
