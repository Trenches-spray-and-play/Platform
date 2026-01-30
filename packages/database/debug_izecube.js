
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres:TboXtraCash1%21%21%3FT@db.nlloqdxjynwvmxwrruhb.supabase.co:5432/postgres"
        }
    }
});

async function main() {
    console.log('--- USER INFO ---');
    const user = await prisma.user.findUnique({
        where: { handle: '@izecube' }
    });

    if (!user) {
        console.log('User @izecube not found');
        return;
    }

    console.log(`User ID: ${user.id}`);

    console.log('\n--- DEPOSITS ---');
    const deposits = await prisma.deposit.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
    });

    console.log(`Total deposits items found: ${deposits.length}`);
    deposits.forEach((d, i) => {
        console.log(`${i + 1}. status=${d.status}, asset=${d.asset}, amount=${d.amountUsd}, createdAt=${d.createdAt.toISOString()}`);
    });
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
