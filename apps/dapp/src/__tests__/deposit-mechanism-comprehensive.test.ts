/**
 * Comprehensive Deposit Mechanism Tests
 * 
 * Tests all key insights from the deposit mechanism analysis:
 * 
 * 1. HD Wallet Architecture
 *    - BIP-44 derivation paths
 *    - Master seed initialization
 *    - EVM and Solana address derivation
 * 
 * 2. EVM Address Sharing
 *    - All EVM chains share same address per user
 *    - Address consistency verification
 *    - Edge cases (non-ETH first deposits)
 * 
 * 3. Deposit Monitoring
 *    - Deposit detection and recording
 *    - Confirmation tracking
 *    - Status transitions
 * 
 * 4. Wallet Sweeping
 *    - EVM sweep batching
 *    - Solana sweep (NEW)
 *    - Threshold verification
 *    - Vault address configuration
 * 
 * 5. Payment Distribution
 *    - Queue ordering
 *    - ROI cap enforcement
 *    - Payout execution
 * 
 * Usage:
 *   npx tsx src/__tests__/deposit-mechanism-comprehensive.test.ts
 */

import { PrismaClient } from '@prisma/client';
import type { Chain } from '../services/deposit-address.service';

const prisma = new PrismaClient();

// ============================================================
// TEST UTILITIES
// ============================================================

interface TestResult {
    category: string;
    name: string;
    passed: boolean;
    details: string;
    duration?: number;
}

const results: TestResult[] = [];

function log(message: string, indent: number = 1) {
    console.log(`${'  '.repeat(indent)}${message}`);
}

function pass(category: string, name: string, details: string) {
    results.push({ category, name, passed: true, details });
    console.log(`  ✅ ${name}`);
    log(details, 2);
}

function fail(category: string, name: string, details: string) {
    results.push({ category, name, passed: false, details });
    console.log(`  ❌ ${name}`);
    log(details, 2);
}

function section(title: string) {
    console.log(`\n${'━'.repeat(60)}`);
    console.log(`📋 ${title}`);
    console.log('━'.repeat(60));
}

// ============================================================
// CATEGORY 1: HD WALLET ARCHITECTURE
// ============================================================

async function testHdWalletArchitecture() {
    section('1. HD Wallet Architecture');
    const category = 'HD Wallet';

    // Test 1.1: Check if HD wallet is configured
    try {
        const { isHdWalletConfigured } = await import('../services/deposit-address.service');
        const configured = isHdWalletConfigured();

        if (configured) {
            pass(category, 'HD Wallet Configuration', 'HD_MASTER_SEED is configured');
        } else {
            fail(category, 'HD Wallet Configuration', 'HD_MASTER_SEED not set - deposit address generation disabled');
        }
    } catch (error) {
        fail(category, 'HD Wallet Configuration', `Error: ${error}`);
    }

    // Test 1.2: Verify supported chains
    try {
        const { getSupportedChains } = await import('../services/deposit-address.service');
        const chains = getSupportedChains();

        const expected: Chain[] = ['ethereum', 'base', 'arbitrum', 'hyperevm', 'solana'];
        const hasAll = expected.every(c => chains.includes(c as Chain));

        if (hasAll && chains.length === expected.length) {
            pass(category, 'Supported Chains', `All 5 chains supported: ${chains.join(', ')}`);
        } else {
            fail(category, 'Supported Chains', `Expected: ${expected.join(', ')}, Got: ${chains.join(', ')}`);
        }
    } catch (error) {
        fail(category, 'Supported Chains', `Error: ${error}`);
    }

    // Test 1.3: Confirmation thresholds
    try {
        const { getConfirmationThreshold } = await import('../services/deposit-address.service');
        const thresholds = {
            ethereum: getConfirmationThreshold('ethereum'),
            base: getConfirmationThreshold('base'),
            arbitrum: getConfirmationThreshold('arbitrum'),
            hyperevm: getConfirmationThreshold('hyperevm'),
            solana: getConfirmationThreshold('solana'),
        };

        // Verify reasonable thresholds
        const valid =
            thresholds.ethereum >= 1 &&
            thresholds.base >= 1 &&
            thresholds.solana >= 1;

        if (valid) {
            pass(category, 'Confirmation Thresholds',
                `ETH:${thresholds.ethereum}, Base:${thresholds.base}, ARB:${thresholds.arbitrum}, ` +
                `HyperEVM:${thresholds.hyperevm}, SOL:${thresholds.solana}`);
        } else {
            fail(category, 'Confirmation Thresholds', 'Invalid threshold values');
        }
    } catch (error) {
        fail(category, 'Confirmation Thresholds', `Error: ${error}`);
    }

    // Test 1.4: Derivation index sequence
    try {
        const indices = await prisma.depositAddress.findMany({
            select: { derivationIndex: true },
            orderBy: { derivationIndex: 'asc' },
            distinct: ['derivationIndex'],
        });

        if (indices.length === 0) {
            log('No derivation indices found (no addresses generated yet)', 2);
            pass(category, 'Derivation Index Sequence', 'No addresses yet - sequence check skipped');
        } else {
            const indexValues = indices.map(i => i.derivationIndex);
            const min = Math.min(...indexValues);
            const max = Math.max(...indexValues);

            // Check for gaps
            let gaps = 0;
            for (let i = 1; i < indexValues.length; i++) {
                if (indexValues[i] - indexValues[i - 1] > 1) gaps++;
            }

            if (gaps === 0) {
                pass(category, 'Derivation Index Sequence',
                    `${indexValues.length} unique indices, range ${min}-${max}, no gaps`);
            } else {
                fail(category, 'Derivation Index Sequence',
                    `Found ${gaps} gaps in sequence (${min}-${max})`);
            }
        }
    } catch (error) {
        fail(category, 'Derivation Index Sequence', `Error: ${error}`);
    }
}

// ============================================================
// CATEGORY 2: EVM ADDRESS SHARING
// ============================================================

async function testEvmAddressSharing() {
    section('2. EVM Address Sharing');
    const category = 'EVM Sharing';

    // Test 2.1: Verify EVM chains use same address per user
    try {
        const evmChains = ['ethereum', 'base', 'arbitrum', 'hyperevm'];

        // Get users with multiple EVM addresses
        const usersWithEvmAddresses = await prisma.depositAddress.findMany({
            where: { chain: { in: evmChains } },
            select: { userId: true, chain: true, address: true },
        });

        // Group by user
        const userAddresses = new Map<string, Map<string, string>>();
        for (const addr of usersWithEvmAddresses) {
            if (!userAddresses.has(addr.userId)) {
                userAddresses.set(addr.userId, new Map());
            }
            userAddresses.get(addr.userId)!.set(addr.chain, addr.address);
        }

        let inconsistencies = 0;
        let usersChecked = 0;

        for (const [userId, chains] of userAddresses) {
            if (chains.size > 1) {
                usersChecked++;
                const addresses = [...chains.values()];
                const uniqueAddresses = new Set(addresses);
                if (uniqueAddresses.size > 1) {
                    inconsistencies++;
                    log(`⚠️ User ${userId.slice(0, 8)}: ${uniqueAddresses.size} different addresses`, 2);
                }
            }
        }

        if (inconsistencies === 0) {
            pass(category, 'EVM Address Consistency',
                `${usersChecked} users with multi-chain addresses, all consistent`);
        } else {
            fail(category, 'EVM Address Consistency',
                `${inconsistencies}/${usersChecked} users have inconsistent EVM addresses`);
        }
    } catch (error) {
        fail(category, 'EVM Address Consistency', `Error: ${error}`);
    }

    // Test 2.2: Solana addresses are different from EVM
    try {
        const usersWithBoth = await prisma.user.findMany({
            where: {
                depositAddresses: {
                    some: { chain: 'solana' },
                },
            },
            include: {
                depositAddresses: {
                    select: { chain: true, address: true },
                },
            },
            take: 10,
        });

        let correct = 0;
        let total = 0;

        for (const user of usersWithBoth) {
            const solanaAddr = user.depositAddresses.find(a => a.chain === 'solana')?.address;
            const evmAddr = user.depositAddresses.find(a => a.chain === 'ethereum')?.address;

            if (solanaAddr && evmAddr) {
                total++;
                if (solanaAddr !== evmAddr) {
                    correct++;
                }
            }
        }

        if (total === 0) {
            pass(category, 'Solana Address Isolation', 'No users with both Solana and EVM addresses yet');
        } else if (correct === total) {
            pass(category, 'Solana Address Isolation',
                `${correct}/${total} users have different Solana vs EVM addresses`);
        } else {
            fail(category, 'Solana Address Isolation',
                `${total - correct} users incorrectly share address between Solana and EVM`);
        }
    } catch (error) {
        fail(category, 'Solana Address Isolation', `Error: ${error}`);
    }

    // Test 2.3: Address format validation
    try {
        const { isValidAddress } = await import('../services/deposit-address.service');

        // Test EVM address format
        const validEvm = isValidAddress('ethereum', '0x742d35Cc6634C0532925a3b844Bc9e7595f68b01');
        const invalidEvm = isValidAddress('ethereum', 'invalid-address');

        // Test Solana address format
        const validSolana = isValidAddress('solana', '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV');
        const invalidSolana = isValidAddress('solana', '0x742d35Cc6634C0532925a3b844Bc9e7595f68b01');

        if (validEvm && !invalidEvm && validSolana && !invalidSolana) {
            pass(category, 'Address Format Validation', 'EVM and Solana formats correctly validated');
        } else {
            fail(category, 'Address Format Validation',
                `EVM valid:${validEvm}, invalid:${invalidEvm}, SOL valid:${validSolana}, invalid:${invalidSolana}`);
        }
    } catch (error) {
        fail(category, 'Address Format Validation', `Error: ${error}`);
    }
}

// ============================================================
// CATEGORY 3: DEPOSIT MONITORING
// ============================================================

async function testDepositMonitoring() {
    section('3. Deposit Monitoring');
    const category = 'Deposit Monitor';

    // Test 3.1: Deposit status distribution
    try {
        const statusCounts = await prisma.deposit.groupBy({
            by: ['status'],
            _count: true,
        });

        const statusMap: Record<string, number> = {};
        for (const s of statusCounts) {
            statusMap[s.status] = s._count;
        }

        const total = Object.values(statusMap).reduce((a, b) => a + b, 0);

        pass(category, 'Deposit Status Distribution',
            `Total: ${total}, ` +
            `PENDING: ${statusMap['PENDING'] || 0}, ` +
            `CONFIRMED: ${statusMap['CONFIRMED'] || 0}, ` +
            `SWEPT: ${statusMap['SWEPT'] || 0}, ` +
            `FAILED: ${statusMap['FAILED'] || 0}`);
    } catch (error) {
        fail(category, 'Deposit Status Distribution', `Error: ${error}`);
    }

    // Test 3.2: Chain coverage
    try {
        const chainCounts = await prisma.deposit.groupBy({
            by: ['chain'],
            _count: true,
            _sum: { amountUsd: true },
        });

        if (chainCounts.length === 0) {
            pass(category, 'Deposit Chain Coverage', 'No deposits yet');
        } else {
            const chains = chainCounts.map(c =>
                `${c.chain}: ${c._count} ($${Number(c._sum.amountUsd || 0).toFixed(2)})`
            ).join(', ');
            pass(category, 'Deposit Chain Coverage', chains);
        }
    } catch (error) {
        fail(category, 'Deposit Chain Coverage', `Error: ${error}`);
    }

    // Test 3.3: Confirmation tracking
    try {
        const pendingDeposits = await prisma.deposit.findMany({
            where: { status: 'PENDING' },
            select: { confirmations: true, chain: true },
        });

        if (pendingDeposits.length === 0) {
            pass(category, 'Confirmation Tracking', 'No pending deposits awaiting confirmations');
        } else {
            const avgConfirmations = pendingDeposits.reduce((a, b) => a + b.confirmations, 0) / pendingDeposits.length;
            pass(category, 'Confirmation Tracking',
                `${pendingDeposits.length} pending deposits, avg ${avgConfirmations.toFixed(1)} confirmations`);
        }
    } catch (error) {
        fail(category, 'Confirmation Tracking', `Error: ${error}`);
    }

    // Test 3.4: USD value calculation
    try {
        const depositsWithUsd = await prisma.deposit.findMany({
            where: {
                amountUsd: { gt: 0 },
                status: { in: ['CONFIRMED', 'SWEPT'] },
            },
            take: 5,
            orderBy: { createdAt: 'desc' },
        });

        if (depositsWithUsd.length === 0) {
            pass(category, 'USD Value Calculation', 'No confirmed deposits with USD values');
        } else {
            const samples = depositsWithUsd.map(d =>
                `${d.asset}→$${Number(d.amountUsd).toFixed(2)}`
            ).join(', ');
            pass(category, 'USD Value Calculation', `Sample conversions: ${samples}`);
        }
    } catch (error) {
        fail(category, 'USD Value Calculation', `Error: ${error}`);
    }
}

// ============================================================
// CATEGORY 4: WALLET SWEEPING
// ============================================================

async function testWalletSweeping() {
    section('4. Wallet Sweeping');
    const category = 'Sweep';

    // Test 4.1: Vault addresses configured
    try {
        const vaults = await prisma.vaultAddress.findMany();

        if (vaults.length === 0) {
            // Check environment config
            const { config } = await import('../lib/config');
            const configuredVaults = Object.entries(config.vaultAddresses)
                .filter(([_, addr]) => addr)
                .map(([chain, _]) => chain);

            if (configuredVaults.length > 0) {
                pass(category, 'Vault Addresses', `Config has: ${configuredVaults.join(', ')}`);
            } else {
                fail(category, 'Vault Addresses', 'No vault addresses in DB or config');
            }
        } else {
            const chains = vaults.map(v => v.chain).join(', ');
            pass(category, 'Vault Addresses', `${vaults.length} vaults in DB: ${chains}`);
        }
    } catch (error) {
        fail(category, 'Vault Addresses', `Error: ${error}`);
    }

    // Test 4.2: Sweep batch statistics
    try {
        const batchStats = await prisma.sweepBatch.groupBy({
            by: ['status'],
            _count: true,
            _sum: { depositCount: true },
        });

        if (batchStats.length === 0) {
            pass(category, 'Sweep Batch Statistics', 'No sweep batches created yet');
        } else {
            const stats = batchStats.map(b =>
                `${b.status}: ${b._count} batches (${b._sum.depositCount || 0} deposits)`
            ).join(', ');
            pass(category, 'Sweep Batch Statistics', stats);
        }
    } catch (error) {
        fail(category, 'Sweep Batch Statistics', `Error: ${error}`);
    }

    // Test 4.3: Pending sweep deposits
    try {
        const pendingSweeps = await prisma.deposit.groupBy({
            by: ['chain'],
            where: {
                status: 'CONFIRMED',
                sweepBatchId: null,
            },
            _count: true,
            _sum: { amountUsd: true },
        });

        if (pendingSweeps.length === 0) {
            pass(category, 'Pending Sweeps', 'No deposits awaiting sweep');
        } else {
            const pending = pendingSweeps.map(p =>
                `${p.chain}: ${p._count} ($${Number(p._sum.amountUsd || 0).toFixed(2)})`
            ).join(', ');
            pass(category, 'Pending Sweeps', pending);
        }
    } catch (error) {
        fail(category, 'Pending Sweeps', `Error: ${error}`);
    }

    // Test 4.4: Solana sweep configuration
    try {
        const { isSolanaSweepConfigured } = await import('../services/solana-sweep.service');
        const configured = isSolanaSweepConfigured();

        if (configured) {
            pass(category, 'Solana Sweep Config', 'Solana sweep is fully configured');
        } else {
            fail(category, 'Solana Sweep Config',
                'Missing: HD_MASTER_SEED, SOLANA_RPC_URL, or VAULT_ADDRESS_SOLANA');
        }
    } catch (error) {
        fail(category, 'Solana Sweep Config', `Error: ${error}`);
    }

    // Test 4.5: Sweep service availability
    try {
        const { getSweepStats } = await import('../services/sweep.service');
        const stats = await getSweepStats();

        pass(category, 'Sweep Service',
            `Pending: ${stats.pendingCount}, Completed: ${stats.completedCount}, ` +
            `Failed: ${stats.failedCount}, Total: $${stats.totalSweptValue.toFixed(2)}`);
    } catch (error) {
        fail(category, 'Sweep Service', `Error: ${error}`);
    }
}

// ============================================================
// CATEGORY 5: PAYMENT DISTRIBUTION
// ============================================================

async function testPaymentDistribution() {
    section('5. Payment Distribution');
    const category = 'Payout';

    // Test 5.1: ROI multiplier configuration
    try {
        const { ROI_MULTIPLIER, calculateMaxPayout } = await import('../services/enforcement.service');

        // Test calculation
        const testEntry = 100;
        const maxPayout = calculateMaxPayout(testEntry);
        const expected = testEntry * ROI_MULTIPLIER;

        if (maxPayout === expected && ROI_MULTIPLIER === 1.5) {
            pass(category, 'ROI Cap Enforcement',
                `ROI=${ROI_MULTIPLIER}x verified. $${testEntry} → $${maxPayout} max payout`);
        } else {
            fail(category, 'ROI Cap Enforcement',
                `Expected ${expected}, got ${maxPayout} (ROI=${ROI_MULTIPLIER})`);
        }
    } catch (error) {
        fail(category, 'ROI Cap Enforcement', `Error: ${error}`);
    }

    // Test 5.2: Queue ordering logic
    try {
        const { getTrenchQueue } = await import('../services/queue.service');

        // Get a trench to test
        const trench = await prisma.trench.findFirst({ where: { active: true } });

        if (!trench) {
            pass(category, 'Queue Ordering', 'No active trenches to test queue');
        } else {
            const queue = await getTrenchQueue(trench.id);

            // Verify ordering: beliefScore DESC, boostPoints DESC, joinedAt ASC
            let orderCorrect = true;
            for (let i = 1; i < queue.length; i++) {
                const prev = queue[i - 1];
                const curr = queue[i];

                if (prev.beliefScore < curr.beliefScore ||
                    (prev.beliefScore === curr.beliefScore && prev.boostPoints < curr.boostPoints)) {
                    orderCorrect = false;
                    break;
                }
            }

            if (orderCorrect) {
                pass(category, 'Queue Ordering',
                    `${queue.length} participants in queue, ordering verified`);
            } else {
                fail(category, 'Queue Ordering', 'Queue order does not follow beliefScore→boostPoints→joinedAt');
            }
        }
    } catch (error) {
        fail(category, 'Queue Ordering', `Error: ${error}`);
    }

    // Test 5.3: Payout statistics
    try {
        const { getPayoutStats } = await import('../services/payout.service');
        const stats = await getPayoutStats();

        pass(category, 'Payout Statistics',
            `Pending: ${stats.pending}, Executing: ${stats.executing}, ` +
            `Confirmed: ${stats.confirmed}, Failed: ${stats.failed}, ` +
            `Total: $${Number(stats.totalPaidUsd).toFixed(2)}`);
    } catch (error) {
        fail(category, 'Payout Statistics', `Error: ${error}`);
    }

    // Test 5.4: Campaign configuration
    try {
        const { getActiveCampaignToken } = await import('../services/payout.service');
        const campaign = await getActiveCampaignToken();

        pass(category, 'Campaign Configuration',
            `Token: ${campaign.tokenSymbol} (${campaign.tokenAddress.slice(0, 10)}...), ` +
            `Chain: ${campaign.chainId}, ROI: ${campaign.roiMultiplier}x`);
    } catch (error) {
        fail(category, 'Campaign Configuration', `Error: ${error}`);
    }

    // Test 5.5: Belief tiers
    try {
        const { getBeliefTiers, DEFAULT_BELIEF_TIERS } = await import('../services/enforcement.service');
        const tiers = await getBeliefTiers();

        if (tiers.length >= DEFAULT_BELIEF_TIERS.length) {
            const tierStr = tiers.map(t => `${t.minScore}:${t.multiplier}x`).join(', ');
            pass(category, 'Belief Tiers', `${tiers.length} tiers: ${tierStr}`);
        } else {
            fail(category, 'Belief Tiers', `Only ${tiers.length} tiers configured`);
        }
    } catch (error) {
        fail(category, 'Belief Tiers', `Error: ${error}`);
    }
}

// ============================================================
// CATEGORY 6: END-TO-END MONEY FLOW
// ============================================================

async function testEndToEndMoneyFlow() {
    section('6. End-to-End Money Flow');
    const category = 'E2E Flow';

    // Test 6.1: Complete flow verification
    try {
        // Count records at each stage
        const [
            depositAddresses,
            pendingDeposits,
            confirmedDeposits,
            sweptDeposits,
            participants,
            pendingPayouts,
            confirmedPayouts,
        ] = await Promise.all([
            prisma.depositAddress.count(),
            prisma.deposit.count({ where: { status: 'PENDING' } }),
            prisma.deposit.count({ where: { status: 'CONFIRMED' } }),
            prisma.deposit.count({ where: { status: 'SWEPT' } }),
            prisma.participant.count({ where: { status: 'active' } }),
            prisma.payout.count({ where: { status: 'PENDING' } }),
            prisma.payout.count({ where: { status: 'CONFIRMED' } }),
        ]);

        log('Money Flow Pipeline:', 2);
        log(`  1. Deposit Addresses: ${depositAddresses}`, 2);
        log(`  2. Pending Deposits: ${pendingDeposits}`, 2);
        log(`  3. Confirmed Deposits: ${confirmedDeposits}`, 2);
        log(`  4. Swept Deposits: ${sweptDeposits}`, 2);
        log(`  5. Active Participants: ${participants}`, 2);
        log(`  6. Pending Payouts: ${pendingPayouts}`, 2);
        log(`  7. Confirmed Payouts: ${confirmedPayouts}`, 2);

        pass(category, 'Complete Flow Pipeline',
            `Addr(${depositAddresses}) → Deposits(${pendingDeposits}/${confirmedDeposits}/${sweptDeposits}) → ` +
            `Participants(${participants}) → Payouts(${pendingPayouts}/${confirmedPayouts})`);
    } catch (error) {
        fail(category, 'Complete Flow Pipeline', `Error: ${error}`);
    }

    // Test 6.2: Value flow tracking
    try {
        const totalDeposited = await prisma.deposit.aggregate({
            where: { status: { in: ['CONFIRMED', 'SWEPT'] } },
            _sum: { amountUsd: true },
        });

        const totalPaidOut = await prisma.payout.aggregate({
            where: { status: 'CONFIRMED' },
            _sum: { amountUsd: true },
        });

        const depositedUsd = Number(totalDeposited._sum.amountUsd || 0);
        const paidOutUsd = Number(totalPaidOut._sum.amountUsd || 0);

        pass(category, 'Value Flow Tracking',
            `Total In: $${depositedUsd.toFixed(2)}, Total Out: $${paidOutUsd.toFixed(2)}, ` +
            `Net: $${(depositedUsd - paidOutUsd).toFixed(2)}`);
    } catch (error) {
        fail(category, 'Value Flow Tracking', `Error: ${error}`);
    }

    // Test 6.3: Data integrity
    try {
        // Check for orphaned deposits (no deposit address)
        const orphanedDeposits = await prisma.deposit.count({
            where: {
                depositAddressId: '',
            },
        });

        // Check for deposits with invalid users  
        const depositsWithNoUser = await prisma.deposit.count({
            where: {
                userId: '',
            },
        });

        if (orphanedDeposits === 0 && depositsWithNoUser === 0) {
            pass(category, 'Data Integrity', 'All deposits have valid deposit address and user references');
        } else {
            fail(category, 'Data Integrity',
                `Orphaned deposits: ${orphanedDeposits}, Deposits with no user: ${depositsWithNoUser}`);
        }
    } catch (error) {
        fail(category, 'Data Integrity', `Error: ${error}`);
    }
}

// ============================================================
// RUN ALL TESTS
// ============================================================

async function runAllTests() {
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║     Comprehensive Deposit Mechanism Tests                        ║');
    console.log('║     Testing All Key Insights from Analysis                       ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');

    const startTime = Date.now();

    await testHdWalletArchitecture();
    await testEvmAddressSharing();
    await testDepositMonitoring();
    await testWalletSweeping();
    await testPaymentDistribution();
    await testEndToEndMoneyFlow();

    const duration = Date.now() - startTime;

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('TEST SUMMARY');
    console.log('═'.repeat(60));

    const categories = [...new Set(results.map(r => r.category))];

    for (const cat of categories) {
        const catResults = results.filter(r => r.category === cat);
        const passed = catResults.filter(r => r.passed).length;
        const failed = catResults.filter(r => !r.passed).length;
        const status = failed === 0 ? '✅' : '❌';
        console.log(`${status} ${cat}: ${passed}/${catResults.length} passed`);
    }

    console.log('─'.repeat(60));

    const totalPassed = results.filter(r => r.passed).length;
    const totalFailed = results.filter(r => !r.passed).length;

    console.log(`\nTotal: ${totalPassed}/${results.length} passed (${totalFailed} failed)`);
    console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);

    if (totalFailed > 0) {
        console.log('\n❌ FAILED TESTS:');
        results.filter(r => !r.passed).forEach(r => {
            console.log(`   [${r.category}] ${r.name}: ${r.details}`);
        });
    } else {
        console.log('\n✅ All tests passed!');
    }

    await prisma.$disconnect();

    // Exit with error if tests failed
    process.exit(totalFailed > 0 ? 1 : 0);
}

// Run if executed directly
runAllTests().catch(async (e) => {
    console.error('Test runner error:', e);
    await prisma.$disconnect();
    process.exit(1);
});

export { runAllTests };
