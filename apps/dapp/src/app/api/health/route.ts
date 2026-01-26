import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/health - Health check endpoint to debug database connection
 */
export async function GET() {
    const checks = {
        timestamp: new Date().toISOString(),
        database: { status: 'unknown', error: null as string | null },
        env: {
            DATABASE_URL: process.env.DATABASE_URL ? 'set (hidden)' : 'NOT SET',
            NODE_ENV: process.env.NODE_ENV || 'NOT SET',
        },
    };

    // Test database connection
    try {
        await prisma.$connect();
        const userCount = await prisma.user.count();
        const trenchCount = await prisma.trench.count();
        checks.database = {
            status: 'connected',
            error: null,
            userCount,
            trenchCount,
        } as typeof checks.database & { userCount: number; trenchCount: number };
    } catch (error) {
        checks.database = {
            status: 'failed',
            error: error instanceof Error ? error.message : String(error),
        };
    } finally {
        await prisma.$disconnect();
    }

    const isHealthy = checks.database.status === 'connected';

    return NextResponse.json(checks, { status: isHealthy ? 200 : 500 });
}
