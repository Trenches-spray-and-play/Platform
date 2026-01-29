import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/admin/reorg-incidents - List all reorg incidents
 * Query params: status (optional) - filter by status
 */
export async function GET(request: Request) {
    const auth = await requireAdminAuth();
    if (!auth.authorized) {
        return auth.response;
    }

    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const incidents = await prisma.reorgIncident.findMany({
            where: status ? { status } : undefined,
            orderBy: { detectedAt: 'desc' },
            include: {
                deposit: {
                    select: {
                        txHash: true,
                        chain: true,
                        asset: true,
                        amount: true,
                        amountUsd: true,
                        blockNumber: true,
                        blockHash: true,
                    }
                }
            }
        });

        return NextResponse.json({ data: incidents });
    } catch (error) {
        console.error('Error fetching reorg incidents:', error);
        return NextResponse.json(
            { error: 'Failed to fetch reorg incidents' },
            { status: 500 }
        );
    }
}
