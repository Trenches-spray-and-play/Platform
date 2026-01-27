import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { POINTS } from '@/constants/points';
import { recalculatePayoutTime } from '@/services/payout-time.service';

/**
 * GET /api/user/tasks - Get current user's completed tasks
 * Query params: sprayEntryId (optional) - filter by specific spray entry
 */
export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get optional sprayEntryId from query params
        const { searchParams } = new URL(request.url);
        const sprayEntryId = searchParams.get('sprayEntryId');

        const completedTasks = await prisma.userTask.findMany({
            where: {
                userId: session.id,
                ...(sprayEntryId ? { sprayEntryId } : {}),
            },
            include: {
                task: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        reward: true,
                        link: true,
                    },
                },
            },
            orderBy: { completedAt: 'desc' },
        });

        return NextResponse.json({
            data: completedTasks.map(ut => ({
                taskId: ut.taskId,
                completedAt: ut.completedAt,
                ...ut.task,
            })),
        });
    } catch (error) {
        console.error('Error fetching user tasks:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user tasks' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/user/tasks - Mark a task as completed
 */
export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { taskId, sprayEntryId } = await request.json();
        if (!taskId) {
            return NextResponse.json(
                { error: 'taskId is required' },
                { status: 400 }
            );
        }

        // Check if task exists and is active
        const task = await prisma.task.findUnique({
            where: { id: taskId },
        });

        if (!task || !task.isActive) {
            return NextResponse.json(
                { error: 'Task not found or inactive' },
                { status: 404 }
            );
        }

        // Check if already completed for this spray (or globally for one-time tasks)
        const existing = await prisma.userTask.findFirst({
            where: {
                userId: session.id,
                taskId,
                ...(sprayEntryId ? { sprayEntryId } : {}),
            },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Task already completed', alreadyCompleted: true },
                { status: 400 }
            );
        }

        // Create completion record with optional sprayEntryId
        const completion = await prisma.userTask.create({
            data: {
                userId: session.id,
                taskId,
                sprayEntryId: sprayEntryId || null,
            },
        });

        // Calculate BP reward: admin override or default 10 BP
        const bpReward = task.reward > 0 ? task.reward : POINTS.TASK_REWARD;

        // Award boost points to user's participant records
        const updatedParticipants = await prisma.participant.updateMany({
            where: { userId: session.id },
            data: { boostPoints: { increment: bpReward } },
        });

        // Recalculate payout time for all affected participants
        if (updatedParticipants.count > 0) {
            const participants = await prisma.participant.findMany({
                where: { userId: session.id, status: 'active' },
                select: { id: true }
            });
            await Promise.all(participants.map(p => recalculatePayoutTime(p.id)));
        }

        return NextResponse.json({
            success: true,
            data: {
                completedAt: completion.completedAt,
                rewardAwarded: bpReward,
            },
        });
    } catch (error) {
        console.error('Error completing task:', error);
        return NextResponse.json(
            { error: 'Failed to complete task' },
            { status: 500 }
        );
    }
}
