import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { POINTS } from '@/constants/points';
import { rateLimit } from '@/lib/rate-limit';

/**
 * GET /api/user/tasks - Get current user's completed tasks
 * Query params: sprayEntryId (optional) - filter by specific spray entry
 */
export async function GET(request: Request) {
    try {
        const { limited, response } = await rateLimit(request, 'tasks');
        if (limited) return response;

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
        const { limited, response } = await rateLimit(request, 'tasks');
        if (limited) return response;

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

        // Add BP to user's wallet (new manual boost system)
        await prisma.user.update({
            where: { id: session.id },
            data: { boostPoints: { increment: bpReward } },
        });

        // Process auto-boost for positions with auto-boost enabled
        const { processAutoBoost } = await import('@/services/auto-boost.service');
        const autoBoostResult = await processAutoBoost(session.id, bpReward);

        // Get updated wallet balance for response
        const user = await prisma.user.findUnique({
            where: { id: session.id },
            select: { boostPoints: true },
        });

        return NextResponse.json({
            success: true,
            data: {
                completedAt: completion.completedAt,
                rewardAwarded: bpReward,
                walletBalance: user?.boostPoints ?? 0,
                autoBoostDistributed: autoBoostResult.distributed,
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
