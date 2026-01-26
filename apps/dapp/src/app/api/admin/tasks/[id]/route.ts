import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminAuth } from '@/lib/admin-auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/tasks/[id] - Get a single task
 */
export async function GET(request: Request, { params }: RouteParams) {
    const auth = await requireAdminAuth();
    if (!auth.authorized) return auth.response;

    const { id } = await params;

    try {
        const task = await prisma.task.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { completions: true },
                },
            },
        });

        if (!task) {
            return NextResponse.json(
                { error: 'Task not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ data: task });
    } catch (error) {
        console.error('Error fetching task:', error);
        return NextResponse.json(
            { error: 'Failed to fetch task' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/admin/tasks/[id] - Update a task
 */
export async function PUT(request: Request, { params }: RouteParams) {
    const auth = await requireAdminAuth();
    if (!auth.authorized) return auth.response;

    const { id } = await params;

    try {
        const body = await request.json();
        const { title, description, reward, link, isActive, order, taskType } = body;

        const task = await prisma.task.update({
            where: { id },
            data: {
                ...(title !== undefined && { title }),
                ...(description !== undefined && { description }),
                ...(reward !== undefined && { reward }),
                ...(link !== undefined && { link }),
                ...(isActive !== undefined && { isActive }),
                ...(order !== undefined && { order }),
                ...(taskType !== undefined && { taskType }),
            },
        });


        return NextResponse.json({ data: task });
    } catch (error) {
        console.error('Error updating task:', error);
        return NextResponse.json(
            { error: 'Failed to update task' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/tasks/[id] - Delete a task
 */
export async function DELETE(request: Request, { params }: RouteParams) {
    const auth = await requireAdminAuth();
    if (!auth.authorized) return auth.response;

    const { id } = await params;

    try {
        // First delete all completions for this task
        await prisma.userTask.deleteMany({
            where: { taskId: id },
        });

        // Then delete the task
        await prisma.task.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting task:', error);
        return NextResponse.json(
            { error: 'Failed to delete task' },
            { status: 500 }
        );
    }
}
