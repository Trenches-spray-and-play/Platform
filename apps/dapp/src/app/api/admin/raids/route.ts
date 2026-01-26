import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminAuth } from '@/lib/admin-auth';

// Admin: GET all raids, POST new raid, PUT update, DELETE
export async function GET() {
    // Verify admin authentication
    const auth = await requireAdminAuth();
    if (!auth.authorized) {
        return auth.response;
    }

    try {
        const raids = await prisma.raid.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { completions: true }
                }
            }
        });

        return NextResponse.json({
            success: true,
            data: raids.map(r => ({
                ...r,
                completions: r._count.completions
            }))
        });
    } catch (error) {
        console.error('Failed to fetch raids:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch raids' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    // Verify admin authentication
    const auth = await requireAdminAuth();
    if (!auth.authorized) {
        return auth.response;
    }

    try {
        const body = await request.json();
        const { title, platform, url, reward, expiresAt } = body;

        if (!title || !platform || !url) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const raid = await prisma.raid.create({
            data: {
                title,
                platform,
                url,
                reward: reward || 50,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                isActive: true
            }
        });

        return NextResponse.json({ success: true, data: raid });
    } catch (error) {
        console.error('Failed to create raid:', error);
        return NextResponse.json({ success: false, error: 'Failed to create raid' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    // Verify admin authentication
    const auth = await requireAdminAuth();
    if (!auth.authorized) {
        return auth.response;
    }

    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: 'Missing raid ID' }, { status: 400 });
        }

        // Convert expiresAt if provided
        if (updates.expiresAt) {
            updates.expiresAt = new Date(updates.expiresAt);
        }

        const raid = await prisma.raid.update({
            where: { id },
            data: updates
        });

        return NextResponse.json({ success: true, data: raid });
    } catch (error) {
        console.error('Failed to update raid:', error);
        return NextResponse.json({ success: false, error: 'Failed to update raid' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    // Verify admin authentication
    const auth = await requireAdminAuth();
    if (!auth.authorized) {
        return auth.response;
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: 'Missing raid ID' }, { status: 400 });
        }

        // Soft delete by deactivating
        await prisma.raid.update({
            where: { id },
            data: { isActive: false }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete raid:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete raid' }, { status: 500 });
    }
}
