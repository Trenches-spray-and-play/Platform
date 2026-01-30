#!/usr/bin/env node
/**
 * Backfill the new 2000 BLT deposit
 * Tx: 0xcfe996edd8bfd9124074f67ad814f93d503351aad85d943d60def7e98a9772c4
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TX_HASH = '0xcfe996edd8bfd9124074f67ad814f93d503351aad85d943d60def7e98a9772c4';
const DEPOSIT_ADDRESS = '0x4e814de1e6a46aba627f387b38664e50cbb3899c';
const AMOUNT_BLT = 2000;
const AMOUNT_USD = 10.00; // 2000 BLT × $0.005
const BLOCK_NUMBER = 26108965;

async function backfill() {
    try {
        console.log('🔍 Finding deposit address...');
        const depositAddress = await prisma.depositAddress.findFirst({
            where: { 
                address: { equals: DEPOSIT_ADDRESS, mode: 'insensitive' },
                chain: 'hyperevm'
            }
        });

        if (!depositAddress) {
            console.error('❌ Deposit address not found');
            process.exit(1);
        }

        console.log(`✅ Found deposit address for user ${depositAddress.userId}`);

        // Check if already exists
        const existing = await prisma.deposit.findFirst({
            where: { txHash: { equals: TX_HASH, mode: 'insensitive' } }
        });

        if (existing) {
            console.log('⚠️ Deposit already exists:', existing.status);
            return;
        }

        console.log('💰 Creating deposit record and crediting balance...');

        const result = await prisma.$transaction([
            // Create deposit record
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
            // Credit user balance
            prisma.user.update({
                where: { id: depositAddress.userId },
                data: { balance: { increment: AMOUNT_USD } }
            })
        ]);

        console.log('✅ Deposit backfilled successfully!');
        console.log(`   Amount: ${AMOUNT_BLT} BLT ($${AMOUNT_USD})`);
        console.log(`   User balance increased by $${AMOUNT_USD}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

backfill();
