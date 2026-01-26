import { prisma } from '@/lib/db';

/**
 * Enforcement Engine
 * 
 * Enforces system laws:
 * - ROI caps
 * - Entry limits based on belief score
 * - Payment timeouts
 * - Round expiry
 */

export interface EnforcementResult {
    allowed: boolean;
    reason?: string;
}

/**
 * Belief Score Tier Configuration
 * Cached for 5 minutes to reduce database lookups during high-volume operations
 */
export interface BeliefTier {
    minScore: number;
    multiplier: number;
}

// Default tiers (fallback if config not available)
export const DEFAULT_BELIEF_TIERS: BeliefTier[] = [
    { minScore: 0, multiplier: 0.5 },
    { minScore: 100, multiplier: 0.75 },
    { minScore: 500, multiplier: 0.9 },
    { minScore: 1000, multiplier: 1.0 },
];

// Cache for belief tiers
let beliefTiersCache: BeliefTier[] | null = null;
let beliefTiersCacheTime: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get belief tiers from config (cached)
 */
export async function getBeliefTiers(): Promise<BeliefTier[]> {
    const now = Date.now();

    // Return cached value if still valid
    if (beliefTiersCache && (now - beliefTiersCacheTime) < CACHE_TTL_MS) {
        return beliefTiersCache;
    }

    try {
        const config = await prisma.platformConfig.findUnique({
            where: { id: 'default' },
        });

        if (config?.beliefTiers) {
            beliefTiersCache = JSON.parse(config.beliefTiers);
            beliefTiersCacheTime = now;
            return beliefTiersCache!;
        }
    } catch (error) {
        console.error('Failed to fetch belief tiers from config:', error);
    }

    // Fallback to defaults
    beliefTiersCache = DEFAULT_BELIEF_TIERS;
    beliefTiersCacheTime = now;
    return DEFAULT_BELIEF_TIERS;
}

/**
 * Clear belief tiers cache (call when admin updates config)
 */
export function clearBeliefTiersCache(): void {
    beliefTiersCache = null;
    beliefTiersCacheTime = 0;
}

/**
 * Get max allowed entry based on belief score (async, uses cached config)
 * Higher belief = higher entry cap
 */
export async function getMaxAllowedEntryAsync(
    beliefScore: number,
    trenchMaxEntry: number
): Promise<number> {
    const tiers = await getBeliefTiers();
    // Sort descending by minScore to find the highest matching tier
    const sorted = [...tiers].sort((a, b) => b.minScore - a.minScore);

    for (const tier of sorted) {
        if (beliefScore >= tier.minScore) {
            return Math.floor(trenchMaxEntry * tier.multiplier);
        }
    }

    // Fallback to 50% if no tier matches
    return Math.floor(trenchMaxEntry * 0.5);
}

/**
 * Get max allowed entry based on belief score (sync, uses defaults)
 * @deprecated Use getMaxAllowedEntryAsync for configurable tiers
 * Kept for backwards compatibility
 */
export function getMaxAllowedEntry(
    beliefScore: number,
    trenchMaxEntry: number
): number {
    // Use cached tiers if available, otherwise defaults
    const tiers = beliefTiersCache || DEFAULT_BELIEF_TIERS;
    const sorted = [...tiers].sort((a, b) => b.minScore - a.minScore);

    for (const tier of sorted) {
        if (beliefScore >= tier.minScore) {
            return Math.floor(trenchMaxEntry * tier.multiplier);
        }
    }

    return Math.floor(trenchMaxEntry * 0.5);
}

/**
 * Unified ROI multiplier for all trenches
 * LOCKED: All trenches use 1.5x max return
 */
export const ROI_MULTIPLIER = 1.5;

/**
 * Trench-level entry caps (in USD equivalent)
 */
export const TRENCH_CAPS: Record<string, number> = {
    RAPID: 1000,    // $1,000 max
    MID: 10000,     // $10,000 max  
    DEEP: 100000,   // $100,000 max (renamed from SLOW)
};

/**
 * Calculate max payout (ROI cap) for an entry
 * UNIFIED: All trenches use 1.5x multiplier
 */
export function calculateMaxPayout(entryAmount: number): number {
    return Math.floor(entryAmount * ROI_MULTIPLIER);
}

/**
 * Validate an entry attempt
 */
export async function validateEntry(
    userId: string,
    trenchId: string,
    entryAmount: number
): Promise<EnforcementResult> {
    // Get user and trench data
    const [user, trench] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId } }),
        prisma.trench.findUnique({ where: { id: trenchId } }),
    ]);

    if (!user) {
        return { allowed: false, reason: 'User not found' };
    }

    if (!trench) {
        return { allowed: false, reason: 'Trench not found' };
    }

    if (!trench.active) {
        return { allowed: false, reason: 'Trench is not active' };
    }

    // Check minimum entry
    if (entryAmount < trench.entrySize) {
        return {
            allowed: false,
            reason: `Minimum entry is ${trench.entrySize} BLT`
        };
    }

    // Check trench-level cap
    const trenchCap = TRENCH_CAPS[trench.level] ?? 1000;
    if (entryAmount > trenchCap) {
        return {
            allowed: false,
            reason: `Maximum entry for ${trench.level} trench is $${trenchCap.toLocaleString()}`
        };
    }

    // Check belief-based max entry (applied on top of trench cap)
    const beliefCap = getMaxAllowedEntry(user.beliefScore, trenchCap);
    if (entryAmount > beliefCap) {
        return {
            allowed: false,
            reason: `Maximum entry for your belief level is $${beliefCap.toLocaleString()}`
        };
    };

    // Check for existing active participation
    const existingParticipant = await prisma.participant.findUnique({
        where: {
            userId_trenchId: { userId, trenchId },
        },
    });

    if (existingParticipant && existingParticipant.status === 'active') {
        return {
            allowed: false,
            reason: 'Already active in this trench'
        };
    }

    return { allowed: true };
}

/**
 * Expire participants that have exceeded their time limit
 */
export async function expireParticipants(): Promise<number> {
    const now = new Date();

    const result = await prisma.participant.updateMany({
        where: {
            status: 'active',
            expiresAt: {
                lt: now,
            },
        },
        data: {
            status: 'expired',
        },
    });

    return result.count;
}

/**
 * Check if a round is still active
 * Based on cadence (NO WAIT, 3 DAYS, 7 DAYS)
 */
export function isRoundActive(
    roundStartTime: Date,
    cadence: string
): boolean {
    const now = new Date();
    const elapsed = now.getTime() - roundStartTime.getTime();

    // Parse cadence to milliseconds
    let maxDuration: number;

    switch (cadence) {
        case 'NO WAIT':
            maxDuration = Infinity; // Always active
            break;
        case '3 DAYS':
            maxDuration = 3 * 24 * 60 * 60 * 1000;
            break;
        case '7 DAYS':
            maxDuration = 7 * 24 * 60 * 60 * 1000;
            break;
        default:
            maxDuration = 7 * 24 * 60 * 60 * 1000; // Default to 7 days
    }

    return elapsed < maxDuration;
}

/**
 * Validate payout amount doesn't exceed cap
 */
export function validatePayoutAmount(
    receivedAmount: number,
    maxPayout: number,
    proposedAmount: number
): EnforcementResult {
    const remaining = maxPayout - receivedAmount;

    if (remaining <= 0) {
        return {
            allowed: false,
            reason: 'Maximum payout already received'
        };
    }

    if (proposedAmount > remaining) {
        return {
            allowed: false,
            reason: `Proposed amount (${proposedAmount}) exceeds remaining cap (${remaining})`
        };
    }

    return { allowed: true };
}

/**
 * Get ROI multiplier (DEPRECATED - use ROI_MULTIPLIER constant)
 * Kept for backwards compatibility
 */
export function getROIMultiplier(_level: string): number {
    // All trenches now use unified 1.5x ROI
    return ROI_MULTIPLIER;
}

/**
 * Run all enforcement checks on startup
 */
export async function runEnforcementChecks(): Promise<{
    expiredParticipants: number;
    expiredTransactions: number;
}> {
    // Import here to avoid circular dependency
    const { expirePendingTransactions } = await import('./transaction.service');

    const [expiredParticipants, expiredTransactions] = await Promise.all([
        expireParticipants(),
        expirePendingTransactions(),
    ]);

    if (expiredParticipants > 0 || expiredTransactions > 0) {
        console.log(`Enforcement: Expired ${expiredParticipants} participants, ${expiredTransactions} transactions`);
    }

    return { expiredParticipants, expiredTransactions };
}
