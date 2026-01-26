import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding PlatformConfig...');

    // Create or update the default platform config
    const config = await prisma.platformConfig.upsert({
        where: { id: 'default' },
        update: {
            // Update existing config with any new values
            updatedAt: new Date(),
        },
        create: {
            id: 'default',
            // Set your deployment date here (when the waitlist ends / main app launches)
            // Example: 2 weeks from now
            deploymentDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),

            // Social Media Links - UPDATE THESE WITH YOUR ACTUAL LINKS
            telegramUrl: 'https://t.me/trenchesprotocol',
            twitterUrl: 'https://x.com/traboraofficial',
            twitterHandle: '@traboraofficial',

            // The text that appears when users click "Post to X"
            onboardingTweetText: 'Just enlisted in the @traboraofficial deployment queue. Spray and Pray!',

            // Branding
            platformName: 'Trenches',
            referralDomain: 'playtrenches.xyz',
            docsUrl: 'https://docs.playtrenches.xyz',

            // Status Messages
            waitlistStatusMessage: 'WAITLIST PROTOCOL ACTIVE',
            deploymentStatusMessage: 'DEPLOYMENT WINDOW OPEN',

            // Belief Score Tiers (JSON)
            beliefTiers: JSON.stringify([
                { minScore: 0, multiplier: 0.5 },
                { minScore: 100, multiplier: 0.75 },
                { minScore: 500, multiplier: 0.9 },
                { minScore: 1000, multiplier: 1.0 }
            ]),
        },
    });

    console.log('PlatformConfig created/updated:', config.id);
    console.log('Deployment date set to:', config.deploymentDate);
}

main()
    .catch((e) => {
        console.error('Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
