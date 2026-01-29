/**
 * Address Book Cron API
 * 
 * Scheduled jobs for the address book system:
 * 1. Activate pending addresses after 24h delay
 * 2. Cleanup expired unconfirmed addresses
 */

import { NextResponse } from 'next/server';
import { activatePendingAddresses, cleanupExpiredAddresses } from '@/services/address-book.service';

/**
 * GET /api/cron/address-book
 * Trigger activation and cleanup
 */
export async function GET(request: Request) {
    // Simple auth check (using a CRON_SECRET if available)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const activatedCount = await activatePendingAddresses();
        const cleanedCount = await cleanupExpiredAddresses();

        return NextResponse.json({
            success: true,
            data: {
                activated: activatedCount,
                cleaned: cleanedCount,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error running address book cron:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to run cron job' },
            { status: 500 }
        );
    }
}
