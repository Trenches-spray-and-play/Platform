import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/tasks - Get all active tasks for users
 */
export async function GET() {
    try {
        const tasks = await prisma.task.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
            select: {
                id: true,
                title: true,
                description: true,
                reward: true,
                link: true,
                order: true,
                taskType: true,
                isActive: true,
            },
        });


        return NextResponse.json({ data: tasks });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return NextResponse.json(
            { error: 'Failed to fetch tasks' },
            { status: 500 }
        );
    }
}
