#!/usr/bin/env node
/**
 * Fix the deposit amount - correct from 2000 to 20000 BLT
 * Additional credit: $90 (20000 - 2000 = 18000 BLT × $0.005 = $90)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TX_HASH = '0xcfe996edd8bfd9124074f67ad814f93d503351aad85d943d60def7e98a9772c4';
const CORRECT_AMOUNT_BLT = 20000;
const CORRECT_AMOUNT_USD = 100.00; // 20000 BLT × $0.005
const ADDITIONAL_CREDIT = 90.00; // Already credited $10, need $90 more

async function fixDeposit() {
    try {
        console.log('🔍 Finding deposit...');
        const deposit = await prisma.deposit.findFirst({
            where: { txHash: { equals: TX_HASH, mode: 'insensitive' } },
            include: { user: true }
        });

        if (!deposit) {
            console.error('❌ Deposit not found');
            process.exit(1);
        }

        console.log('Current deposit record:');
        console.log(`  Amount: ${deposit.amount} BLT`);
        console.log(`  USD: $${deposit.amountUsd}`);
        console.log(`  User balance before fix: $${deposit.user.balance}`);

        console.log('\n💰 Fixing deposit and crediting additional $90...');

        const result = await prisma.$transaction([
            // Update deposit record with correct amount
            prisma.deposit.update({
                where: { id: deposit.id },
                data: {
                    amount: CORRECT_AMOUNT_BLT.toString(),
                    amountUsd: CORRECT_AMOUNT_USD,
                }
            }),
            // Credit additional $90 to user balance
            prisma.user.update({
                where: { id: deposit.userId },
                data: { balance: { increment: ADDITIONAL_CREDIT } }
            })
        ]);

        console.log('✅ Deposit fixed!');
        console.log(`   Correct amount: ${CORRECT_AMOUNT_BLT} BLT ($${CORRECT_AMOUNT_USD})`);
        console.log(`   Additional credited: $${ADDITIONAL_CREDIT}`);

        // Verify new balance
        const user = await prisma.user.findUnique({
            where: { id: deposit.userId },
            select: { handle: true, balance: true }
        });
        console.log(`\n📊 New balance for ${user.handle}: $${user.balance}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixDeposit();
