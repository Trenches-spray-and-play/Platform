import { prisma } from '@/lib/db';
import crypto from 'crypto';

/**
 * Referral Service
 * 
 * Handles referral code generation, validation, and rewards:
 * - Generate unique 8-char alphanumeric codes
 * - Generate shareable referral links
 * - Validate and apply referral codes during registration
 * - Award belief + boost points to referrers
 */

const REFERRAL_BELIEF_REWARD = 50;  // Belief points for successful referral
const REFERRAL_BOOST_REWARD = 100;  // Boost points for successful referral

/**
 * Log a referral visit for analytics
 */
export async function logReferralVisit(data: {
    code: string;
    referrerId?: string;
    ip?: string;
    userAgent?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
}): Promise<string> {
    // Anonymize/Hash IP for GDPR
    const hashedIp = data.ip ? crypto.createHash('sha256').update(data.ip).digest('hex').slice(0, 16) : null;

    const visit = await prisma.referralVisit.create({
        data: {
            code: data.code.toUpperCase(),
            referrerId: data.referrerId,
            ip: hashedIp,
            userAgent: data.userAgent,
            utmSource: data.utmSource,
            utmMedium: data.utmMedium,
            utmCampaign: data.utmCampaign,
        },
    });

    return visit.id;
}

/**
 * Generate a unique 8-character alphanumeric referral code
 */
export function generateReferralCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes confusing chars: I,O,0,1
    let code = '';
    const randomBytes = crypto.randomBytes(8);
    for (let i = 0; i < 8; i++) {
        code += chars[randomBytes[i] % chars.length];
    }
    return code;
}

/**
 * Generate a referral link from a code
 */
export function generateReferralLink(code: string): string {
    // Use environment variable for base URL or default to playtrenches.xyz
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://playtrenches.xyz';
    return `${baseUrl}/ref/${code}`;
}

/**
 * Get or create a referral code for a user
 */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { referralCode: true },
    });

    if (user?.referralCode) {
        return user.referralCode;
    }

    // Generate unique code (retry if collision)
    let code = generateReferralCode();
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
        const existing = await prisma.user.findUnique({
            where: { referralCode: code },
        });

        if (!existing) break;
        code = generateReferralCode();
        attempts++;
    }

    // Save code to user
    await prisma.user.update({
        where: { id: userId },
        data: { referralCode: code },
    });

    return code;
}

/**
 * Validate a referral code and return the referrer
 */
export async function validateReferralCode(code: string): Promise<{
    valid: boolean;
    referrer?: { id: string; handle: string };
    error?: string;
}> {
    if (!code || code.length !== 8) {
        return { valid: false, error: 'Invalid referral code format' };
    }

    const referrer = await prisma.user.findUnique({
        where: { referralCode: code.toUpperCase() },
        select: { id: true, handle: true },
    });

    if (!referrer) {
        return { valid: false, error: 'Referral code not found' };
    }

    return { valid: true, referrer };
}

/**
 * Apply a referral during or after registration
 * Links the new user to the referrer - NO IMMEDIATE REWARD
 * Reward is triggered on first deposit via awardReferralReward()
 */
export async function applyReferral(
    userId: string,
    referrerId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Prevent self-referral
        if (userId === referrerId) {
            return { success: false, error: 'Cannot refer yourself' };
        }

        // Check if user already has a referrer
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { referredById: true },
        });

        if (user?.referredById) {
            return { success: false, error: 'User already has a referrer' };
        }

        // Link user to referrer (NO reward yet - that happens on first deposit)
        await prisma.user.update({
            where: { id: userId },
            data: { referredById: referrerId },
        });

        // Mark the latest referral visit as converted
        try {
            const lastVisit = await prisma.referralVisit.findFirst({
                where: {
                    referrerId: referrerId,
                    converted: false
                },
                orderBy: { createdAt: 'desc' }
            });

            if (lastVisit) {
                await prisma.referralVisit.update({
                    where: { id: lastVisit.id },
                    data: {
                        converted: true,
                        convertedAt: new Date(),
                        refereeId: userId
                    }
                });
            }
        } catch (visitErr) {
            console.error('Error updating referral visit conversion:', visitErr);
            // Don't fail the referral application if analytics update fails
        }

        return { success: true };
    } catch (error) {
        console.error('Error applying referral:', error);
        return { success: false, error: 'Failed to apply referral' };
    }
}

/**
 * Award referral reward when user makes first deposit
 * Called from deposit-monitor.service.ts on confirmed deposit
 */
const MIN_REFERRAL_DEPOSIT_USD = 5; // Minimum deposit to trigger reward

export async function awardReferralReward(userId: string, depositAmountUsd: number): Promise<{
    success: boolean;
    referrerId?: string;
    reward?: { belief: number; boost: number };
    error?: string;
}> {
    try {
        // Check minimum deposit
        if (depositAmountUsd < MIN_REFERRAL_DEPOSIT_USD) {
            return { success: false, error: `Deposit below $${MIN_REFERRAL_DEPOSIT_USD} minimum` };
        }

        // Get user with referrer info
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                referredById: true,
                referralRewardClaimed: true,
            },
        });

        // No referrer or already claimed
        if (!user?.referredById) {
            return { success: false, error: 'User has no referrer' };
        }
        if (user.referralRewardClaimed) {
            return { success: false, error: 'Referral reward already claimed' };
        }

        // Award both Belief and Boost to referrer
        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.referredById },
                data: {
                    beliefScore: { increment: REFERRAL_BELIEF_REWARD },
                    // Note: boostPoints would go here if we add that field
                },
            }),
            // Mark reward as claimed to prevent duplicates
            prisma.user.update({
                where: { id: userId },
                data: { referralRewardClaimed: true },
            }),
        ]);

        console.log(`Awarded referral reward: ${REFERRAL_BELIEF_REWARD} Belief to ${user.referredById} for referring ${userId}`);

        return {
            success: true,
            referrerId: user.referredById,
            reward: { belief: REFERRAL_BELIEF_REWARD, boost: REFERRAL_BOOST_REWARD },
        };
    } catch (error) {
        console.error('Error awarding referral reward:', error);
        return { success: false, error: 'Failed to award referral reward' };
    }
}

/**
 * Get all referrals for a user
 */
export async function getReferrals(userId: string): Promise<{
    count: number;
    referrals: { id: string; handle: string; createdAt: Date }[];
}> {
    const referrals = await prisma.user.findMany({
        where: { referredById: userId },
        select: {
            id: true,
            handle: true,
            createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
    });

    return {
        count: referrals.length,
        referrals,
    };
}

/**
 * Get referral stats for admin
 */
export async function getReferralStats(): Promise<{
    totalReferrals: number;
    topReferrers: { id: string; handle: string; count: number }[];
}> {
    const totalReferrals = await prisma.user.count({
        where: { referredById: { not: null } },
    });

    // Get top referrers by count
    const topReferrers = await prisma.user.findMany({
        where: {
            referrals: { some: {} },
        },
        select: {
            id: true,
            handle: true,
            _count: { select: { referrals: true } },
        },
        orderBy: {
            referrals: { _count: 'desc' },
        },
        take: 10,
    });

    return {
        totalReferrals,
        topReferrers: topReferrers.map(r => ({
            id: r.id,
            handle: r.handle,
            count: r._count.referrals,
        })),
    };
}
