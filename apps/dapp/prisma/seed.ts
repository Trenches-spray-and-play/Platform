import { PrismaClient, TrenchLevel } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Create Trenches
    const trenches = await Promise.all([
        prisma.trench.upsert({
            where: { id: 'trench-rapid' },
            update: {
                entrySize: 1000,   // max entry in tokens
                usdEntry: 5,       // min entry in USD ($5 - $1,000)
            },
            create: {
                id: 'trench-rapid',
                name: 'RAPID Trench',
                level: TrenchLevel.RAPID,
                entrySize: 1000,   // max entry $1,000
                usdEntry: 5,       // min entry $5
                cadence: '1-3 DAYS',
                reserves: '0',
                active: true,
            },
        }),
        prisma.trench.upsert({
            where: { id: 'trench-mid' },
            update: {
                entrySize: 10000,  // max entry in tokens
                usdEntry: 100,     // min entry in USD ($100 - $10,000)
            },
            create: {
                id: 'trench-mid',
                name: 'MID Trench',
                level: TrenchLevel.MID,
                entrySize: 10000,  // max entry $10,000
                usdEntry: 100,     // min entry $100
                cadence: '7-14 DAYS',
                reserves: '0',
                active: true,
            },
        }),
        prisma.trench.upsert({
            where: { id: 'trench-deep' },
            update: {
                entrySize: 100000, // max entry in tokens
                usdEntry: 1000,    // min entry in USD ($1,000 - $100,000)
            },
            create: {
                id: 'trench-deep',
                name: 'DEEP Trench',
                level: TrenchLevel.DEEP,
                entrySize: 100000, // max entry $100,000
                usdEntry: 1000,    // min entry $1,000
                cadence: '30-60 DAYS',
                reserves: '0',
                active: true,
            },
        }),
    ]);
    console.log(`✅ Created ${trenches.length} trenches`);

    // Create Tasks
    const tasks = await Promise.all([
        prisma.task.upsert({
            where: { id: 'task-connect-x' },
            update: {},
            create: {
                id: 'task-connect-x',
                title: 'Connect X (Twitter)',
                description: 'Link your X account to verify your identity',
                reward: 100,
                link: 'https://twitter.com',
                isActive: true,
                order: 1,
            },
        }),
        prisma.task.upsert({
            where: { id: 'task-join-telegram' },
            update: {},
            create: {
                id: 'task-join-telegram',
                title: 'Join Telegram',
                description: 'Join the official Trenches Telegram group',
                reward: 50,
                link: 'https://t.me/trenches',
                isActive: true,
                order: 2,
            },
        }),
        prisma.task.upsert({
            where: { id: 'task-follow-x' },
            update: {},
            create: {
                id: 'task-follow-x',
                title: 'Follow @Trenches on X',
                description: 'Follow our official X account',
                reward: 50,
                link: 'https://twitter.com/trenches',
                isActive: true,
                order: 3,
            },
        }),
        prisma.task.upsert({
            where: { id: 'task-share-post' },
            update: {},
            create: {
                id: 'task-share-post',
                title: 'Share a Post',
                description: 'Share your first post about $BLT',
                reward: 150,
                link: null,
                isActive: true,
                order: 4,
            },
        }),
        prisma.task.upsert({
            where: { id: 'task-invite-friend' },
            update: {},
            create: {
                id: 'task-invite-friend',
                title: 'Invite a Friend',
                description: 'Get a friend to join the trenches',
                reward: 200,
                link: null,
                isActive: true,
                order: 5,
            },
        }),
    ]);
    console.log(`✅ Created ${tasks.length} tasks`);

    console.log('🎉 Database seed complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
