import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { clearBeliefTiersCache, DEFAULT_BELIEF_TIERS } from '@/services/enforcement.service';
import { clearBpRateCache } from '@/services/payout-time.service';
import { requireAdminAuth } from '@/lib/admin-auth';

// GET: Fetch current platform config
export async function GET() {
    try {
        // Get or create default config
        let config = await prisma.platformConfig.findUnique({
            where: { id: 'default' }
        });

        if (!config) {
            // Create default config if it doesn't exist
            config = await prisma.platformConfig.create({
                data: { id: 'default' }
            });
        }

        // Parse beliefTiers from JSON string to array
        const responseConfig = {
            ...config,
            beliefTiers: config.beliefTiers
                ? JSON.parse(config.beliefTiers)
                : DEFAULT_BELIEF_TIERS,
        };

        return NextResponse.json({ success: true, config: responseConfig });
    } catch (error) {
        console.error('Failed to fetch config:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT: Update platform config (admin-only)
export async function PUT(request: Request) {
    // Verify admin authentication
    const auth = await requireAdminAuth();
    if (!auth.authorized) {
        return auth.response;
    }

    try {
        const body = await request.json();
        const {
            deploymentDate,
            telegramUrl,
            twitterUrl,
            twitterHandle,
            onboardingTweetText,
            platformName,
            referralDomain,
            docsUrl,
            waitlistStatusMessage,
            deploymentStatusMessage,
            beliefTiers,
            bpToMinutesRate,
            updatedBy
        } = body;

        const config = await prisma.platformConfig.upsert({
            where: { id: 'default' },
            update: {
                deploymentDate: deploymentDate ? new Date(deploymentDate) : undefined,
                telegramUrl,
                twitterUrl,
                twitterHandle,
                onboardingTweetText,
                platformName,
                referralDomain,
                docsUrl,
                waitlistStatusMessage,
                deploymentStatusMessage,
                beliefTiers: beliefTiers ? JSON.stringify(beliefTiers) : undefined,
                bpToMinutesRate: bpToMinutesRate !== undefined ? bpToMinutesRate : undefined,
                updatedBy,
            },
            create: {
                id: 'default',
                deploymentDate: deploymentDate ? new Date(deploymentDate) : null,
                telegramUrl: telegramUrl || 'https://t.me/trenchesprotocol',
                twitterUrl: twitterUrl || 'https://x.com/traboraofficial',
                twitterHandle: twitterHandle || '@traboraofficial',
                onboardingTweetText: onboardingTweetText || 'Just enlisted in the @traboraofficial deployment queue. Spray and Pray! 🔫',
                platformName: platformName || 'Trenches',
                referralDomain: referralDomain || 'playtrenches.xyz',
                docsUrl: docsUrl || 'https://docs.playtrenches.xyz',
                waitlistStatusMessage: waitlistStatusMessage || 'WAITLIST PROTOCOL ACTIVE',
                deploymentStatusMessage: deploymentStatusMessage || 'DEPLOYMENT WINDOW OPEN',
                updatedBy,
            }
        });

        // Clear caches if relevant fields updated
        if (beliefTiers) {
            clearBeliefTiersCache();
        }
        if (bpToMinutesRate !== undefined) {
            clearBpRateCache();
        }

        // Parse beliefTiers for response
        const responseConfig = {
            ...config,
            beliefTiers: config.beliefTiers
                ? JSON.parse(config.beliefTiers)
                : DEFAULT_BELIEF_TIERS,
        };

        return NextResponse.json({ success: true, config: responseConfig });
    } catch (error) {
        console.error('Failed to update config:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
