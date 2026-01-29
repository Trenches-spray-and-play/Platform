/**
 * Migration Script: Migrate BP from Participants to User Wallet
 * 
 * This script migrates existing boost points from Participant records
 * to the new User.boostPoints wallet field.
 * 
 * Strategy: For each user, sum all their Participant.boostPoints and add to User.boostPoints
 * 
 * Run with: npx ts-node scripts/migrate-bp-to-user.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateBoostPoints() {
    console.log('Starting BP migration...\n');

    // Get all users with their participant boost points
    const usersWithBp = await prisma.user.findMany({
        include: {
            participants: {
                select: {
                    id: true,
                    boostPoints: true,
                    status: true,
                },
            },
        },
    });

    let migratedCount = 0;
    let totalBpMigrated = 0;

    for (const user of usersWithBp) {
        // Sum all participant boost points for this user
        const totalParticipantBp = user.participants.reduce(
            (sum, p) => sum + p.boostPoints,
            0
        );

        if (totalParticipantBp > 0) {
            // Add to user's wallet
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    boostPoints: { increment: totalParticipantBp },
                },
            });

            console.log(`Migrated ${totalParticipantBp} BP for user: ${user.handle}`);
            migratedCount++;
            totalBpMigrated += totalParticipantBp;
        }
    }

    console.log('\n--- Migration Complete ---');
    console.log(`Users migrated: ${migratedCount}`);
    console.log(`Total BP migrated: ${totalBpMigrated}`);

    // Optional: Reset participant boost points to 0 after migration
    // Uncomment if needed:
    // await prisma.participant.updateMany({
    //     where: { boostPoints: { gt: 0 } },
    //     data: { boostPoints: 0 },
    // });
    // console.log('Participant BP reset to 0');
}

async function main() {
    try {
        await migrateBoostPoints();
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
