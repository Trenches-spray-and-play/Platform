import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminAuth } from '@/lib/admin-auth';

/**
 * GET /api/admin/users - List all users with stats
 */
export async function GET(request: Request) {
    // Verify admin authentication
    const auth = await requireAdminAuth();
    if (!auth.authorized) {
        return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    try {
        const where = search
            ? {
                OR: [
                    { handle: { contains: search, mode: 'insensitive' as const } },
                    { email: { contains: search, mode: 'insensitive' as const } },
                ],
            }
            : {};

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                take: limit,
                skip,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    handle: true,
                    email: true,
                    beliefScore: true,
                    balance: true,
                    createdAt: true,
                    _count: {
                        select: {
                            participants: true,
                            deposits: true,
                            userTasks: true,
                            campaignWaitlists: true,
                        },
                    },
                },
            }),
            prisma.user.count({ where }),
        ]);

        return NextResponse.json({
            data: users,
            meta: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}
