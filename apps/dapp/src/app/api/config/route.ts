import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

// Public read-only endpoint for platform config
export async function GET() {
    try {
        const config = await prisma.platformConfig.findUnique({
            where: { id: 'default' }
        });

        if (!config) {
            // Return default values if config doesn't exist
            return NextResponse.json({
                id: 'default',
                deploymentDate: null,
                telegramUrl: 'https://t.me/trenchesprotocol',
                twitterUrl: 'https://x.com/traboraofficial',
                twitterHandle: '@traboraofficial',
                onboardingTweetText: 'Just enlisted in the @traboraofficial deployment queue. Spray and Pray! 🔫',
                platformName: 'Trenches',
                referralDomain: 'playtrenches.xyz',
                docsUrl: 'https://docs.playtrenches.xyz',
                waitlistStatusMessage: 'WAITLIST PROTOCOL ACTIVE',
                deploymentStatusMessage: 'DEPLOYMENT WINDOW OPEN',
            });
        }

        return NextResponse.json(config);
    } catch (error) {
        console.error('Failed to fetch config:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
