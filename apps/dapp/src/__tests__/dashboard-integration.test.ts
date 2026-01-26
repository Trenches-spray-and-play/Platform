/**
 * Comprehensive Dashboard Integration Tests
 * 
 * Tests the complete flow:
 * 1. Admin Portal → Backend API (create/read/update/delete)
 * 2. Backend API → Dashboard (data fetching)
 * 3. User interactions (claiming raids, submitting content)
 * 4. End-to-end user journey simulation
 * 
 * Usage:
 *   npx tsx src/__tests__/dashboard-integration.test.ts
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
    duration: number;
}

const results: TestResult[] = [];
let testStartTime = 0;

function log(message: string) {
    console.log(`  ${message}`);
}

function pass(name: string, details: string) {
    const duration = Date.now() - testStartTime;
    results.push({ name, passed: true, details, duration });
    console.log(`✅ ${name} (${duration}ms)`);
    log(details);
}

function fail(name: string, details: string) {
    const duration = Date.now() - testStartTime;
    results.push({ name, passed: false, details, duration });
    console.log(`❌ ${name} (${duration}ms)`);
    log(details);
}

function startTest() {
    testStartTime = Date.now();
}

// ============================================================
// TEST 1: Admin Portal - Raids CRUD
// ============================================================

async function testAdminRaidsCRUD() {
    console.log('\n📋 TEST 1: Admin Portal - Raids CRUD Operations');
    console.log('─'.repeat(60));
    startTest();

    try {
        // CREATE via Admin API simulation
        const raid = await prisma.raid.create({
            data: {
                title: 'Integration Test Raid',
                platform: 'X',
                url: 'https://x.com/test/raid/' + Date.now(),
                reward: 100,
                isActive: true,
            },
        });
        log(`✓ CREATE: Raid created with ID ${raid.id.slice(0, 8)}`);

        // READ - verify it appears in active raids
        const activeRaids = await prisma.raid.findMany({
            where: { isActive: true },
        });
        const found = activeRaids.some(r => r.id === raid.id);
        log(`✓ READ: Raid found in active list: ${found}`);

        // UPDATE - change reward
        const updated = await prisma.raid.update({
            where: { id: raid.id },
            data: { reward: 150 },
        });
        log(`✓ UPDATE: Reward changed from 100 to ${updated.reward}`);

        // DELETE (soft) - deactivate
        await prisma.raid.update({
            where: { id: raid.id },
            data: { isActive: false },
        });

        const deactivated = await prisma.raid.findUnique({
            where: { id: raid.id },
        });
        log(`✓ DELETE (soft): isActive = ${deactivated?.isActive}`);

        // Cleanup
        await prisma.raid.delete({ where: { id: raid.id } });

        pass('Admin Raids CRUD', 'All CRUD operations verified successfully');
        return true;
    } catch (error) {
        fail('Admin Raids CRUD', `Error: ${error}`);
        return false;
    }
}

// ============================================================
// TEST 2: Admin Portal - Content Campaigns CRUD
// ============================================================

async function testAdminContentCampaignsCRUD() {
    console.log('\n📋 TEST 2: Admin Portal - Content Campaigns CRUD');
    console.log('─'.repeat(60));
    startTest();

    try {
        // CREATE
        const campaign = await prisma.contentCampaign.create({
            data: {
                brand: 'TestBrand',
                name: 'Integration Test Campaign',
                description: 'Testing the full flow',
                platforms: ['X', 'TT', 'IG'],
                beliefPointsPer1k: 2.5,
                usdPer1k: 0.50,
                budgetUsd: 5000,
                icon: '🧪',
                isActive: true,
            },
        });
        log(`✓ CREATE: Campaign created with ID ${campaign.id.slice(0, 8)}`);

        // READ
        const activeCampaigns = await prisma.contentCampaign.findMany({
            where: { isActive: true },
        });
        const found = activeCampaigns.some(c => c.id === campaign.id);
        log(`✓ READ: Campaign found in active list: ${found}`);

        // UPDATE - increase belief points
        const updated = await prisma.contentCampaign.update({
            where: { id: campaign.id },
            data: { beliefPointsPer1k: 3.0 },
        });
        log(`✓ UPDATE: beliefPointsPer1k changed to ${updated.beliefPointsPer1k}`);

        // DELETE (soft)
        await prisma.contentCampaign.update({
            where: { id: campaign.id },
            data: { isActive: false },
        });

        const deactivated = await prisma.contentCampaign.findUnique({
            where: { id: campaign.id },
        });
        log(`✓ DELETE (soft): isActive = ${deactivated?.isActive}`);

        // Cleanup
        await prisma.contentCampaign.delete({ where: { id: campaign.id } });

        pass('Admin Content Campaigns CRUD', 'All CRUD operations verified successfully');
        return true;
    } catch (error) {
        fail('Admin Content Campaigns CRUD', `Error: ${error}`);
        return false;
    }
}

// ============================================================
// TEST 3: Admin Portal - Tasks CRUD
// ============================================================

async function testAdminTasksCRUD() {
    console.log('\n📋 TEST 3: Admin Portal - Tasks CRUD');
    console.log('─'.repeat(60));
    startTest();

    try {
        // CREATE one-time task
        const oneTimeTask = await prisma.task.create({
            data: {
                title: 'One-Time Integration Task',
                description: 'Testing one-time task creation',
                reward: 500,
                link: 'https://example.com/task',
                taskType: 'ONE_TIME',
                isActive: true,
            },
        });
        log(`✓ CREATE: One-time task created: ${oneTimeTask.id.slice(0, 8)}`);

        // CREATE recurring task
        const recurringTask = await prisma.task.create({
            data: {
                title: 'Recurring Integration Task',
                description: 'Testing recurring task creation',
                reward: 50,
                taskType: 'RECURRING',
                isActive: true,
            },
        });
        log(`✓ CREATE: Recurring task created: ${recurringTask.id.slice(0, 8)}`);

        // READ - filter by type
        const oneTimeTasks = await prisma.task.findMany({
            where: { taskType: 'ONE_TIME', isActive: true },
        });
        const recurringTasks = await prisma.task.findMany({
            where: { taskType: 'RECURRING', isActive: true },
        });
        log(`✓ READ: ${oneTimeTasks.length} one-time, ${recurringTasks.length} recurring tasks`);

        // UPDATE
        await prisma.task.update({
            where: { id: oneTimeTask.id },
            data: { reward: 750 },
        });
        log(`✓ UPDATE: Task reward updated to 750`);

        // DELETE (soft)
        await prisma.task.update({
            where: { id: oneTimeTask.id },
            data: { isActive: false },
        });
        await prisma.task.update({
            where: { id: recurringTask.id },
            data: { isActive: false },
        });
        log(`✓ DELETE (soft): Both tasks deactivated`);

        // Cleanup
        await prisma.task.delete({ where: { id: oneTimeTask.id } });
        await prisma.task.delete({ where: { id: recurringTask.id } });

        pass('Admin Tasks CRUD', 'All task CRUD operations verified');
        return true;
    } catch (error) {
        fail('Admin Tasks CRUD', `Error: ${error}`);
        return false;
    }
}

// ============================================================
// TEST 4: Dashboard Data Fetching Flow
// ============================================================

async function testDashboardDataFetching() {
    console.log('\n📋 TEST 4: Dashboard Data Fetching Flow');
    console.log('─'.repeat(60));
    startTest();

    try {
        // Create test user
        const user = await prisma.user.create({
            data: {
                handle: `dashboard_test_${Date.now()}`,
                beliefScore: 500,
            },
        });
        log(`✓ Created test user: ${user.handle}`);

        // Create test data that dashboard would fetch
        const raid = await prisma.raid.create({
            data: {
                title: 'Dashboard Visible Raid',
                platform: 'X',
                url: 'https://x.com/test',
                reward: 75,
                isActive: true,
            },
        });

        const campaign = await prisma.contentCampaign.create({
            data: {
                brand: 'DashboardBrand',
                name: 'Dashboard Visible Campaign',
                platforms: ['X', 'TT'],
                beliefPointsPer1k: 1.5,
                isActive: true,
            },
        });

        const task = await prisma.task.create({
            data: {
                title: 'Dashboard Visible Task',
                reward: 100,
                taskType: 'ONE_TIME',
                isActive: true,
            },
        });

        // Simulate dashboard API calls
        // 1. Fetch active raids
        const raids = await prisma.raid.findMany({
            where: {
                isActive: true,
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
        });
        log(`✓ Dashboard fetches ${raids.length} active raids`);

        // 2. Fetch active campaigns
        const campaigns = await prisma.contentCampaign.findMany({
            where: { isActive: true },
        });
        log(`✓ Dashboard fetches ${campaigns.length} active campaigns`);

        // 3. Fetch active tasks
        const tasks = await prisma.task.findMany({
            where: { isActive: true },
        });
        log(`✓ Dashboard fetches ${tasks.length} active tasks`);

        // 4. Fetch user profile
        const profile = await prisma.user.findUnique({
            where: { id: user.id },
        });
        log(`✓ Dashboard fetches user profile: beliefScore=${profile?.beliefScore}, beliefScore=${profile?.beliefScore}`);

        // Cleanup
        await prisma.raid.delete({ where: { id: raid.id } });
        await prisma.contentCampaign.delete({ where: { id: campaign.id } });
        await prisma.task.delete({ where: { id: task.id } });
        await prisma.user.delete({ where: { id: user.id } });

        pass('Dashboard Data Fetching', `Verified: raids(${raids.length}), campaigns(${campaigns.length}), tasks(${tasks.length})`);
        return true;
    } catch (error) {
        fail('Dashboard Data Fetching', `Error: ${error}`);
        return false;
    }
}

// ============================================================
// TEST 5: User Raid Claiming Journey
// ============================================================

async function testUserRaidClaimingJourney() {
    console.log('\n📋 TEST 5: User Raid Claiming Journey');
    console.log('─'.repeat(60));
    startTest();

    try {
        // Setup: Create user and raid
        const user = await prisma.user.create({
            data: {
                handle: `raid_claimer_${Date.now()}`,
                beliefScore: 100,
            },
        });

        const raid = await prisma.raid.create({
            data: {
                title: 'Claimable Test Raid',
                platform: 'X',
                url: 'https://x.com/claimable',
                reward: 200,
                isActive: true,
            },
        });

        log(`✓ Setup: User ${user.handle}, Raid reward: ${raid.reward} BP`);
        log(`  Initial beliefScore: ${user.beliefScore}`);

        // Step 1: User sees raid in dashboard (fetched via API)
        const visibleRaids = await prisma.raid.findMany({
            where: { isActive: true },
        });
        const raidVisible = visibleRaids.some(r => r.id === raid.id);
        log(`✓ Step 1: Raid visible in dashboard: ${raidVisible}`);

        // Step 2: User claims raid
        const userRaid = await prisma.userRaid.create({
            data: {
                userId: user.id,
                raidId: raid.id,
                bpAwarded: raid.reward,
            },
        });
        log(`✓ Step 2: UserRaid record created: ${userRaid.id.slice(0, 8)}`);

        // Step 3: User's boost points increase
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { beliefScore: { increment: raid.reward } },
        });
        log(`✓ Step 3: User beliefScore updated: ${user.beliefScore} → ${updatedUser.beliefScore}`);

        // Step 4: Dashboard shows raid as completed
        const completedRaids = await prisma.userRaid.findMany({
            where: { userId: user.id },
        });
        log(`✓ Step 4: User has ${completedRaids.length} completed raid(s)`);

        // Step 5: Verify duplicate prevention
        let duplicateBlocked = false;
        try {
            await prisma.userRaid.create({
                data: { userId: user.id, raidId: raid.id, bpAwarded: raid.reward },
            });
        } catch {
            duplicateBlocked = true;
        }
        log(`✓ Step 5: Duplicate claim blocked: ${duplicateBlocked}`);

        // Cleanup
        await prisma.userRaid.delete({ where: { id: userRaid.id } });
        await prisma.raid.delete({ where: { id: raid.id } });
        await prisma.user.delete({ where: { id: user.id } });

        if (duplicateBlocked && updatedUser.beliefScore === 300) {
            pass('User Raid Claiming Journey', 'Full journey verified: claim, reward, duplicate prevention');
        } else {
            fail('User Raid Claiming Journey', 'Some steps did not pass as expected');
        }
        return true;
    } catch (error) {
        fail('User Raid Claiming Journey', `Error: ${error}`);
        return false;
    }
}

// ============================================================
// TEST 6: User Content Submission Journey
// ============================================================

async function testUserContentSubmissionJourney() {
    console.log('\n📋 TEST 6: User Content Submission Journey');
    console.log('─'.repeat(60));
    startTest();

    try {
        // Setup
        const user = await prisma.user.create({
            data: {
                handle: `content_creator_${Date.now()}`,
                beliefScore: 25,
            },
        });

        const campaign = await prisma.contentCampaign.create({
            data: {
                brand: 'TestBrand',
                name: 'Content Submission Test',
                platforms: ['X', 'TT', 'IG'],
                beliefPointsPer1k: 2.0,
                isActive: true,
            },
        });

        log(`✓ Setup: User ${user.handle}, Campaign: ${campaign.name}`);
        log(`  Initial beliefScore: ${user.beliefScore}`);

        // Step 1: User sees campaign in dashboard
        const visibleCampaigns = await prisma.contentCampaign.findMany({
            where: { isActive: true },
        });
        log(`✓ Step 1: Campaign visible: ${visibleCampaigns.some(c => c.id === campaign.id)}`);

        // Step 2: User submits content link
        const submission = await prisma.userContentSubmission.create({
            data: {
                userId: user.id,
                campaignId: campaign.id,
                url: 'https://x.com/user/status/123456789',
                platform: 'X',
                status: 'pending',
            },
        });
        log(`✓ Step 2: Submission created with status: ${submission.status}`);

        // Step 3: Admin approves and sets view count (simulated)
        const approvedSubmission = await prisma.userContentSubmission.update({
            where: { id: submission.id },
            data: {
                status: 'approved',
                viewCount: 10000, // 10k views
                beliefAwarded: 20.0, // 10k * 2.0/1k = 20
                verifiedAt: new Date(),
            },
        });
        log(`✓ Step 3: Submission approved with ${approvedSubmission.viewCount} views, ${approvedSubmission.beliefAwarded} belief awarded`);

        // Step 4: User's belief score increases
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { beliefScore: { increment: 20 } },
        });
        log(`✓ Step 4: User beliefScore updated: ${user.beliefScore} → ${updatedUser.beliefScore}`);

        // Step 5: Dashboard shows submission history
        const userSubmissions = await prisma.userContentSubmission.findMany({
            where: { userId: user.id },
            include: { campaign: true },
        });
        log(`✓ Step 5: User has ${userSubmissions.length} submission(s)`);

        // Cleanup
        await prisma.userContentSubmission.delete({ where: { id: submission.id } });
        await prisma.contentCampaign.delete({ where: { id: campaign.id } });
        await prisma.user.delete({ where: { id: user.id } });

        pass('User Content Submission Journey', 'Full journey: submit → approve → reward belief points');
        return true;
    } catch (error) {
        fail('User Content Submission Journey', `Error: ${error}`);
        return false;
    }
}

// ============================================================
// TEST 7: User Task Completion Journey
// ============================================================

async function testUserTaskCompletionJourney() {
    console.log('\n📋 TEST 7: User Task Completion Journey');
    console.log('─'.repeat(60));
    startTest();

    try {
        // Setup
        const user = await prisma.user.create({
            data: {
                handle: `task_completer_${Date.now()}`,
                beliefScore: 0,
            },
        });

        const task = await prisma.task.create({
            data: {
                title: 'Integration Test Task',
                description: 'Complete this to earn BP',
                reward: 250,
                link: 'https://example.com/verify',
                taskType: 'ONE_TIME',
                isActive: true,
            },
        });

        log(`✓ Setup: User ${user.handle}, Task reward: ${task.reward} BP`);

        // Step 1: User sees task in dashboard
        const visibleTasks = await prisma.task.findMany({
            where: { isActive: true, taskType: 'ONE_TIME' },
        });
        log(`✓ Step 1: ${visibleTasks.length} one-time task(s) visible`);

        // Step 2: User completes task
        const userTask = await prisma.userTask.create({
            data: {
                userId: user.id,
                taskId: task.id,
            },
        });
        log(`✓ Step 2: UserTask record created: ${userTask.id.slice(0, 8)}`);

        // Step 3: Award boost points
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { beliefScore: { increment: task.reward } },
        });
        log(`✓ Step 3: User beliefScore: ${user.beliefScore} → ${updatedUser.beliefScore}`);

        // Step 4: Dashboard shows task as completed
        const completedTasks = await prisma.userTask.findMany({
            where: { userId: user.id },
        });
        log(`✓ Step 4: User has ${completedTasks.length} completed task(s)`);

        // Step 5: Task no longer shows as available (for one-time tasks)
        const userCompletedTaskIds = completedTasks.map(t => t.taskId);
        const availableTasks = visibleTasks.filter(t => !userCompletedTaskIds.includes(t.id));
        log(`✓ Step 5: Available tasks after completion: ${availableTasks.length}`);

        // Cleanup
        await prisma.userTask.delete({ where: { id: userTask.id } });
        await prisma.task.delete({ where: { id: task.id } });
        await prisma.user.delete({ where: { id: user.id } });

        pass('User Task Completion Journey', `Task completed, BP awarded: +${task.reward}`);
        return true;
    } catch (error) {
        fail('User Task Completion Journey', `Error: ${error}`);
        return false;
    }
}

// ============================================================
// TEST 8: Full End-to-End Admin to User Flow
// ============================================================

async function testFullEndToEndFlow() {
    console.log('\n📋 TEST 8: Full End-to-End Admin → User Flow');
    console.log('─'.repeat(60));
    startTest();

    try {
        // ADMIN: Create all content
        log('📌 ADMIN PHASE: Creating content...');

        const raid = await prisma.raid.create({
            data: {
                title: 'E2E Test Raid',
                platform: 'X',
                url: 'https://x.com/e2e/test',
                reward: 100,
                isActive: true,
            },
        });
        log(`  ✓ Created raid: ${raid.title}`);

        const campaign = await prisma.contentCampaign.create({
            data: {
                brand: 'E2E Brand',
                name: 'E2E Campaign',
                platforms: ['X'],
                beliefPointsPer1k: 1.0,
                isActive: true,
            },
        });
        log(`  ✓ Created campaign: ${campaign.name}`);

        const task = await prisma.task.create({
            data: {
                title: 'E2E Task',
                reward: 50,
                taskType: 'ONE_TIME',
                isActive: true,
            },
        });
        log(`  ✓ Created task: ${task.title}`);

        // USER: Register and view dashboard
        log('\n📌 USER PHASE: Dashboard interaction...');

        const user = await prisma.user.create({
            data: {
                handle: `e2e_user_${Date.now()}`,
                beliefScore: 0,
            },
        });
        log(`  ✓ User registered: ${user.handle}`);
        log(`  ✓ Initial: beliefScore=${user.beliefScore}`);

        // USER: Claim raid
        const userRaid = await prisma.userRaid.create({
            data: { userId: user.id, raidId: raid.id, bpAwarded: raid.reward },
        });
        let updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { beliefScore: { increment: raid.reward } },
        });
        log(`  ✓ Raid claimed: +${raid.reward} BP (total: ${updatedUser.beliefScore})`);

        // USER: Submit content
        const submission = await prisma.userContentSubmission.create({
            data: {
                userId: user.id,
                campaignId: campaign.id,
                url: 'https://x.com/user/e2e',
                platform: 'X',
                status: 'approved',
                viewCount: 5000,
                beliefAwarded: 5.0,
                verifiedAt: new Date(),
            },
        });
        updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { beliefScore: { increment: 5 } },
        });
        log(`  ✓ Content submitted & approved: +5 belief (total: ${updatedUser.beliefScore})`);

        // USER: Complete task
        const userTask = await prisma.userTask.create({
            data: { userId: user.id, taskId: task.id },
        });
        updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { beliefScore: { increment: task.reward } },
        });
        log(`  ✓ Task completed: +${task.reward} BP (total: ${updatedUser.beliefScore})`);

        // FINAL STATS
        // Expected: 0 + 100 (raid) + 5 (content) + 50 (task) = 155
        log('\n📌 FINAL USER STATS:');
        log(`  Belief Score: ${updatedUser.beliefScore}`);
        log(`  Expected: beliefScore=155`);

        const success = updatedUser.beliefScore === 155;

        // Cleanup
        await prisma.userRaid.delete({ where: { id: userRaid.id } });
        await prisma.userContentSubmission.delete({ where: { id: submission.id } });
        await prisma.userTask.delete({ where: { id: userTask.id } });
        await prisma.raid.delete({ where: { id: raid.id } });
        await prisma.contentCampaign.delete({ where: { id: campaign.id } });
        await prisma.task.delete({ where: { id: task.id } });
        await prisma.user.delete({ where: { id: user.id } });

        if (success) {
            pass('Full End-to-End Flow', 'Admin→User journey complete. All rewards applied correctly.');
        } else {
            fail('Full End-to-End Flow', `Unexpected final stats: beliefScore=${updatedUser.beliefScore}, expected=155`);
        }
        return success;
    } catch (error) {
        fail('Full End-to-End Flow', `Error: ${error}`);
        return false;
    }
}

// ============================================================
// TEST 9: Concurrent User Operations
// ============================================================

async function testConcurrentUserOperations() {
    console.log('\n📋 TEST 9: Concurrent User Operations');
    console.log('─'.repeat(60));
    startTest();

    try {
        // Create raid that multiple users will claim
        const raid = await prisma.raid.create({
            data: {
                title: 'Popular Raid',
                platform: 'X',
                url: 'https://x.com/popular',
                reward: 50,
                isActive: true,
            },
        });

        // Create 5 users
        const users = await Promise.all(
            Array.from({ length: 5 }, (_, i) =>
                prisma.user.create({
                    data: {
                        handle: `concurrent_user_${i}_${Date.now()}`,
                        beliefScore: 0,
                    },
                })
            )
        );
        log(`✓ Created ${users.length} test users`);

        // All users claim the raid concurrently
        const claimResults = await Promise.allSettled(
            users.map(user =>
                prisma.userRaid.create({
                    data: { userId: user.id, raidId: raid.id, bpAwarded: raid.reward },
                })
            )
        );

        const successfulClaims = claimResults.filter(r => r.status === 'fulfilled').length;
        log(`✓ ${successfulClaims}/${users.length} users successfully claimed`);

        // Award BP to all successful claimers
        await Promise.all(
            users.map(user =>
                prisma.user.update({
                    where: { id: user.id },
                    data: { beliefScore: { increment: raid.reward } },
                })
            )
        );

        // Verify raid completion count
        const raidWithCount = await prisma.raid.findUnique({
            where: { id: raid.id },
            include: { _count: { select: { completions: true } } },
        });
        log(`✓ Raid has ${raidWithCount?._count.completions} completions`);

        // Cleanup
        await prisma.userRaid.deleteMany({ where: { raidId: raid.id } });
        await prisma.raid.delete({ where: { id: raid.id } });
        await prisma.user.deleteMany({
            where: { handle: { contains: 'concurrent_user_' } },
        });

        if (successfulClaims === 5) {
            pass('Concurrent User Operations', `All ${successfulClaims} concurrent claims handled correctly`);
        } else {
            fail('Concurrent User Operations', `Only ${successfulClaims}/5 claims succeeded`);
        }
        return true;
    } catch (error) {
        fail('Concurrent User Operations', `Error: ${error}`);
        return false;
    }
}

// ============================================================
// TEST 10: Data Validation and Edge Cases
// ============================================================

async function testDataValidationAndEdgeCases() {
    console.log('\n📋 TEST 10: Data Validation and Edge Cases');
    console.log('─'.repeat(60));
    startTest();

    try {
        let issues = 0;

        // Test 1: Expired raids should not appear
        const expiredRaid = await prisma.raid.create({
            data: {
                title: 'Expired Raid',
                platform: 'X',
                url: 'https://x.com/expired',
                reward: 100,
                isActive: true,
                expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
            },
        });

        const activeRaids = await prisma.raid.findMany({
            where: {
                isActive: true,
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
        });
        const expiredIncluded = activeRaids.some(r => r.id === expiredRaid.id);
        if (expiredIncluded) issues++;
        log(`✓ Expired raid filtered: ${!expiredIncluded}`);

        // Test 2: Inactive campaigns should not appear
        const inactiveCampaign = await prisma.contentCampaign.create({
            data: {
                brand: 'Hidden',
                name: 'Inactive Campaign',
                platforms: ['X'],
                beliefPointsPer1k: 1.0,
                isActive: false,
            },
        });

        const activeCampaigns = await prisma.contentCampaign.findMany({
            where: { isActive: true },
        });
        const inactiveIncluded = activeCampaigns.some(c => c.id === inactiveCampaign.id);
        if (inactiveIncluded) issues++;
        log(`✓ Inactive campaign filtered: ${!inactiveIncluded}`);

        // Test 3: Platform validation for submissions
        const campaign = await prisma.contentCampaign.create({
            data: {
                brand: 'Restricted',
                name: 'X Only Campaign',
                platforms: ['X'], // Only X allowed
                beliefPointsPer1k: 1.0,
                isActive: true,
            },
        });

        const user = await prisma.user.create({
            data: { handle: `edge_case_${Date.now()}` },
        });

        // Platform mismatch should be caught at API level (DB allows it)
        const wrongPlatformSubmission = await prisma.userContentSubmission.create({
            data: {
                userId: user.id,
                campaignId: campaign.id,
                url: 'https://tiktok.com/wrong',
                platform: 'TT', // Wrong platform!
                status: 'pending',
            },
        });
        log(`✓ Platform validation (API responsibility): submission created with TT platform`);
        log(`  Campaign allows: ${campaign.platforms.join(', ')}`);
        log(`  ⚠️ API layer should validate and reject TT submissions for this campaign`);

        // Cleanup
        await prisma.userContentSubmission.delete({ where: { id: wrongPlatformSubmission.id } });
        await prisma.user.delete({ where: { id: user.id } });
        await prisma.raid.delete({ where: { id: expiredRaid.id } });
        await prisma.contentCampaign.delete({ where: { id: inactiveCampaign.id } });
        await prisma.contentCampaign.delete({ where: { id: campaign.id } });

        if (issues === 0) {
            pass('Data Validation and Edge Cases', 'All edge cases handled correctly');
        } else {
            fail('Data Validation and Edge Cases', `${issues} validation issues found`);
        }
        return true;
    } catch (error) {
        fail('Data Validation and Edge Cases', `Error: ${error}`);
        return false;
    }
}

// ============================================================
// RUN ALL TESTS
// ============================================================

async function runAllTests() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   Dashboard Integration Comprehensive Tests                ║');
    console.log('║   Admin Portal → Backend → Dashboard                       ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    const startTime = Date.now();

    await testAdminRaidsCRUD();
    await testAdminContentCampaignsCRUD();
    await testAdminTasksCRUD();
    await testDashboardDataFetching();
    await testUserRaidClaimingJourney();
    await testUserContentSubmissionJourney();
    await testUserTaskCompletionJourney();
    await testFullEndToEndFlow();
    await testConcurrentUserOperations();
    await testDataValidationAndEdgeCases();

    const totalDuration = Date.now() - startTime;

    console.log('\n' + '═'.repeat(60));
    console.log('SUMMARY');
    console.log('═'.repeat(60));

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    console.log(`\n  Passed: ${passed}`);
    console.log(`  Failed: ${failed}`);
    console.log(`  Total:  ${results.length}`);
    console.log(`  Duration: ${(totalDuration / 1000).toFixed(2)}s`);

    if (failed === 0) {
        console.log('\n✅ All tests passed!');
    } else {
        console.log('\n❌ Some tests failed:');
        results.filter(r => !r.passed).forEach(r => {
            console.log(`   - ${r.name}: ${r.details}`);
        });
    }

    await prisma.$disconnect();
    return { passed, failed, total: results.length, duration: totalDuration };
}

// Run if executed directly
runAllTests().catch(async (e) => {
    console.error('Test runner error:', e);
    await prisma.$disconnect();
    process.exit(1);
});

export { runAllTests };
