/**
 * Metrics Service
 *
 * Tracks and aggregates reorg detection metrics by chain.
 */

import { prisma } from '@/lib/db';

export type MetricType = 'detected' | 'reversed' | 'review' | 'check_failure';

/**
 * Record a reorg metric event
 */
export async function recordReorgMetric(chain: string, type: MetricType): Promise<void> {
    try {
        await prisma.reorgMetric.create({
            data: {
                chain,
                type,
                date: new Date(),
            }
        });
    } catch (error) {
        console.error('Failed to record reorg metric:', error);
    }
}

/**
 * Get aggregated reorg metrics
 */
export async function getReorgMetrics(days: number = 7): Promise<{
    byChain: Record<string, { detected: number; reversed: number; review: number; check_failure: number }>;
    byDay: Array<{ date: string; count: number }>;
    total: { detected: number; reversed: number; review: number; check_failure: number };
}> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const metrics = await prisma.reorgMetric.findMany({
        where: {
            date: { gte: startDate }
        },
        orderBy: { date: 'asc' }
    });

    // Aggregate by chain
    const byChain: Record<string, { detected: number; reversed: number; review: number; check_failure: number }> = {};
    const total = { detected: 0, reversed: 0, review: 0, check_failure: 0 };

    for (const metric of metrics) {
        if (!byChain[metric.chain]) {
            byChain[metric.chain] = { detected: 0, reversed: 0, review: 0, check_failure: 0 };
        }

        const type = metric.type as MetricType;
        if (type in byChain[metric.chain]) {
            byChain[metric.chain][type]++;
            total[type]++;
        }
    }

    // Aggregate by day
    const byDayMap: Record<string, number> = {};
    for (const metric of metrics) {
        const dateKey = metric.date.toISOString().split('T')[0];
        byDayMap[dateKey] = (byDayMap[dateKey] || 0) + 1;
    }

    const byDay = Object.entries(byDayMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

    return { byChain, byDay, total };
}
