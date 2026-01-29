import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminAuth } from '@/lib/admin-auth';
import { getConfigAtTime, logConfigChange } from '@/services/config-audit.service';

/**
 * POST /api/admin/config/rollback - Rollback config to a previous state
 * Body: { configType: 'campaign' | 'platform', configId: string, targetDate: string }
 */
export async function POST(request: Request) {
    const auth = await requireAdminAuth();
    if (!auth.authorized) {
        return auth.response;
    }

    try {
        const { configType, configId, targetDate } = await request.json();

        if (!configType || !configId || !targetDate) {
            return NextResponse.json(
                { success: false, error: 'configType, configId, and targetDate are required' },
                { status: 400 }
            );
        }

        // Get config state at target time
        const configAtTime = await getConfigAtTime({
            configType,
            configId,
            beforeDate: new Date(targetDate),
        });

        if (Object.keys(configAtTime).length === 0) {
            return NextResponse.json(
                { success: false, error: 'No config history found for that time' },
                { status: 404 }
            );
        }

        // Apply rollback based on config type
        if (configType === 'campaign') {
            await prisma.campaignConfig.update({
                where: { id: configId },
                data: configAtTime as Record<string, unknown>,
            });
        } else if (configType === 'platform') {
            await prisma.platformConfig.update({
                where: { id: configId },
                data: configAtTime as Record<string, unknown>,
            });
        } else {
            return NextResponse.json(
                { success: false, error: 'Invalid configType' },
                { status: 400 }
            );
        }

        // Log the rollback
        await logConfigChange({
            configType,
            configId,
            field: 'ROLLBACK',
            oldValue: 'current',
            newValue: { targetDate, fieldsRestored: Object.keys(configAtTime) },
            changedBy: auth.admin?.email || 'admin',
        });

        return NextResponse.json({
            success: true,
            message: `Config rolled back to state at ${targetDate}`,
            restoredFields: Object.keys(configAtTime),
        });
    } catch (error) {
        console.error('Error rolling back config:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to rollback config' },
            { status: 500 }
        );
    }
}
