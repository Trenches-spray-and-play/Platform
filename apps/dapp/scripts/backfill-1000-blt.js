const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TX_HASH = '0xc77b82e00abb1183a56f49927e7c7b89eec6bf727f379df99b58bbc0a48b9620';
const DEPOSIT_ADDRESS = '0x4e814de1e6a46aba627f387b38664e50cbb3899c';
const AMOUNT_BLT = 1000;
const AMOUNT_USD = 5.00; // 1000 BLT × $0.005
const BLOCK_NUMBER = 25967108;

async function backfill() {
    try {
        console.log('Finding deposit address for:', DEPOSIT_ADDRESS);
        const depositAddress = await prisma.depositAddress.findFirst({
            where: { 
                address: { equals: DEPOSIT_ADDRESS, mode: 'insensitive' },
                chain: 'hyperevm'
            }
        });

        if (!depositAddress) {
            console.error('Deposit address not found');
            process.exit(1);
        }

        console.log('Found deposit address for user:', depositAddress.userId);

        // Check if already exists
        const existing = await prisma.deposit.findFirst({
            where: { txHash: { equals: TX_HASH, mode: 'insensitive' } }
        });

        if (existing) {
            console.log('Deposit already exists:', existing.status);
            return;
        }

        console.log('Creating deposit record and crediting $5.00...');

        const result = await prisma.$transaction([
            prisma.deposit.create({
                data: {
                    depositAddressId: depositAddress.id,
                    userId: depositAddress.userId,
                    txHash: TX_HASH,
                    chain: 'hyperevm',
                    asset: 'BLT',
                    amount: AMOUNT_BLT.toString(),
                    amountUsd: AMOUNT_USD,
                    status: 'SAFE',
                    blockNumber: BLOCK_NUMBER,
                    confirmations: 100,
                    creditedToBalance: true,
                    confirmedAt: new Date(),
                    safeAt: new Date(),
                }
            }),
            prisma.user.update({
                where: { id: depositAddress.userId },
                data: { balance: { increment: AMOUNT_USD } }
            })
        ]);

        console.log('✅ Deposit backfilled successfully!');
        console.log('Amount:', AMOUNT_BLT, 'BLT ($' + AMOUNT_USD + ')');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

backfill();
