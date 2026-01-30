const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const address = '0x4e814de1e6a46aba627f387b38664e50cbb3899c';
    const chain = 'hyperevm';
    const txHash = '0xac035042e90d3994a0d25e25ea01c5f4a39330d9d1510b732af74a54de8e2c94';

    console.log(`Searching for deposit address: ${address} on ${chain}...`);
    const depositAddress = await prisma.depositAddress.findFirst({
        where: { address: { equals: address, mode: 'insensitive' }, chain }
    });

    if (!depositAddress) {
        console.error('❌ Deposit address not found in database');
        return;
    }

    console.log(`Found address for user: ${depositAddress.userId}`);

    // Check if already exists
    const existing = await prisma.deposit.findFirst({
        where: { txHash: { contains: txHash } }
    });

    if (existing) {
        console.log('ℹ️ Deposit already recorded, skipping.');
        return;
    }

    // 2000 BLT at $0.005 = $10
    const amountUsd = 10;

    console.log(`Creating deposit record and crediting $${amountUsd} to balance...`);

    await prisma.$transaction([
        prisma.deposit.create({
            data: {
                depositAddressId: depositAddress.id,
                userId: depositAddress.userId,
                txHash: `${txHash}-BLT`,
                chain,
                asset: 'BLT',
                amount: "2000", // Unit value for Decimal(36, 18)
                amountUsd,
                status: 'SAFE',
                blockNumber: 25839470,
                confirmations: 100,
                creditedToBalance: true,
                confirmedAt: new Date(),
                safeAt: new Date(),
            }
        }),
        prisma.user.update({
            where: { id: depositAddress.userId },
            data: { balance: { increment: amountUsd } }
        })
    ]);

    console.log(`✅ Successfully credited $${amountUsd} to user ${depositAddress.userId}`);
}

main()
    .catch(err => {
        console.error('❌ Error during backfill:', err);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
