/**
 * Admin CRM Unit Tests
 * 
 * Verifies:
 * 1. Belief/Boost point adjustments
 * 2. Manual balance overrides
 * 3. Force exit with refund logic
 * 4. Waitlist deletion with refund logic
 * 
 * Usage:
 *   npx tsx src/__tests__/admin-crm-v45.test.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const results: { name: string; passed: boolean; details: string }[] = [];

function log(message: string) { console.log(`  ${message}`); }
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

// Helper to create test user
async function createTestUser(handle: string, balance = 0, beliefScore = 0) {
    return await prisma.user.create({
        data: { handle, balance, beliefScore }
    });
}

async function testPointAdjustments() {
    console.log('\n📋 TEST 1: Point Adjustments (Belief Score)');
    try {
        const user = await createTestUser(`crm_test_points_${Date.now()}`, 0, 100);
        log(`Created user: ${user.handle} | Belief: ${user.beliefScore}`);

        // Increment
        const updated1 = await prisma.user.update({
            where: { id: user.id },
            data: { beliefScore: { increment: 50 } }
        });
        log(`Incremented +50 | New Belief: ${updated1.beliefScore}`);

        // Decrement
        const updated2 = await prisma.user.update({
            where: { id: user.id },
            data: { beliefScore: { increment: -30 } }
        });
        log(`Decremented -30 | New Belief: ${updated2.beliefScore}`);

        if (updated2.beliefScore === 120) {
            pass('Point Adjustments', 'Belief score correctly incremented and decremented');
        } else {
            fail('Point Adjustments', `Expected 120, got ${updated2.beliefScore}`);
        }
    } catch (e) { fail('Point Adjustments', `Error: ${e}`); }
}

async function testBalanceAdjustments() {
    console.log('\n📋 TEST 2: Balance Adjustments (USD)');
    try {
        const user = await createTestUser(`crm_test_balance_${Date.now()}`, 10.50);
        log(`Created user: ${user.handle} | Balance: $${user.balance}`);

        // Increment
        const updated1 = await prisma.user.update({
            where: { id: user.id },
            data: { balance: { increment: 25.00 } }
        });
        log(`Incremented +$25.00 | New Balance: $${updated1.balance}`);

        if (Number(updated1.balance) === 35.50) {
            pass('Balance Adjustments', 'Balance correctly incremented');
        } else {
            fail('Balance Adjustments', `Expected 35.50, got ${updated1.balance}`);
        }
    } catch (e) { fail('Balance Adjustments', `Error: ${e}`); }
}

async function testForceExitRefund() {
    console.log('\n📋 TEST 3: Force Exit & Refund Logic');
    try {
        const user = await createTestUser(`crm_test_exit_${Date.now()}`, 50);
        const trench = await prisma.trench.findFirst() || await prisma.trench.create({
            data: { id: 'test_trench', name: 'TEST', level: 'RAPID', entrySize: 10, usdEntry: 10, cadence: '10m', reserves: '0', active: true }
        });

        // Create active position
        const participant = await prisma.participant.create({
            data: {
                userId: user.id,
                trenchId: trench.id,
                status: 'active',
                entryAmount: 20,
                receivedAmount: 0,
                maxPayout: 30,
                joinedAt: new Date()
            }
        });
        log(`Created active position: $${participant.entryAmount} entry`);

        // Perform Force Exit (Status change + Refund)
        const refundAmount = participant.entryAmount - participant.receivedAmount;

        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: { balance: { increment: refundAmount } }
            }),
            prisma.participant.update({
                where: { id: participant.id },
                data: { status: 'exited' }
            })
        ]);

        const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
        const updatedPart = await prisma.participant.findUnique({ where: { id: participant.id } });

        log(`Force Exited | New Status: ${updatedPart?.status} | New Balance: $${updatedUser?.balance}`);

        if (updatedPart?.status === 'exited' && Number(updatedUser?.balance) === 70) {
            pass('Force Exit Refund', 'Position status set to exited and full entry amount refunded');
        } else {
            fail('Force Exit Refund', `Refund failed. Balance: ${updatedUser?.balance}, Status: ${updatedPart?.status}`);
        }
    } catch (e) { fail('Force Exit Refund', `Error: ${e}`); }
}

async function testWaitlistRefund() {
    console.log('\n📋 TEST 4: Waitlist Deletion & Refund Logic');
    try {
        const user = await createTestUser(`crm_test_wl_${Date.now()}`, 10);
        const campaign = await prisma.campaignConfig.findFirst() || await prisma.campaignConfig.create({
            data: {
                id: `test_camp_${Date.now()}`,
                name: 'TEST',
                tokenSymbol: 'BLT',
                tokenAddress: '0x',
                chainId: 999,
                chainName: 'H',
                acceptedTokens: '[]',
                tokenDecimals: 18,
                isActive: true,
                isHidden: false,
                isPaused: false
            }
        });

        // Create secured spot
        const wl = await prisma.campaignWaitlist.create({
            data: {
                userId: user.id,
                campaignId: campaign.id,
                hasDeposited: true,
                depositAmount: '15.00',
                joinedAt: new Date()
            }
        });
        log(`Created secured spot: $${wl.depositAmount} deposit`);

        // Perform Deletion (Delete + Refund)
        const refundAmount = Number(wl.depositAmount);

        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: { balance: { increment: refundAmount } }
            }),
            prisma.campaignWaitlist.delete({
                where: { id: wl.id }
            })
        ]);

        const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
        const deletedWl = await prisma.campaignWaitlist.findUnique({ where: { id: wl.id } });

        log(`Deleted Waitlist | Found: ${!!deletedWl} | New Balance: $${updatedUser?.balance}`);

        if (!deletedWl && Number(updatedUser?.balance) === 25) {
            pass('Waitlist Refund', 'Entry deleted and deposit amount refunded to balance');
        } else {
            fail('Waitlist Refund', `Refund failed. Balance: ${updatedUser?.balance}, Found: ${!!deletedWl}`);
        }
    } catch (e) { fail('Waitlist Refund', `Error: ${e}`); }
}

async function cleanup() {
    log('\n🧹 Cleaning up test data...');
    await prisma.participant.deleteMany({ where: { user: { handle: { contains: 'crm_test' } } } });
    await prisma.campaignWaitlist.deleteMany({ where: { user: { handle: { contains: 'crm_test' } } } });
    await prisma.user.deleteMany({ where: { handle: { contains: 'crm_test' } } });
}

async function run() {
    console.log('--- ADMIN CRM CORE LOGIC TESTS ---');
    await testPointAdjustments();
    await testBalanceAdjustments();
    await testForceExitRefund();
    await testWaitlistRefund();

    console.log('\n' + '='.repeat(30));
    console.log(`SUMMARY: ${results.filter(r => r.passed).length}/${results.length} PASSED`);
    await cleanup();
    await prisma.$disconnect();
    if (results.some(r => !r.passed)) process.exit(1);
}

run();
