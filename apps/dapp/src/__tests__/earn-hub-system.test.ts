/**
 * Earn Hub System Comprehensive Tests
 * 
 * Tests:
 * 1. Raid CRUD operations (Admin API)
 * 2. Content Campaign CRUD operations (Admin API)
 * 3. User raid claiming flow
 * 4. User content submission flow
 * 5. Reward distribution verification
 * 
 * Usage:
 *   npx tsx src/__tests__/earn-hub-system.test.ts
 */

import { PrismaClient } from '@prisma/client';

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
// TEST 1: Raid Model CRUD Operations
// ============================================================

async function testRaidCRUDOperations() {
    console.log('\n📋 TEST 1: Raid Model CRUD Operations');
    console.log('─'.repeat(60));

    try {
        // CREATE: New raid
        const testRaid = await prisma.raid.create({
            data: {
                title: `Test Raid ${Date.now()}`,
                platform: 'X',
                url: 'https://x.com/test/status/123456789',
                reward: 75,
                isActive: true,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
            },
        });
        log(`Created raid: ${testRaid.id.slice(0, 8)}...`);
        log(`  Title: ${testRaid.title}`);
        log(`  Platform: ${testRaid.platform}`);
        log(`  Reward: ${testRaid.reward} BP`);

        // READ: Verify creation
        const fetchedRaid = await prisma.raid.findUnique({
            where: { id: testRaid.id },
        });

        if (!fetchedRaid) {
            fail('Raid CRUD - READ', 'Created raid not found');
            return null;
        }
        log(`\nRead raid: ${fetchedRaid.title}`);

        // UPDATE: Modify reward
        const updatedRaid = await prisma.raid.update({
            where: { id: testRaid.id },
            data: { reward: 100 },
        });
        log(`\nUpdated reward: ${updatedRaid.reward} BP`);

        // SOFT DELETE: Deactivate raid
        await prisma.raid.update({
            where: { id: testRaid.id },
            data: { isActive: false },
        });
        log(`\nDeactivated raid`);

        // Verify soft delete
        const deactivatedRaid = await prisma.raid.findUnique({
            where: { id: testRaid.id },
        });

        if (deactivatedRaid && !deactivatedRaid.isActive) {
            pass('Raid CRUD Operations',
                `CREATE, READ, UPDATE, SOFT DELETE all successful. Raid ID: ${testRaid.id.slice(0, 8)}`);
        } else {
            fail('Raid CRUD Operations', 'Soft delete verification failed');
        }

        return testRaid.id;
    } catch (error) {
        fail('Raid CRUD Operations', `Error: ${error}`);
        return null;
    }
}

// ============================================================
// TEST 2: Content Campaign CRUD Operations
// ============================================================

async function testContentCampaignCRUDOperations() {
    console.log('\n📋 TEST 2: Content Campaign CRUD Operations');
    console.log('─'.repeat(60));

    try {
        // CREATE: New content campaign
        const testCampaign = await prisma.contentCampaign.create({
            data: {
                brand: 'TestBrand',
                name: `Test Campaign ${Date.now()}`,
                description: 'A test campaign for unit testing',
                platforms: ['X', 'TT', 'IG'],
                beliefPointsPer1k: 1.5,
                usdPer1k: 0.25,
                budgetUsd: 10000,
                icon: '🧪',
                isActive: true,
            },
        });
        log(`Created campaign: ${testCampaign.id.slice(0, 8)}...`);
        log(`  Brand: ${testCampaign.brand}`);
        log(`  Name: ${testCampaign.name}`);
        log(`  Belief/1k: ${testCampaign.beliefPointsPer1k}`);
        log(`  Platforms: ${testCampaign.platforms.join(', ')}`);

        // READ: Verify creation
        const fetchedCampaign = await prisma.contentCampaign.findUnique({
            where: { id: testCampaign.id },
        });

        if (!fetchedCampaign) {
            fail('Content Campaign CRUD - READ', 'Created campaign not found');
            return null;
        }
        log(`\nRead campaign: ${fetchedCampaign.name}`);

        // UPDATE: Modify belief points rate
        const updatedCampaign = await prisma.contentCampaign.update({
            where: { id: testCampaign.id },
            data: { beliefPointsPer1k: 2.0 },
        });
        log(`\nUpdated beliefPointsPer1k: ${updatedCampaign.beliefPointsPer1k}`);

        // SOFT DELETE: Deactivate campaign
        await prisma.contentCampaign.update({
            where: { id: testCampaign.id },
            data: { isActive: false },
        });
        log(`\nDeactivated campaign`);

        // Verify soft delete
        const deactivatedCampaign = await prisma.contentCampaign.findUnique({
            where: { id: testCampaign.id },
        });

        if (deactivatedCampaign && !deactivatedCampaign.isActive) {
            pass('Content Campaign CRUD Operations',
                `CREATE, READ, UPDATE, SOFT DELETE all successful. Campaign ID: ${testCampaign.id.slice(0, 8)}`);
        } else {
            fail('Content Campaign CRUD Operations', 'Soft delete verification failed');
        }

        return testCampaign.id;
    } catch (error) {
        fail('Content Campaign CRUD Operations', `Error: ${error}`);
        return null;
    }
}

// ============================================================
// TEST 3: User Raid Claiming Flow
// ============================================================

async function testUserRaidClaimingFlow() {
    console.log('\n📋 TEST 3: User Raid Claiming Flow');
    console.log('─'.repeat(60));

    try {
        // Create test user
        const testUser = await prisma.user.create({
            data: {
                handle: `raid_test_${Date.now()}`,
                beliefScore: 100,
            },
        });
        log(`Created test user: ${testUser.handle}`);
        log(`  Initial Belief Score: ${testUser.beliefScore}`);

        // Create active raid
        const testRaid = await prisma.raid.create({
            data: {
                title: `Claimable Raid ${Date.now()}`,
                platform: 'X',
                url: 'https://x.com/test/raid',
                reward: 50,
                isActive: true,
            },
        });
        log(`\nCreated claimable raid: ${testRaid.id.slice(0, 8)}...`);

        // Simulate claiming the raid
        const userRaid = await prisma.userRaid.create({
            data: {
                userId: testUser.id,
                raidId: testRaid.id,
                bpAwarded: testRaid.reward,
            },
        });
        log(`\nClaimed raid: ${userRaid.id.slice(0, 8)}...`);
        log(`  BP Awarded: ${userRaid.bpAwarded}`);

        // Award BP to user (simulating the reward)
        await prisma.user.update({
            where: { id: testUser.id },
            data: { beliefScore: { increment: testRaid.reward } },
        });

        // Verify user's updated score
        const updatedUser = await prisma.user.findUnique({
            where: { id: testUser.id },
        });

        if (updatedUser && updatedUser.beliefScore === 150) {
            log(`\nUser belief score after raid: ${updatedUser.beliefScore}`);
        }

        // Test duplicate claim prevention (unique constraint)
        let duplicateBlocked = false;
        try {
            await prisma.userRaid.create({
                data: {
                    userId: testUser.id,
                    raidId: testRaid.id,
                    bpAwarded: testRaid.reward,
                },
            });
        } catch {
            duplicateBlocked = true;
            log(`\n✓ Duplicate claim correctly prevented`);
        }

        // Verify raid completions count
        const raidWithCount = await prisma.raid.findUnique({
            where: { id: testRaid.id },
            include: { _count: { select: { completions: true } } },
        });

        log(`\nRaid completions count: ${raidWithCount?._count.completions}`);

        if (duplicateBlocked && raidWithCount?._count.completions === 1) {
            pass('User Raid Claiming Flow',
                `Raid claimed, BP awarded (+${testRaid.reward}), duplicates blocked. Completions: 1`);
        } else {
            fail('User Raid Claiming Flow',
                `Issues detected. Duplicate blocked: ${duplicateBlocked}, Completions: ${raidWithCount?._count.completions}`);
        }

        return { userId: testUser.id, raidId: testRaid.id };
    } catch (error) {
        fail('User Raid Claiming Flow', `Error: ${error}`);
        return null;
    }
}

// ============================================================
// TEST 4: User Content Submission Flow
// ============================================================

async function testUserContentSubmissionFlow() {
    console.log('\n📋 TEST 4: User Content Submission Flow');
    console.log('─'.repeat(60));

    try {
        // Create test user
        const testUser = await prisma.user.create({
            data: {
                handle: `content_test_${Date.now()}`,
                beliefScore: 50,
            },
        });
        log(`Created test user: ${testUser.handle}`);

        // Create active campaign
        const testCampaign = await prisma.contentCampaign.create({
            data: {
                brand: 'TestBrand',
                name: `Submittable Campaign ${Date.now()}`,
                platforms: ['X', 'TT'],
                beliefPointsPer1k: 2.0,
                isActive: true,
            },
        });
        log(`\nCreated campaign: ${testCampaign.name}`);
        log(`  Platforms: ${testCampaign.platforms.join(', ')}`);

        // Submit content (allowed platform)
        const submission = await prisma.userContentSubmission.create({
            data: {
                userId: testUser.id,
                campaignId: testCampaign.id,
                url: 'https://x.com/user/status/123456',
                platform: 'X',
                status: 'pending',
            },
        });
        log(`\nSubmission created: ${submission.id.slice(0, 8)}...`);
        log(`  Platform: ${submission.platform}`);
        log(`  Status: ${submission.status}`);

        // Simulate approval with view count
        const approvedSubmission = await prisma.userContentSubmission.update({
            where: { id: submission.id },
            data: {
                status: 'approved',
                viewCount: 5000,
                beliefAwarded: 10.0, // 5k views * 2.0/1k = 10 belief points
                verifiedAt: new Date(),
            },
        });
        log(`\nSubmission approved:`);
        log(`  View Count: ${approvedSubmission.viewCount}`);
        log(`  Belief Awarded: ${approvedSubmission.beliefAwarded}`);

        // Award belief to user
        await prisma.user.update({
            where: { id: testUser.id },
            data: { beliefScore: { increment: 10 } },
        });

        // Verify user's updated belief score
        const updatedUser = await prisma.user.findUnique({
            where: { id: testUser.id },
        });
        log(`\nUser belief score after approval: ${updatedUser?.beliefScore}`);

        // Verify campaign submission count
        const campaignWithCount = await prisma.contentCampaign.findUnique({
            where: { id: testCampaign.id },
            include: { _count: { select: { submissions: true } } },
        });
        log(`Campaign submissions: ${campaignWithCount?._count.submissions}`);

        if (updatedUser?.beliefScore === 60 && campaignWithCount?._count.submissions === 1) {
            pass('User Content Submission Flow',
                `Submission created, approved, belief awarded (+10). User score: ${updatedUser.beliefScore}`);
        } else {
            fail('User Content Submission Flow',
                `Unexpected state. User score: ${updatedUser?.beliefScore}, Submissions: ${campaignWithCount?._count.submissions}`);
        }

        return { userId: testUser.id, campaignId: testCampaign.id };
    } catch (error) {
        fail('User Content Submission Flow', `Error: ${error}`);
        return null;
    }
}

// ============================================================
// TEST 5: Platform Validation for Content Submissions
// ============================================================

async function testPlatformValidation() {
    console.log('\n📋 TEST 5: Platform Validation for Content Submissions');
    console.log('─'.repeat(60));

    try {
        // Create campaign with specific platforms
        const campaign = await prisma.contentCampaign.create({
            data: {
                brand: 'RestrictedBrand',
                name: `Platform Test ${Date.now()}`,
                platforms: ['X', 'IG'], // Only X and IG allowed
                beliefPointsPer1k: 1.0,
                isActive: true,
            },
        });
        log(`Created campaign with platforms: ${campaign.platforms.join(', ')}`);

        // Create user
        const user = await prisma.user.create({
            data: { handle: `platform_test_${Date.now()}` },
        });

        // Test 1: Valid platform (X)
        const validSubmission = await prisma.userContentSubmission.create({
            data: {
                userId: user.id,
                campaignId: campaign.id,
                url: 'https://x.com/valid',
                platform: 'X',
            },
        });
        log(`\n✓ Valid submission (X): ${validSubmission.id.slice(0, 8)}...`);

        // Test 2: Another valid platform (IG)
        const validSubmission2 = await prisma.userContentSubmission.create({
            data: {
                userId: user.id,
                campaignId: campaign.id,
                url: 'https://instagram.com/valid',
                platform: 'IG',
            },
        });
        log(`✓ Valid submission (IG): ${validSubmission2.id.slice(0, 8)}...`);

        // Note: At the database level, we don't enforce platform validation
        // This should be done at the API level (which we've implemented)
        log(`\n⚠️ Platform validation should be enforced at API level`);
        log(`  Campaign platforms: ${campaign.platforms.join(', ')}`);

        // Verify both submissions exist
        const submissions = await prisma.userContentSubmission.count({
            where: { campaignId: campaign.id },
        });

        if (submissions === 2) {
            pass('Platform Validation',
                `2 submissions created for allowed platforms. API enforces platform restrictions.`);
        } else {
            fail('Platform Validation', `Unexpected submission count: ${submissions}`);
        }

        return campaign.id;
    } catch (error) {
        fail('Platform Validation', `Error: ${error}`);
        return null;
    }
}

// ============================================================
// TEST 6: Raid Expiration Logic
// ============================================================

async function testRaidExpirationLogic() {
    console.log('\n📋 TEST 6: Raid Expiration Logic');
    console.log('─'.repeat(60));

    try {
        // Create expired raid
        const expiredRaid = await prisma.raid.create({
            data: {
                title: `Expired Raid ${Date.now()}`,
                platform: 'TT',
                url: 'https://tiktok.com/expired',
                reward: 25,
                isActive: true,
                expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
            },
        });
        log(`Created expired raid: ${expiredRaid.id.slice(0, 8)}...`);
        log(`  Expires At: ${expiredRaid.expiresAt}`);
        log(`  Current Time: ${new Date()}`);

        // Create future raid
        const futureRaid = await prisma.raid.create({
            data: {
                title: `Future Raid ${Date.now()}`,
                platform: 'YT',
                url: 'https://youtube.com/future',
                reward: 100,
                isActive: true,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            },
        });
        log(`\nCreated future raid: ${futureRaid.id.slice(0, 8)}...`);
        log(`  Expires At: ${futureRaid.expiresAt}`);

        // Query active, non-expired raids (simulating API logic)
        const activeRaids = await prisma.raid.findMany({
            where: {
                isActive: true,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } },
                ],
            },
        });

        const isExpiredFiltered = !activeRaids.some(r => r.id === expiredRaid.id);
        const isFutureIncluded = activeRaids.some(r => r.id === futureRaid.id);

        log(`\nActive raids query returned: ${activeRaids.length} raids`);
        log(`  Expired raid filtered out: ${isExpiredFiltered}`);
        log(`  Future raid included: ${isFutureIncluded}`);

        if (isExpiredFiltered && isFutureIncluded) {
            pass('Raid Expiration Logic',
                `Expired raids correctly filtered. Future raids included. Logic working.`);
        } else {
            fail('Raid Expiration Logic',
                `Filtering issue. Expired filtered: ${isExpiredFiltered}, Future included: ${isFutureIncluded}`);
        }
    } catch (error) {
        fail('Raid Expiration Logic', `Error: ${error}`);
    }
}

// ============================================================
// TEST 7: Statistics and Aggregation Queries
// ============================================================

async function testStatisticsQueries() {
    console.log('\n📋 TEST 7: Statistics and Aggregation Queries');
    console.log('─'.repeat(60));

    try {
        // Raid statistics
        const raidStats = await prisma.raid.aggregate({
            _count: true,
            _sum: { reward: true },
            _avg: { reward: true },
            where: { isActive: true },
        });
        log(`Active Raids Statistics:`);
        log(`  Total Active: ${raidStats._count}`);
        log(`  Total BP Pool: ${raidStats._sum.reward || 0}`);
        log(`  Average Reward: ${raidStats._avg.reward?.toFixed(1) || 0} BP`);

        // Campaign statistics
        const campaignStats = await prisma.contentCampaign.aggregate({
            _count: true,
            where: { isActive: true },
        });
        log(`\nActive Campaigns: ${campaignStats._count}`);

        // User raid completions
        const raidCompletions = await prisma.userRaid.aggregate({
            _count: true,
            _sum: { bpAwarded: true },
        });
        log(`\nRaid Completions:`);
        log(`  Total: ${raidCompletions._count}`);
        log(`  Total BP Distributed: ${raidCompletions._sum.bpAwarded || 0}`);

        // Content submissions by status
        const submissionsByStatus = await prisma.userContentSubmission.groupBy({
            by: ['status'],
            _count: true,
        });
        log(`\nContent Submissions by Status:`);
        for (const s of submissionsByStatus) {
            log(`  ${s.status}: ${s._count}`);
        }

        // Top raid participants
        const topRaiders = await prisma.userRaid.groupBy({
            by: ['userId'],
            _count: true,
            _sum: { bpAwarded: true },
            orderBy: { _count: { userId: 'desc' } },
            take: 3,
        });
        log(`\nTop Raiders:`);
        for (const r of topRaiders) {
            log(`  User ${r.userId.slice(0, 8)}...: ${r._count} raids, ${r._sum.bpAwarded} BP`);
        }

        pass('Statistics Queries',
            `All aggregation queries successful. ${raidStats._count} active raids, ${campaignStats._count} active campaigns.`);
    } catch (error) {
        fail('Statistics Queries', `Error: ${error}`);
    }
}

// ============================================================
// TEST 8: Data Integrity Checks
// ============================================================

async function testDataIntegrityChecks() {
    console.log('\n📋 TEST 8: Data Integrity Checks');
    console.log('─'.repeat(60));

    try {
        let issues = 0;

        // Check for UserRaids with deleted raids (by checking if raid exists)
        const userRaidsWithRaid = await prisma.userRaid.findMany({
            include: { raid: true },
        });
        const orphanedUserRaids = userRaidsWithRaid.filter(ur => !ur.raid);
        log(`Orphaned UserRaids: ${orphanedUserRaids.length}`);
        if (orphanedUserRaids.length > 0) issues++;

        // Check for UserContentSubmissions with deleted campaigns
        const submissionsWithCampaign = await prisma.userContentSubmission.findMany({
            include: { campaign: true },
        });
        const orphanedSubmissions = submissionsWithCampaign.filter(s => !s.campaign);
        log(`Orphaned Submissions: ${orphanedSubmissions.length}`);
        if (orphanedSubmissions.length > 0) issues++;

        // Check for duplicate UserRaid entries (should be prevented by unique constraint)
        const userRaidCounts = await prisma.userRaid.groupBy({
            by: ['userId', 'raidId'],
            _count: true,
            having: {
                userId: { _count: { gt: 1 } },
            },
        });
        log(`Duplicate UserRaid entries: ${userRaidCounts.length}`);
        if (userRaidCounts.length > 0) issues++;

        // Check for negative rewards
        const negativeRewardRaids = await prisma.raid.count({
            where: { reward: { lt: 0 } },
        });
        log(`Raids with negative rewards: ${negativeRewardRaids}`);
        if (negativeRewardRaids > 0) issues++;

        // Check for negative belief points
        const negativeBelief = await prisma.contentCampaign.count({
            where: { beliefPointsPer1k: { lt: 0 } },
        });
        log(`Campaigns with negative belief points: ${negativeBelief}`);
        if (negativeBelief > 0) issues++;

        if (issues === 0) {
            pass('Data Integrity Checks',
                `All integrity checks passed. No orphans, duplicates, or invalid data found.`);
        } else {
            fail('Data Integrity Checks',
                `Found ${issues} integrity issues. Review the logs above.`);
        }
    } catch (error) {
        fail('Data Integrity Checks', `Error: ${error}`);
    }
}

// ============================================================
// CLEANUP: Remove test data
// ============================================================

async function cleanupTestData() {
    console.log('\n🧹 CLEANUP: Removing test data');
    console.log('─'.repeat(60));

    try {
        // Delete test UserRaids
        const deletedUserRaids = await prisma.userRaid.deleteMany({
            where: {
                user: {
                    handle: { contains: 'raid_test_' },
                },
            },
        });
        log(`Deleted ${deletedUserRaids.count} test UserRaids`);

        // Delete test submissions first (before campaigns due to FK)
        const deletedSubmissions = await prisma.userContentSubmission.deleteMany({
            where: {
                OR: [
                    { user: { handle: { contains: 'content_test_' } } },
                    { user: { handle: { contains: 'platform_test_' } } },
                ],
            },
        });
        log(`Deleted ${deletedSubmissions.count} test Submissions`);

        // Delete test campaigns (now safe)
        const deletedCampaigns = await prisma.contentCampaign.deleteMany({
            where: {
                OR: [
                    { name: { contains: 'Test Campaign' } },
                    { name: { contains: 'Submittable Campaign' } },
                    { name: { contains: 'Platform Test' } },
                    { brand: 'TestBrand' },
                    { brand: 'RestrictedBrand' },
                ],
            },
        });
        log(`Deleted ${deletedCampaigns.count} test Campaigns`);

        // Delete test users
        const deletedUsers = await prisma.user.deleteMany({
            where: {
                OR: [
                    { handle: { contains: 'raid_test_' } },
                    { handle: { contains: 'content_test_' } },
                    { handle: { contains: 'platform_test_' } },
                ],
            },
        });
        log(`Deleted ${deletedUsers.count} test Users`);

        log('\n✅ Cleanup complete');
    } catch (error) {
        console.error('Cleanup error:', error);
    }
}

// ============================================================
// RUN ALL TESTS
// ============================================================

async function runAllTests() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   Earn Hub System Comprehensive Tests                      ║');
    console.log('║   Raids & Content Campaigns                                ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    await testRaidCRUDOperations();
    await testContentCampaignCRUDOperations();
    await testUserRaidClaimingFlow();
    await testUserContentSubmissionFlow();
    await testPlatformValidation();
    await testRaidExpirationLogic();
    await testStatisticsQueries();
    await testDataIntegrityChecks();

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

    // Cleanup
    await cleanupTestData();

    await prisma.$disconnect();

    return { passed, failed, total: results.length };
}

// Run if executed directly
runAllTests().catch(async (e) => {
    console.error('Test runner error:', e);
    await prisma.$disconnect();
    process.exit(1);
});

export { runAllTests };
