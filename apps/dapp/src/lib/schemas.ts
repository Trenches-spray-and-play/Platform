import { z } from 'zod';

// Basic Types
export const CampaignLevelSchema = z.enum(['RAPID', 'MID', 'DEEP']);
export const ChainSchema = z.enum(['ethereum', 'base', 'arbitrum', 'bsc', 'hyperevm', 'solana']);

// Campaign Schema
export const CampaignSchema = z.object({
    id: z.string(),
    name: z.string().min(1).max(100),
    tokenSymbol: z.string().min(1).max(10),
    tokenAddress: z.string(),
    tokenDecimals: z.number().optional(),
    chainId: z.number(),
    chainName: z.string(),
    roiMultiplier: z.string(), // Coming as decimal string from API
    reserveCachedBalance: z.string().nullable().optional(),
    trenchIds: z.array(z.string()),
    phase: z.enum(['WAITLIST', 'ACCEPTING', 'LIVE', 'PAUSED']).optional(),
    startsAt: z.string().nullable().optional(),
    isPaused: z.boolean().default(false),
    participantCount: z.number().optional(),
    isActive: z.boolean(),
    currentPrice: z.string().optional(),
    endPrice: z.string().optional(),
    level: CampaignLevelSchema.optional(), // Added by fetcher flattening
    entryRange: z.object({ min: z.number(), max: z.number() }).optional(), // Added by fetcher flattening
});

// User Schema
export const UserSchema = z.object({
    id: z.string(),
    handle: z.string(),
    balance: z.string(),
    beliefScore: z.number().optional(),
    boostPoints: z.number().optional(),
    stat: z.object({ referrals: z.number() }).optional(),
    walletEvm: z.string().nullable().optional(),
    walletSol: z.string().nullable().optional(),
});

// Spray Request Schema
export const SprayRequestSchema = z.object({
    trenchId: z.string(),
    amount: z.number().positive(),
    level: CampaignLevelSchema,
    useAutoBoost: z.boolean().optional(),
});

// User Update Schema
export const UserUpdateSchema = z.object({
    handle: z.string().min(3).max(30).optional(),
    walletEvm: z.string().startsWith('0x').length(42).optional(),
    walletSol: z.string().min(32).max(44).optional(),
});

// Generic API Response Wrapper
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.object({
        success: z.boolean(),
        data: dataSchema.optional(),
        error: z.string().optional(),
    });

// Types exported for convenience
export type Campaign = z.infer<typeof CampaignSchema>;
export type SprayRequest = z.infer<typeof SprayRequestSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
