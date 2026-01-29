/**
 * Cron Payout Endpoint
 * 
 * Automated payout processing endpoint triggered by Cron-Job.org.
 * Processes up to 8 payouts per minute within Vercel's 10s limit.
 * 
 * Auth: Authorization: Bearer ${CRON_SECRET}
 * Rate: Max 1 request per 30 seconds
 */

import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { processPayoutQueue, getPendingPayouts, getPayoutStats } from '@/services/payout.service';
import { payoutConfig, validatePayoutConfig } from '@/lib/payout-config';
import {
    sendPayoutFailedAlert,
    sendBatchSummaryAlert,
    sendQueueBackupAlert,
    sendUnauthorizedCronAlert,
} from '@/services/alert.service';
import { prisma } from '@/lib/db';

// Track last cron run time for rate limiting
let lastCronRunAt: Date | null = null;

/**
 * Verify cron request authorization
 */
function verifyCronAuth(request: Request): { valid: boolean; ip: string; error?: string } {
    const authHeader = request.headers.get('authorization');
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

    // Check Bearer token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { valid: false, ip, error: 'Missing or invalid Authorization header' };
    }

    const token = authHeader.slice(7);
    if (token !== payoutConfig.cronSecret) {
        return { valid: false, ip, error: 'Invalid CRON_SECRET' };
    }

    // Optional IP allowlist check
    if (payoutConfig.allowedIps.length > 0 && !payoutConfig.allowedIps.includes(ip)) {
        return { valid: false, ip, error: `IP ${ip} not in allowlist` };
    }

    return { valid: true, ip };
}

/**
 * Check rate limiting
 */
function isRateLimited(): boolean {
    if (!lastCronRunAt) return false;

    const elapsed = Date.now() - lastCronRunAt.getTime();
    return elapsed < payoutConfig.minCronIntervalSeconds * 1000;
}

export async function GET(request: Request) {
    const startTime = Date.now();

    // 1. Validate configuration
    const configValidation = validatePayoutConfig();
    if (!configValidation.valid) {
        console.error('Payout config invalid:', configValidation.errors);
        return NextResponse.json(
            { error: 'Configuration error', details: configValidation.errors },
            { status: 500 }
        );
    }

    // 2. Verify authorization
    const auth = verifyCronAuth(request);
    if (!auth.valid) {
        console.warn(`Unauthorized cron attempt from ${auth.ip}: ${auth.error}`);

        // Send alert for unauthorized attempts
        await sendUnauthorizedCronAlert({
            ip: auth.ip,
            userAgent: request.headers.get('user-agent') || undefined,
        });

        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    // 3. Rate limiting
    if (isRateLimited()) {
        return NextResponse.json(
            { error: 'Rate limited', retryAfterSeconds: payoutConfig.minCronIntervalSeconds },
            { status: 429 }
        );
    }

    // Update last run timestamp
    lastCronRunAt = new Date();

    // 4. Log the cron run (for tracking)
    console.log(`[CRON] Payout run started at ${lastCronRunAt.toISOString()} from IP: ${auth.ip}`);

    try {
        // 5. Check queue size for backup alert
        const pendingCount = await prisma.payout.count({ where: { status: 'PENDING' } });
        if (pendingCount > payoutConfig.queueBackupThreshold) {
            await sendQueueBackupAlert({
                queueSize: pendingCount,
                threshold: payoutConfig.queueBackupThreshold,
            });
        }

        // 6. Process payout queue with configured batch size
        const result = await processPayoutQueue(payoutConfig.batchSize);

        // 7. Handle paused/skipped states
        if (result.paused) {
            return NextResponse.json({
                status: 'paused',
                message: 'Payout processing is paused by admin',
                durationMs: Date.now() - startTime,
            });
        }

        if (result.skipped) {
            return NextResponse.json({
                status: 'skipped',
                message: 'Another instance is already processing',
                durationMs: Date.now() - startTime,
            });
        }

        // 8. Count successes and failures
        const processed = result.results?.length || 0;
        const failed = result.results?.filter(r => !r.success).length || 0;
        const errors = result.results?.filter(r => r.error).map(r => r.error as string) || [];

        // 9. Send individual failure alerts
        for (const failedPayout of result.results?.filter(r => !r.success) || []) {
            const payout = await prisma.payout.findUnique({
                where: { id: failedPayout.payoutId },
            });

            if (payout) {
                // Fetch user handle separately
                const user = await prisma.user.findUnique({
                    where: { id: payout.userId },
                    select: { handle: true },
                });

                await sendPayoutFailedAlert({
                    payoutId: payout.id,
                    userId: payout.userId,
                    userHandle: user?.handle,
                    amount: Number(payout.amount),
                    tokenSymbol: payout.tokenSymbol,
                    toAddress: payout.toAddress,
                    error: failedPayout.error || 'Unknown error',
                });
            }
        }

        // 10. Send batch summary if failures occurred
        const durationMs = Date.now() - startTime;
        if (failed > 0) {
            await sendBatchSummaryAlert({
                processed,
                failed,
                durationMs,
                errors,
            });
        }

        // 11. Return response
        return NextResponse.json({
            status: 'success',
            processed,
            failed,
            timeBasedCreated: result.timeBasedCreated || 0,
            durationMs,
            nextRun: new Date(Date.now() + 60000).toISOString(), // +1 min
            config: {
                batchSize: payoutConfig.batchSize,
                intervalSeconds: payoutConfig.intervalSeconds,
            },
        });
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error('[CRON] Payout batch failed:', error);

        // Send alert for batch failure
        await sendBatchSummaryAlert({
            processed: 0,
            failed: 1,
            durationMs: Date.now() - startTime,
            errors: [errorMsg],
        });

        return NextResponse.json(
            { error: 'Batch processing failed', message: errorMsg },
            { status: 500 }
        );
    }
}
