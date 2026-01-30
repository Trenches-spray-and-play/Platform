#!/usr/bin/env node
/**
 * Check deposit status for a specific transaction
 * Usage: node check-deposit-status.js <tx_hash> [chain]
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDeposit(txHash, chain = 'hyperevm') {
    try {
        console.log(`\n🔍 Checking deposit status for ${txHash} on ${chain}\n`);

        // Check if already in database
        const deposit = await prisma.deposit.findFirst({
            where: {
                txHash: {
                    equals: txHash,
                    mode: 'insensitive'
                },
                chain: chain
            }
        });

        if (deposit) {
            console.log('✅ Deposit found in database:');
            console.log(`  Status: ${deposit.status}`);
            console.log(`  Asset: ${deposit.asset}`);
            console.log(`  Amount: ${deposit.amount}`);
            console.log(`  Confirmations: ${deposit.confirmations}`);
            console.log(`  Credited: ${deposit.creditedToBalance}`);
            console.log(`  Created: ${deposit.createdAt}`);
            if (deposit.confirmedAt) console.log(`  Confirmed: ${deposit.confirmedAt}`);
            if (deposit.safeAt) console.log(`  Safe: ${deposit.safeAt}`);
        } else {
            console.log('❌ Deposit NOT found in database');
            console.log('   The monitor may not have picked it up yet, or it might be pending confirmations.');
        }

        // Get user's deposit addresses
        const depositAddresses = await prisma.depositAddress.findMany({
            where: { chain: chain },
            include: { user: { select: { email: true, handle: true } } }
        });

        console.log(`\n📋 Active ${chain} deposit addresses: ${depositAddresses.length}`);
        depositAddresses.forEach(da => {
            console.log(`  - ${da.address} (${da.user.email || da.user.handle})`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

const txHash = process.argv[2];
const chain = process.argv[3] || 'hyperevm';

if (!txHash) {
    console.log('Usage: node check-deposit-status.js <tx_hash> [chain]');
    console.log('Example: node check-deposit-status.js 0xabc123... hyperevm');
    process.exit(1);
}

checkDeposit(txHash, chain);
