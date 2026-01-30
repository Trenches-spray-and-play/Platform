
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres:TboXtraCash1%21%21%3FT@db.nlloqdxjynwvmxwrruhb.supabase.co:5432/postgres"
        }
    }
});

async function main() {
    const handle = '@izecube';
    const user = await prisma.user.findUnique({ where: { handle } });

    if (!user) {
        console.log(`User ${handle} not found`);
        return;
    }

    console.log(`User ID: ${user.id}`);

    console.log('\n--- DEPOSIT ADDRESSES ---');
    const addresses = await prisma.depositAddress.findMany({
        where: { userId: user.id }
    });

    addresses.forEach((a, i) => {
        console.log(`${i + 1}. chain=${a.chain}, address=${a.address}, index=${a.derivationIndex}`);
    });

    console.log('\n--- RECENT DEPOSITS ---');
    const deposits = await prisma.deposit.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    deposits.forEach((d, i) => {
        console.log(`${i + 1}. id=${d.id}, status=${d.status}, asset=${d.asset}, amount=${d.amountUsd}, txHash=${d.txHash}`);
    });
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
