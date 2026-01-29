import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { calculatePayoutTime, getBpToMinutesRate } from '@/services/payout-time.service';
import { rateLimit } from '@/lib/rate-limit';

/**
 * POST /api/spray/finalize - Finalize spray entry after task completion
 * 
 * Checks that all tasks are completed, then:
 * 1. Updates SprayEntry status to ACTIVE
 * 2. Creates Participant record for queue entry
 */
export async function POST(request: Request) {
    try {
        const { limited, response } = await rateLimit(request, 'spray');
        if (limited) return response;

        const session = await getSession();
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { sprayEntryId } = body;

        if (!sprayEntryId) {
            return NextResponse.json(
                { error: 'Missing sprayEntryId' },
                { status: 400 }
            );
        }

        // Find spray entry
        const sprayEntry = await prisma.sprayEntry.findUnique({
            where: { id: sprayEntryId },
            include: { trench: true },
        });

        if (!sprayEntry) {
            return NextResponse.json(
                { error: 'Spray entry not found' },
                { status: 404 }
            );
        }

        if (sprayEntry.userId !== session.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        if (sprayEntry.status !== 'PENDING_TASKS') {
            return NextResponse.json(
                { error: 'Spray entry already finalized or expired' },
                { status: 400 }
            );
        }

        // Check all tasks are completed
        // ONE_TIME tasks: check if ever completed by user
        // RECURRING tasks: check if completed for THIS spray entry specifically
        const allTasks = await prisma.task.findMany({
            where: { isActive: true },
        });

        // Get one-time task completions (any time)
        const oneTimeCompletions = await prisma.userTask.findMany({
            where: {
                userId: session.id,
                task: { taskType: 'ONE_TIME' },
            },
        });
        const completedOneTimeIds = new Set(oneTimeCompletions.map(t => t.taskId));

        // Get recurring task completions for THIS spray entry only
        const recurringCompletions = await prisma.userTask.findMany({
            where: {
                userId: session.id,
                sprayEntryId: sprayEntryId,
                task: { taskType: 'RECURRING' },
            },
        });
        const completedRecurringIds = new Set(recurringCompletions.map(t => t.taskId));

        // Check if all tasks are completed based on their type
        const incompleteTasks = allTasks.filter(task => {
            if (task.taskType === 'ONE_TIME') {
                return !completedOneTimeIds.has(task.id);
            } else {
                // RECURRING - must be completed for this spray
                return !completedRecurringIds.has(task.id);
            }
        });

        if (incompleteTasks.length > 0) {
            return NextResponse.json({
                error: 'All tasks must be completed',
                remainingTasks: incompleteTasks.length,
                remainingTaskNames: incompleteTasks.map(t => t.title),
                totalTasks: allTasks.length,
            }, { status: 400 });
        }

        // Get user's belief score for queue position calculation
        const user = await prisma.user.findUnique({
            where: { id: session.id },
            select: { beliefScore: true },
        });
        const myBeliefScore = user?.beliefScore ?? 0;

        // Calculate queue position using proper ordering (belief → boost → joinedAt)
        // For a new participant with 0 boost points, count everyone ahead
        const queuePosition = await prisma.participant.count({
            where: {
                trenchId: sprayEntry.trenchId,
                status: 'active',
                OR: [
                    // Higher belief score = ahead
                    { user: { beliefScore: { gt: myBeliefScore } } },
                    // Same belief, any boost = ahead (new user has 0)
                    { user: { beliefScore: myBeliefScore }, boostPoints: { gt: 0 } },
                    // Same belief, same boost (0), earlier join = ahead
                    { user: { beliefScore: myBeliefScore }, boostPoints: 0 },
                ],
            },
        }) + 1;

        // Calculate max payout based on ROI
        const campaign = await prisma.campaignConfig.findFirst({
            where: {
                trenchIds: { has: sprayEntry.trench.level },
                isActive: true,
            },
        });
        const roiMultiplier = campaign ? Number(campaign.roiMultiplier) : 1.5;
        const maxPayout = Math.floor(Number(sprayEntry.amount) * roiMultiplier);

        // Calculate expected payout time
        const bpRate = await getBpToMinutesRate();
        const initialJoinedAt = new Date();
        const expectedPayoutAt = calculatePayoutTime(
            initialJoinedAt,
            sprayEntry.trench.durationHours,
            0, // New entry has 0 BP initially
            bpRate
        );

        // Atomic: update spray entry and create participant
        const [updatedEntry, participant] = await prisma.$transaction([
            prisma.sprayEntry.update({
                where: { id: sprayEntryId },
                data: {
                    status: 'ACTIVE',
                    finalizedAt: initialJoinedAt,
                },
            }),
            prisma.participant.upsert({
                where: {
                    userId_trenchId: {
                        userId: session.id,
                        trenchId: sprayEntry.trenchId,
                    },
                },
                create: {
                    userId: session.id,
                    trenchId: sprayEntry.trenchId,
                    status: 'active',
                    entryAmount: Number(sprayEntry.amount),
                    maxPayout,
                    joinedAt: initialJoinedAt,
                    expectedPayoutAt,
                },
                update: {
                    status: 'active',
                    entryAmount: {
                        increment: Number(sprayEntry.amount),
                    },
                    maxPayout: {
                        increment: maxPayout,
                    },
                    // If they add to their position, we reset the timer 
                    // based on the new aggregated metadata
                    joinedAt: initialJoinedAt,
                    expectedPayoutAt,
                },
            }),
        ]);

        return NextResponse.json({
            success: true,
            data: {
                participantId: participant.id,
                queuePosition,
                entryAmount: Number(sprayEntry.amount),
                maxPayout,
                trenchLevel: sprayEntry.trench.level,
            },
        });
    } catch (error) {
        console.error('Error finalizing spray:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
