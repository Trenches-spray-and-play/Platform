import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { redis } from '@/lib/redis';
import { getSupportedChainIds, getChainName, hasRpc } from '@/lib/rpc';

interface HealthCheck {
    timestamp: string;
    uptime: number;
    version: string;
    environment: string;
    checks: {
        database: DatabaseCheck;
        redis: RedisCheck;
        rpc: RpcCheck;
    };
    overall: 'healthy' | 'degraded' | 'unhealthy';
}

interface DatabaseCheck {
    status: 'connected' | 'failed';
    latency: number; // ms
    error?: string;
    stats?: {
        userCount: number;
        trenchCount: number;
    };
}

interface RedisCheck {
    status: 'connected' | 'failed';
    latency: number; // ms
    error?: string;
}

interface RpcCheck {
    status: 'healthy' | 'degraded' | 'unhealthy';
    chains: RpcChainStatus[];
}

interface RpcChainStatus {
    chainId: number;
    name: string;
    configured: boolean;
    status: 'ok' | 'error' | 'not_configured';
    latency?: number;
    error?: string;
}

// Simple in-memory uptime tracking
const startTime = Date.now();

/**
 * GET /api/health - Comprehensive health check endpoint
 * 
 * Checks:
 * - Database connectivity and basic query performance
 * - Redis cache connectivity
 * - RPC endpoint availability for all configured chains
 * 
 * Returns 200 if all critical systems are healthy
 * Returns 503 if any critical system is down
 */
export async function GET() {
    const checks: HealthCheck['checks'] = {
        database: await checkDatabase(),
        redis: await checkRedis(),
        rpc: await checkRpcEndpoints(),
    };

    // Determine overall health
    const isDatabaseHealthy = checks.database.status === 'connected';
    const isRedisHealthy = checks.redis.status === 'connected';
    const isRpcHealthy = checks.rpc.status !== 'unhealthy';

    let overall: HealthCheck['overall'] = 'healthy';
    if (!isDatabaseHealthy) {
        overall = 'unhealthy';
    } else if (!isRedisHealthy || !isRpcHealthy) {
        overall = 'degraded';
    }

    const health: HealthCheck = {
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - startTime) / 1000),
        version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev',
        environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
        checks,
        overall,
    };

    const statusCode = overall === 'unhealthy' ? 503 : overall === 'degraded' ? 200 : 200;

    return NextResponse.json(health, { 
        status: statusCode,
        headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'X-Health-Status': overall,
        },
    });
}

async function checkDatabase(): Promise<DatabaseCheck> {
    const start = Date.now();
    try {
        await prisma.$connect();
        const [userCount, trenchCount] = await Promise.all([
            prisma.user.count(),
            prisma.trench.count(),
        ]);
        const latency = Date.now() - start;

        return {
            status: 'connected',
            latency,
            stats: { userCount, trenchCount },
        };
    } catch (error) {
        const latency = Date.now() - start;
        return {
            status: 'failed',
            latency,
            error: error instanceof Error ? error.message : String(error),
        };
    } finally {
        await prisma.$disconnect().catch(() => {});
    }
}

async function checkRedis(): Promise<RedisCheck> {
    const start = Date.now();
    try {
        // Simple ping using setex/get/del pattern (Upstash compatible)
        const testKey = 'health:check:' + Date.now();
        await redis.setex(testKey, 10, 'ok');
        const value = await redis.get(testKey);
        await redis.del(testKey);

        if (value !== 'ok') {
            throw new Error('Redis value mismatch');
        }

        const latency = Date.now() - start;
        return {
            status: 'connected',
            latency,
        };
    } catch (error) {
        const latency = Date.now() - start;
        return {
            status: 'failed',
            latency,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

async function checkRpcEndpoints(): Promise<RpcCheck> {
    const chainIds = getSupportedChainIds();
    const chainStatuses: RpcChainStatus[] = [];
    let healthyCount = 0;
    let errorCount = 0;

    for (const chainId of chainIds) {
        const chainStatus = await checkSingleRpc(chainId);
        chainStatuses.push(chainStatus);

        if (chainStatus.status === 'ok') healthyCount++;
        if (chainStatus.status === 'error') errorCount++;
    }

    // Determine RPC health
    let status: RpcCheck['status'] = 'healthy';
    if (errorCount === chainIds.length) {
        status = 'unhealthy';
    } else if (errorCount > 0 || healthyCount < chainIds.length / 2) {
        status = 'degraded';
    }

    return {
        status,
        chains: chainStatuses,
    };
}

async function checkSingleRpc(chainId: number): Promise<RpcChainStatus> {
    const name = getChainName(chainId);
    const isConfigured = hasRpc(chainId);

    if (!isConfigured) {
        return {
            chainId,
            name,
            configured: false,
            status: 'not_configured',
        };
    }

    const start = Date.now();
    try {
        const { getRpcUrl } = await import('@/lib/rpc');
        const rpcUrl = getRpcUrl(chainId);

        // For EVM chains, try to get chain ID
        // For Solana, check if we can connect
        if (chainId === 0) {
            // Solana check - just verify URL is accessible
            const response = await fetch(rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'getHealth',
                }),
                signal: AbortSignal.timeout(5000),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
        } else {
            // EVM chains - get chain ID
            const response = await fetch(rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'eth_chainId',
                    params: [],
                }),
                signal: AbortSignal.timeout(5000),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error.message);
            }
        }

        const latency = Date.now() - start;
        return {
            chainId,
            name,
            configured: true,
            status: 'ok',
            latency,
        };
    } catch (error) {
        const latency = Date.now() - start;
        return {
            chainId,
            name,
            configured: true,
            status: 'error',
            latency,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
