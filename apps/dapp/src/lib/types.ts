// ============================================
// Type Definitions (No Zod dependency)
// These can be imported without bundling Zod
// ============================================

export type CampaignLevel = 'RAPID' | 'MID' | 'DEEP';
export type Chain = 'ethereum' | 'base' | 'arbitrum' | 'bsc' | 'hyperevm' | 'solana';
export type CampaignPhase = 'WAITLIST' | 'ACCEPTING' | 'LIVE' | 'PAUSED';

export interface Campaign {
    id: string;
    name: string;
    tokenSymbol: string;
    tokenAddress: string;
    tokenDecimals?: number;
    chainId: number;
    chainName: string;
    roiMultiplier: string;
    reserveCachedBalance?: string | null;
    trenchIds: string[];
    phase?: CampaignPhase;
    startsAt?: string | null;
    isPaused: boolean;
    participantCount?: number;
    isActive: boolean;
    currentPrice?: string;
    endPrice?: string;
    level?: CampaignLevel;
    entryRange?: { min: number; max: number };
}

export interface User {
    id: string;
    handle: string;
    balance: string;
    beliefScore?: number;
    boostPoints?: number;
    stats?: { referrals: number };
    walletEvm?: string | null;
    walletSol?: string | null;
    referralCode?: string;
}

export interface SprayRequest {
    trenchId: string;
    amount: number;
    level: CampaignLevel;
    useAutoBoost?: boolean;
}

export interface UserUpdate {
    handle?: string;
    walletEvm?: string;
    walletSol?: string;
}

export interface UserPosition {
    id: string;
    type: 'active' | 'secured' | 'enlisted';
    trenchId?: string;
    trenchName?: string;
    trenchLevel?: string;
    status: string;
    joinedAt?: string;
    entryAmount?: number;
    maxPayout?: number;
    roiMultiplier?: number;
    expectedPayoutAt?: string;
    formattedCountdown?: string;
    remainingTime?: {
        days: number;
        hours: number;
        minutes: number;
        isReady: boolean;
    };
    queueNumber?: number | null;
    autoBoostEnabled?: boolean;
    autoBoostPaused?: boolean;
    campaignName?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}
