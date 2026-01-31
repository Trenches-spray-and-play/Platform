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

// Base store configuration
const storeConfig = (set: any) => ({
    user: null as User | null,
    wallet: null as Wallet | null,
    isConnected: false,
    setUser: (user: User | null) => set({ user }, false, 'setUser'),
    setWallet: (wallet: Wallet | null) => set({ wallet, isConnected: !!wallet }, false, 'setWallet'),
    disconnect: () => set({ user: null, wallet: null, isConnected: false }, false, 'disconnect'),
});

// Create store based on environment
const isDev = process.env.NODE_ENV === 'development';

export const useAuthStore = isDev
    ? create<AuthState>()(
        devtools(
            persist(storeConfig, { name: 'auth-storage' }),
            { name: 'Auth Store' }
        )
    )
    : create<AuthState>()(
        persist(storeConfig, { name: 'auth-storage' })
    );
