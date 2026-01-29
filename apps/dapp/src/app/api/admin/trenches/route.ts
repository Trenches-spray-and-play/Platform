import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminAuth } from '@/lib/admin-auth';

function getDurationHoursForLevel(level: string): number {
    switch (level) {
        case 'RAPID': return 24;      // 1 day
        case 'MID': return 168;       // 7 days
        case 'DEEP': return 720;      // 30 days
        default: return 24;
    }
}

function getCadenceForLevel(level: string): string {
    switch (level) {
        case 'RAPID': return '1 DAY';
        case 'MID': return '7 DAYS';
        case 'DEEP': return '30 DAYS';
        default: return '1 DAY';
    }
}

/**
 * GET /api/admin/trenches - Get all trenches for admin
 */
export async function GET() {
    // Verify admin authentication
    const auth = await requireAdminAuth();
    if (!auth.authorized) {
        return auth.response;
    }

    try {
        const trenches = await prisma.trench.findMany({
            orderBy: { level: 'asc' },
            include: {
                _count: {
                    select: { participants: true },
                },
            },
        });

        return NextResponse.json({ data: trenches });
    } catch (error) {
        console.error('Error fetching trenches:', error);
        return NextResponse.json(
            { error: 'Failed to fetch trenches' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/trenches - Create a new trench
 */
export async function POST(request: Request) {
    // Verify admin authentication
    const auth = await requireAdminAuth();
    if (!auth.authorized) {
        return auth.response;
    }

    try {
        const body = await request.json();
        const { name, level, entrySize, usdEntry, cadence, reserves, active } = body;

        if (!name || !level) {
            return NextResponse.json(
                { error: 'Name and level are required' },
                { status: 400 }
            );
        }

        const trench = await prisma.trench.create({
            data: {
                name,
                level,
                durationHours: getDurationHoursForLevel(level),
                entrySize: entrySize || 0,
                usdEntry: usdEntry || 0,
                cadence: cadence || getCadenceForLevel(level),
                reserves: reserves || '0',
                active: active ?? true,
            },
        });

        return NextResponse.json({ data: trench }, { status: 201 });
    } catch (error) {
        console.error('Error creating trench:', error);
        return NextResponse.json(
            { error: 'Failed to create trench' },
            { status: 500 }
        );
    }
}
