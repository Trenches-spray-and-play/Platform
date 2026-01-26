export interface PeerPost {
    id: string;
    author: string;
    content: string;
    platform: 'X' | 'Farcaster';
    timestamp: string;
}

export const MOCK_PEER_POSTS: PeerPost[] = [
    { id: 'p1', author: '@crypto_chad', content: 'Just sprayed 10k $BLT into the rapid trench! #SprayAndPray 🚀', platform: 'X', timestamp: '2m ago' },
    { id: 'p2', author: '@wagmi_girl', content: 'The belief score system is genius. Climbing the ranks! ⚡', platform: 'Farcaster', timestamp: '5m ago' },
    { id: 'p3', author: '@degen_dave', content: 'Who else is waiting for the payout round? #Trenches', platform: 'X', timestamp: '12m ago' },
];

export interface Participant {
    id: string;
    handle: string;
    beliefScore: number;
    boostPoints: number; // NEW: For task completion
    entryAmount: number;
    timeAgo: string;
    status: 'active' | 'pending' | 'exited' | 'liquidated';
    isTurn?: boolean;
}

export interface TrenchData {
    id: string;
    name: string;
    level: 'RAPID' | 'MID' | 'DEEP';
    minEntry: number;  // BLT
    maxEntry: number;  // BLT
    entrySize: string; // Display string
    roiCap: string;
    roiMultiplier: number; // NEW: For calculation (1.1, 1.3, 1.5)
    cadence: string;
    reserves: string;
    participants: Participant[];
}

// NEW: Social validation interfaces
export interface PostSubmission {
    id: string;
    userId: string;
    platform: 'X' | 'Farcaster' | 'Telegram';
    postUrl: string;
    timestamp: string;
    trenchId: string;
}

export interface ValidationRecord {
    id: string;
    validatorId: string;
    postId: string;
    qualityRating: 1 | 2 | 3 | 4 | 5;
    viewRange: '<100' | '100-500' | '500-1k' | '1k-5k' | '5k+';
    engagementProof?: {
        liked: boolean;
        commented: boolean;
        proofLinks: string[];
    };
    timestamp: string;
}

export interface UserProfile {
    id: string;
    handle: string;
    walletAddress: string;
    boostPoints: number;
    beliefScore: number;
    socialLinks: { platform: string; url: string }[];
    postSubmissions: PostSubmission[];
}

// Remove USD pricing
export const BLT_CONTRACT_ADDRESS = "0xFEF20Fd2422a9d47Fe1a8C355A1AE83F04025EDF";
export const MOCK_WALLET_ADDRESS = "0x7a2...3f9c";

export const MOCK_TRENCHES: Record<string, TrenchData> = {
    'RAPID': {
        id: 'rapid-1',
        name: 'RAPID TRENCH',
        level: 'RAPID',
        minEntry: 1000,
        maxEntry: 40000,
        entrySize: '1K - 40K',
        roiCap: '1.1x',
        roiMultiplier: 1.1,
        cadence: 'NO WAIT',
        reserves: '500K',
        participants: [
            { id: '1', handle: '@cryptoknight', beliefScore: 920, boostPoints: 150, entryAmount: 20000, timeAgo: '2m', status: 'active', isTurn: true },
            { id: '2', handle: '@wagmi_girl', beliefScore: 880, boostPoints: 200, entryAmount: 15000, timeAgo: '5m', status: 'active' },
            { id: '3', handle: '@solanarunner', beliefScore: 750, boostPoints: 100, entryAmount: 10000, timeAgo: '12m', status: 'pending' },
            { id: '4', handle: '@paperhands', beliefScore: 400, boostPoints: 50, entryAmount: 5000, timeAgo: '45m', status: 'exited' },
        ]
    },
    'MID': {
        id: 'mid-1',
        name: 'MID TRENCH',
        level: 'MID',
        minEntry: 1000,
        maxEntry: 200000,
        entrySize: '1K - 200K',
        roiCap: '1.3x',
        roiMultiplier: 1.3,
        cadence: '3 DAYS',
        reserves: '1.2M',
        participants: [
            { id: '5', handle: '@diamond_hands', beliefScore: 1200, boostPoints: 300, entryAmount: 100000, timeAgo: '15m', status: 'active' },
            { id: '6', handle: '@alpha_seeker', beliefScore: 1100, boostPoints: 250, entryAmount: 75000, timeAgo: '22m', status: 'active' },
        ]
    },
    'DEEP': {
        id: 'deep-1',
        name: 'DEEP TRENCH',
        level: 'DEEP',
        minEntry: 1000,
        maxEntry: 2000000,
        entrySize: '1K - 2M',
        roiCap: '1.5x',
        roiMultiplier: 1.5,
        cadence: '7 DAYS',
        reserves: '5M',
        participants: [
            { id: '7', handle: '@whale_watcher', beliefScore: 5000, boostPoints: 500, entryAmount: 500000, timeAgo: '1h', status: 'active' },
        ]
    }
};

export interface Task {
    id: string;
    title: string;
    reward: number; // Boost Points Reward
    status: 'pending' | 'completed';
    link?: string;
}

export const MOCK_TASKS: Task[] = [
    { id: 't1', title: 'CONNECT X (TWITTER)', reward: 500, status: 'completed', link: '#' },
    { id: 't2', title: 'JOIN TELEGRAM TRENCH', reward: 200, status: 'pending', link: '#' },
    { id: 't3', title: 'AMPLIFY LAUNCH TWEET', reward: 100, status: 'pending', link: '#' },
    { id: 't4', title: 'ADD ⚡ TO BIO', reward: 300, status: 'pending', link: '#' },
];

// Helper function for entry cap unlocking (doubles per tier)
export const getMaxAllowedEntry = (beliefScore: number, trenchMax: number): number => {
    if (beliefScore >= 1000) return trenchMax * 4; // 4x for highest tier
    if (beliefScore >= 500) return trenchMax * 2;  // 2x for mid tier
    return trenchMax; // Base max for low tier
};
