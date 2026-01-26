import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminAuth } from '@/lib/admin-auth';

/**
 * GET /api/admin/tasks - List all tasks
 */
export async function GET() {
    // Verify admin authentication
    const auth = await requireAdminAuth();
    if (!auth.authorized) {
        return auth.response;
    }

    try {
        const tasks = await prisma.task.findMany({
            orderBy: { order: 'asc' },
            include: {
                _count: {
                    select: { completions: true },
                },
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

/**
 * POST /api/admin/tasks - Create a new task
 */
export async function POST(request: Request) {
    // Verify admin authentication
    const auth = await requireAdminAuth();
    if (!auth.authorized) {
        return auth.response;
    }

    try {
        const body = await request.json();
        const { title, description, reward, link, isActive, order, taskType } = body;

        if (!title) {
            return NextResponse.json(
                { error: 'Title is required' },
                { status: 400 }
            );
        }

        // Get the highest order value to append new task at end
        const maxOrder = await prisma.task.aggregate({
            _max: { order: true },
        });
        const newOrder = order ?? (maxOrder._max.order ?? 0) + 1;

        const task = await prisma.task.create({
            data: {
                title,
                description: description || null,
                reward: reward || 0,
                link: link || null,
                taskType: taskType || 'ONE_TIME',
                isActive: isActive ?? true,
                order: newOrder,
            },
        });

        return NextResponse.json({ data: task }, { status: 201 });

    } catch (error) {
        console.error('Error creating task:', error);
        return NextResponse.json(
            { error: 'Failed to create task' },
            { status: 500 }
        );
    }
}
