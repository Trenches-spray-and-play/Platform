import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';

/**
 * POST /api/admin/reorg-incidents/[id]/resolve - Resolve a reorg incident
 * Body: { resolution: 'credited' | 'reversed' | 'dismissed', notes?: string }
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdminAuth();
    if (!auth.authorized) {
        return auth.response;
    }

    try {
        const { id } = await params;
        const body = await request.json();
        const { resolution, notes } = body;

        if (!resolution || !['credited', 'reversed', 'dismissed'].includes(resolution)) {
            return NextResponse.json(
                { error: 'Invalid resolution. Must be: credited, reversed, or dismissed' },
                { status: 400 }
            );
        }

        // Find the incident
        const incident = await prisma.reorgIncident.findUnique({
            where: { id },
            include: { deposit: true }
        });

        if (!incident) {
            return NextResponse.json(
                { error: 'Reorg incident not found' },
                { status: 404 }
            );
        }

        // Handle resolution
        if (resolution === 'credited') {
            // Admin decided to credit the user anyway (e.g., false positive)
            await prisma.user.update({
                where: { id: incident.userId },
                data: {
                    balance: {
                        increment: Number(incident.amount)
                    }
                }
            });

            await prisma.deposit.update({
                where: { id: incident.depositId },
                data: {
                    status: 'SAFE',
                    creditedToBalance: true,
                }
            });
        } else if (resolution === 'reversed') {
            // Admin confirmed reversal - ensure balance is deducted
            const user = await prisma.user.findUnique({
                where: { id: incident.userId }
            });

            if (user && Number(user.balance) >= Number(incident.amount)) {
                await prisma.user.update({
                    where: { id: incident.userId },
                    data: {
                        balance: {
                            decrement: Number(incident.amount)
                        }
                    }
                });
            }

            await prisma.deposit.update({
                where: { id: incident.depositId },
                data: {
                    status: 'REORGED',
                    creditedToBalance: false,
                }
            });
        }
        // 'dismissed' = no action needed, just close the incident

        // Update incident status
        const updatedIncident = await prisma.reorgIncident.update({
            where: { id },
            data: {
                status: `RESOLVED_${resolution.toUpperCase()}`,
                reason: notes ? `${incident.reason || ''}\n\nAdmin notes: ${notes}` : incident.reason,
                resolvedAt: new Date(),
                resolvedBy: auth.admin?.email || 'admin',
            }
        });

        return NextResponse.json({
            success: true,
            data: updatedIncident
        });
    } catch (error) {
        console.error('Error resolving reorg incident:', error);
        return NextResponse.json(
            { error: 'Failed to resolve reorg incident' },
            { status: 500 }
        );
    }
}
