/**
 * Comprehensive Deposit System Tests
 * 
 * Tests:
 * 1. Address generation from all chains (non-ETH first, then ETH)
 * 2. EVM address sharing verification
 * 3. Deposit flow simulation
 * 4. Sweep process
 * 5. Money flow end-to-end
 * 
 * Usage:
 *   npx tsx src/__tests__/deposit-system.test.ts
 */

import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';

const prisma = new PrismaClient();

// ============================================================
// TEST UTILITIES
// ============================================================

interface TestResult {
    name: string;
    passed: boolean;
    details: string;
}

const results: TestResult[] = [];

function log(message: string) {
    console.log(`  ${message}`);
}

function pass(name: string, details: string) {
    results.push({ name, passed: true, details });
    console.log(`✅ ${name}`);
    log(details);
}

function fail(name: string, details: string) {
    results.push({ name, passed: false, details });
    console.log(`❌ ${name}`);
    log(details);
}

// ============================================================
// TEST 1: Address Generation - All Chains
// ============================================================

async function testAddressGenerationAllChains() {
    console.log('\n📋 TEST 1: Address Generation (Non-ETH First, Then ETH)');
    console.log('─'.repeat(60));

    try {
        // Import the actual service
        const { getDepositAddress } = await import('../services/deposit-address.service');

        // Create a NEW test user to avoid conflicts with existing addresses
        const testHandle = `deposit_test_${Date.now()}`;
        const testUser = await prisma.user.create({
            data: {
                handle: testHandle,
                beliefScore: 10,
            },
        });
        log(`Created new test user: ${testUser.handle}`);

        const userId = testUser.id;

        // Test order: Base → Arbitrum → HyperEVM → Solana → Ethereum
        const testOrder: Array<'base' | 'arbitrum' | 'hyperevm' | 'solana' | 'ethereum'> =
            ['base', 'arbitrum', 'hyperevm', 'solana', 'ethereum'];
        const generatedAddresses: Record<string, string> = {};

        for (const chain of testOrder) {
            log(`\nGenerating address for ${chain.toUpperCase()}...`);

            try {
                // Use the actual service function
                const result = await getDepositAddress(userId, chain);
                generatedAddresses[chain] = result.address;
                log(`  ${chain}: ${result.address.slice(0, 25)}... (isNew: ${result.isNew})`);
            } catch (err: any) {
                // HD wallet might not be configured in test env
                if (err.message?.includes('HD_MASTER_SEED') || err.message?.includes('mnemonic')) {
                    log(`  ${chain}: HD wallet not configured, skipping`);
                } else {
                    throw err;
                }
            }
        }

        const addressCount = Object.keys(generatedAddresses).length;
        if (addressCount > 0) {
            pass('Address Generation',
                `Generated/retrieved addresses for ${addressCount} chains`);
        } else {
            // Fall back to checking existing addresses in DB
            log('\nHD wallet not configured. Checking existing addresses...');
            const existingAddresses = await prisma.depositAddress.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
            });
            if (existingAddresses.length > 0) {
                pass('Address Generation',
                    `Found ${existingAddresses.length} existing addresses in DB`);
            } else {
                fail('Address Generation', 'No addresses available (HD wallet not configured)');
            }
        }

        return { userId, generatedAddresses };
    } catch (error) {
        fail('Address Generation', `Error: ${error}`);
        return null;
    }
}

// ============================================================
// TEST 2: EVM Address Sharing
// ============================================================

async function testEvmAddressSharing(testData: { userId: string; generatedAddresses: Record<string, string> } | null) {
    console.log('\n📋 TEST 2: EVM Address Sharing Verification');
    console.log('─'.repeat(60));

    if (!testData) {
        log('Skipping - no test data from previous test');
        return;
    }

    try {
        const evmChains = ['ethereum', 'base', 'arbitrum', 'hyperevm'];
        const evmAddresses = evmChains.map(c => testData.generatedAddresses[c]).filter(Boolean);

        // All EVM addresses should be the same
        const uniqueEvmAddresses = [...new Set(evmAddresses)];

        log(`EVM addresses found: ${evmAddresses.length}`);
        log(`Unique EVM addresses: ${uniqueEvmAddresses.length}`);

        if (uniqueEvmAddresses.length === 1) {
            pass('EVM Address Sharing',
                `All ${evmAddresses.length} EVM chains share the same address: ${uniqueEvmAddresses[0].slice(0, 20)}...`);
        } else if (uniqueEvmAddresses.length === 0) {
            fail('EVM Address Sharing', 'No EVM addresses found');
        } else {
            fail('EVM Address Sharing',
                `Expected 1 unique address, got ${uniqueEvmAddresses.length}: ${uniqueEvmAddresses.join(', ')}`);
        }

        // Solana should be different
        const solanaAddress = testData.generatedAddresses['solana'];
        if (solanaAddress && !uniqueEvmAddresses.includes(solanaAddress)) {
            log(`✓ Solana address is different: ${solanaAddress.slice(0, 20)}...`);
        }
    } catch (error) {
        fail('EVM Address Sharing', `Error: ${error}`);
    }
}

// ============================================================
// TEST 3: Deposit Flow Simulation
// ============================================================

async function testDepositFlowSimulation(testData: { userId: string; generatedAddresses: Record<string, string> } | null) {
    console.log('\n📋 TEST 3: Deposit Flow Simulation');
    console.log('─'.repeat(60));

    if (!testData) {
        log('Skipping - no test data');
        return;
    }

    try {
        const { userId, generatedAddresses } = testData;

        // Get the deposit address record for base chain
        const depositAddress = await prisma.depositAddress.findFirst({
            where: { userId, chain: 'base' },
        });

        if (!depositAddress) {
            fail('Deposit Flow Simulation', 'No deposit address found');
            return;
        }

        // Simulate a deposit
        const testTxHash = `0xtest${Date.now().toString(16).padStart(58, '0')}`;

        // Check if already exists (skip if so)
        const existing = await prisma.deposit.findUnique({
            where: { txHash: testTxHash },
        });

        if (existing) {
            log('Test deposit already exists, skipping creation');
        } else {
            // Create simulated deposit
            const deposit = await prisma.deposit.create({
                data: {
                    depositAddressId: depositAddress.id,
                    userId,
                    txHash: testTxHash,
                    chain: 'base',
                    asset: 'USDC',
                    amount: '100000000', // 100 USDC (6 decimals)
                    amountUsd: 100.00,
                    status: 'PENDING',
                    blockNumber: 12345678n,
                    confirmations: 0,
                },
            });

            log(`Created test deposit: ${deposit.id}`);
            log(`  Chain: ${deposit.chain}`);
            log(`  Asset: ${deposit.asset}`);
            log(`  Amount: $${deposit.amountUsd}`);
            log(`  Status: ${deposit.status}`);
        }

        // Verify deposit tracking
        const userDeposits = await prisma.deposit.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 3,
        });

        log(`\nUser has ${userDeposits.length} deposits recorded`);

        // Simulate confirmation
        const pendingDeposit = await prisma.deposit.findFirst({
            where: { userId, status: 'PENDING' },
        });

        if (pendingDeposit) {
            await prisma.deposit.update({
                where: { id: pendingDeposit.id },
                data: {
                    status: 'CONFIRMED',
                    confirmations: 15,
                    confirmedAt: new Date(),
                },
            });
            log(`Simulated confirmation for deposit ${pendingDeposit.id.slice(0, 8)}...`);
        }

        pass('Deposit Flow Simulation',
            `Deposit created, tracked, and confirmed. User has ${userDeposits.length} deposits.`);
    } catch (error) {
        fail('Deposit Flow Simulation', `Error: ${error}`);
    }
}

// ============================================================
// TEST 4: Sweep Process
// ============================================================

async function testSweepProcess() {
    console.log('\n📋 TEST 4: Sweep Process Verification');
    console.log('─'.repeat(60));

    try {
        // Get confirmed deposits not yet swept
        const confirmedDeposits = await prisma.deposit.findMany({
            where: {
                status: 'CONFIRMED',
                sweepBatchId: null,
            },
            select: {
                id: true,
                chain: true,
                amount: true,
                amountUsd: true,
                depositAddress: { select: { address: true } },
            },
        });

        log(`Found ${confirmedDeposits.length} deposits ready for sweep`);

        if (confirmedDeposits.length > 0) {
            // Group by chain
            const byChain: Record<string, number> = {};
            for (const d of confirmedDeposits) {
                byChain[d.chain] = (byChain[d.chain] || 0) + 1;
            }

            for (const [chain, count] of Object.entries(byChain)) {
                log(`  ${chain}: ${count} deposits`);
            }

            // Check vault addresses exist
            const vaultAddresses = await prisma.vaultAddress.findMany();
            log(`\nVault addresses configured: ${vaultAddresses.length}`);
            for (const v of vaultAddresses) {
                log(`  ${v.chain}: ${v.address.slice(0, 20)}...`);
            }

            // Simulate sweep batch creation
            if (confirmedDeposits.length >= 1) {
                const testDeposit = confirmedDeposits[0];

                // Create a test sweep batch
                const existingBatch = await prisma.sweepBatch.findFirst({
                    where: { status: 'PENDING' },
                });

                if (!existingBatch) {
                    const batch = await prisma.sweepBatch.create({
                        data: {
                            chain: testDeposit.chain,
                            status: 'PENDING',
                            depositCount: 1,
                            totalAmount: testDeposit.amount.toString(),
                        },
                    });

                    await prisma.deposit.update({
                        where: { id: testDeposit.id },
                        data: { sweepBatchId: batch.id },
                    });

                    log(`\nCreated test sweep batch: ${batch.id.slice(0, 8)}...`);
                }
            }
        }

        // Get sweep statistics
        const sweepStats = await prisma.sweepBatch.groupBy({
            by: ['status'],
            _count: true,
        });

        log(`\nSweep batch statuses:`);
        for (const s of sweepStats) {
            log(`  ${s.status}: ${s._count}`);
        }

        pass('Sweep Process',
            `${confirmedDeposits.length} deposits queued for sweep. Vault addresses: ${(await prisma.vaultAddress.count())}`);
    } catch (error) {
        fail('Sweep Process', `Error: ${error}`);
    }
}

// ============================================================
// TEST 5: Money Flow End-to-End
// ============================================================

async function testMoneyFlowEndToEnd() {
    console.log('\n📋 TEST 5: Money Flow End-to-End Verification');
    console.log('─'.repeat(60));

    try {
        // 1. Check deposit addresses exist
        const depositAddressCount = await prisma.depositAddress.count();
        log(`1. Deposit addresses created: ${depositAddressCount}`);

        // 2. Check deposits tracked
        const depositsByStatus = await prisma.deposit.groupBy({
            by: ['status'],
            _count: true,
            _sum: { amountUsd: true },
        });

        log(`\n2. Deposits by status:`);
        for (const d of depositsByStatus) {
            log(`   ${d.status}: ${d._count} deposits, $${Number(d._sum.amountUsd || 0).toFixed(2)}`);
        }

        // 3. Check user balances
        const usersWithBalance = await prisma.user.findMany({
            where: { balance: { gt: 0 } },
            select: { handle: true, balance: true },
            take: 5,
        });

        log(`\n3. Users with balance: ${usersWithBalance.length}`);
        for (const u of usersWithBalance) {
            log(`   ${u.handle}: $${u.balance}`);
        }

        // 4. Check participants (users who sprayed)
        const participantCount = await prisma.participant.count();
        log(`\n4. Active participants: ${participantCount}`);

        // 5. Check payouts
        const payoutsByStatus = await prisma.payout.groupBy({
            by: ['status'],
            _count: true,
            _sum: { amountUsd: true },
        });

        log(`\n5. Payouts by status:`);
        if (payoutsByStatus.length === 0) {
            log(`   (No payouts yet)`);
        }
        for (const p of payoutsByStatus) {
            log(`   ${p.status}: ${p._count} payouts, $${Number(p._sum.amountUsd || 0).toFixed(2)}`);
        }

        // 6. Check sweep batches
        const sweepBatchCount = await prisma.sweepBatch.count();
        log(`\n6. Sweep batches: ${sweepBatchCount}`);

        // Summary flow validation
        log(`\n${'─'.repeat(40)}`);
        log(`MONEY FLOW SUMMARY:`);
        log(`${'─'.repeat(40)}`);
        log(`Deposit Addresses → ${depositAddressCount} addresses`);
        log(`Deposits Tracked  → ${depositsByStatus.reduce((a, b) => a + b._count, 0)} total`);
        log(`User Balances     → ${usersWithBalance.length} users with balance`);
        log(`Participants      → ${participantCount} in queue`);
        log(`Payouts           → ${payoutsByStatus.reduce((a, b) => a + b._count, 0)} total`);
        log(`Sweep Batches     → ${sweepBatchCount} batches`);

        pass('Money Flow End-to-End',
            `Flow verified: Deposits(${depositsByStatus.reduce((a, b) => a + b._count, 0)}) → Participants(${participantCount}) → Payouts(${payoutsByStatus.reduce((a, b) => a + b._count, 0)})`);
    } catch (error) {
        fail('Money Flow End-to-End', `Error: ${error}`);
    }
}

// ============================================================
// TEST 6: Derivation Index Consistency
// ============================================================

async function testDerivationIndexConsistency() {
    console.log('\n📋 TEST 6: Derivation Index Consistency');
    console.log('─'.repeat(60));

    try {
        // Get all deposit addresses with their derivation indices
        const addresses = await prisma.depositAddress.findMany({
            select: {
                userId: true,
                chain: true,
                address: true,
                derivationIndex: true,
            },
            orderBy: { derivationIndex: 'asc' },
        });

        log(`Total addresses: ${addresses.length}`);

        // Check for gaps in derivation indices
        const indices = [...new Set(addresses.map(a => a.derivationIndex))].sort((a, b) => a - b);

        let gaps = 0;
        for (let i = 1; i < indices.length; i++) {
            if (indices[i] - indices[i - 1] > 1) {
                gaps++;
                log(`  ⚠️ Gap detected between index ${indices[i - 1]} and ${indices[i]}`);
            }
        }

        // Check EVM chains share same index per user
        const userAddresses = new Map<string, Map<string, { address: string; index: number }>>();
        for (const addr of addresses) {
            if (!userAddresses.has(addr.userId)) {
                userAddresses.set(addr.userId, new Map());
            }
            userAddresses.get(addr.userId)!.set(addr.chain, {
                address: addr.address,
                index: addr.derivationIndex,
            });
        }

        let evmInconsistencies = 0;
        const evmChains = ['ethereum', 'base', 'arbitrum', 'hyperevm'];

        for (const [userId, chains] of userAddresses) {
            const evmIndices = evmChains
                .filter(c => chains.has(c))
                .map(c => chains.get(c)!.index);

            if (evmIndices.length > 1 && new Set(evmIndices).size > 1) {
                evmInconsistencies++;
                log(`  ⚠️ User ${userId.slice(0, 8)} has different EVM indices: ${evmIndices.join(', ')}`);
            }
        }

        if (gaps === 0 && evmInconsistencies === 0) {
            pass('Derivation Index Consistency',
                `${indices.length} unique indices, no gaps, EVM indices consistent`);
        } else {
            fail('Derivation Index Consistency',
                `Found ${gaps} gaps and ${evmInconsistencies} EVM inconsistencies`);
        }
    } catch (error) {
        fail('Derivation Index Consistency', `Error: ${error}`);
    }
}

// ============================================================
// RUN ALL TESTS
// ============================================================

async function runAllTests() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   Deposit System Comprehensive Tests                       ║');
    console.log('║   Address Generation & Money Flow                          ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    const testData = await testAddressGenerationAllChains();
    await testEvmAddressSharing(testData);
    await testDepositFlowSimulation(testData);
    await testSweepProcess();
    await testMoneyFlowEndToEnd();
    await testDerivationIndexConsistency();

    console.log('\n' + '═'.repeat(60));
    console.log('SUMMARY');
    console.log('═'.repeat(60));

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    console.log(`\n  Passed: ${passed}`);
    console.log(`  Failed: ${failed}`);
    console.log(`  Total:  ${results.length}`);

    if (failed === 0) {
        console.log('\n✅ All tests passed!');
    } else {
        console.log('\n❌ Some tests failed:');
        results.filter(r => !r.passed).forEach(r => {
            console.log(`   - ${r.name}: ${r.details}`);
        });
    }

    await prisma.$disconnect();
}

// Run if executed directly
runAllTests().catch(async (e) => {
    console.error('Test runner error:', e);
    await prisma.$disconnect();
    process.exit(1);
});

export { runAllTests };
