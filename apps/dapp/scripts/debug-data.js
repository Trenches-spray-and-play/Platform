const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.count();
    const deposits = await prisma.deposit.count();
    const depositAddresses = await prisma.depositAddress.count();

    console.log(`Summary:`);
    console.log(`Users: ${users}`);
    console.log(`Deposits: ${deposits}`);
    console.log(`Deposit Addresses: ${depositAddresses}`);

    const latestDeposits = await prisma.deposit.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
            user: { select: { email: true, handle: true } }
        }
    });

    console.log('\nLatest 5 Deposits:');
    console.log(JSON.stringify(latestDeposits, (key, value) => {
        if (typeof value === 'bigint') return value.toString();
        return value;
    }, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
