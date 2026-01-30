import { redis } from '@/lib/redis';
import { prisma } from '@/lib/db';
import { scanEvmChain } from './evm-scanner.service';
import { scanSolana } from './solana-scanner.service';
import { creditDeposits, FoundDeposit } from './deposit-credit.service';

const SCAN_BLOCKS_COUNT = 1000; // Increased from 100 to catch older deposits (~15-20 min window)
const RATE_LIMIT_WINDOW_MS = 30000; // 30 seconds
const CHAIN_SCAN_TIMEOUT_MS = 3000; // 3 seconds per chain

/**
 * Helper to wrap a promise with a timeout
 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, chain: string): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`TIMEOUT:${chain}`)), timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]);
}

/**
 * Orchestrates an on-demand scan for deposits across multiple chains.
 * Enforces rate limits and parallelizes chain-specific scanners.
 */
export async function scanForDeposits(userId: string, requestedChain: string = 'all') {
    const startTime = Date.now();

    // 1. Rate Limiting (Vercel KV)
    const rateLimitKey = `deposit_check:${userId}`;
    let lastCheck: number | null = null;

    try {
        lastCheck = await redis.get<number>(rateLimitKey);
    } catch (err) {
        console.error('[DepositScanner] Vercel KV error (fail-closed):', err);
        // We prefer fail-closed for protection in this critical path
        throw new Error('SERVICE_UNAVAILABLE');
    }

    if (lastCheck && (startTime - lastCheck) < RATE_LIMIT_WINDOW_MS) {
        const retryAfter = Math.ceil((RATE_LIMIT_WINDOW_MS - (startTime - lastCheck)) / 1000);
        const error = new Error('RATE_LIMITED');
        (error as any).retryAfter = retryAfter;
        throw error;
    }

    // Update rate limit immediately
    await redis.set(rateLimitKey, startTime, { ex: 60 });

    // 2. Identify deposit addresses to scan
    const depositAddresses = await prisma.depositAddress.findMany({
        where: { userId }
    });

    if (depositAddresses.length === 0) {
        throw new Error('NO_DEPOSIT_ADDRESS');
    }

    // 3. Launch parallel scans per chain
    const scanTasks: Promise<FoundDeposit[]>[] = [];
    const chainsToScan: string[] = [];

    for (const da of depositAddresses) {
        // Filter by requested chain if specified
        if (requestedChain !== 'all' && requestedChain !== da.chain) continue;

        chainsToScan.push(da.chain);

        const scanPromise = da.chain === 'solana'
            ? scanSolana(da.address)
            : scanEvmChain(da.chain, da.address, SCAN_BLOCKS_COUNT);

        // Wrap with timeout as requested in review
        scanTasks.push(withTimeout(scanPromise, CHAIN_SCAN_TIMEOUT_MS, da.chain));
    }

    if (chainsToScan.length === 0) {
        throw new Error('NO_MATCHING_CHAIN');
    }

    console.log(`[DepositScanner] Starting parallel scan for user ${userId} on chains: ${chainsToScan.join(', ')}`);

    // We use allSettled to ensure failure on one chain doesn't block others
    const results = await Promise.allSettled(scanTasks);

    const foundDeposits: FoundDeposit[] = [];
    const chainsFailed: string[] = [];

    results.forEach((res, index) => {
        const chain = chainsToScan[index];
        if (res.status === 'fulfilled') {
            foundDeposits.push(...res.value);
        } else {
            console.error(`[DepositScanner] ❌ Scan failed for ${chain}:`, res.reason);
            chainsFailed.push(chain);
        }
    });

    // 4. Process and credit all found deposits
    let credited: any[] = [];
    if (foundDeposits.length > 0) {
        credited = await creditDeposits(userId, foundDeposits);
    }

    // 5. Finalize and Log the attempt
    const durationMs = Date.now() - startTime;
    console.log(`[DepositScanner] Scan complete in ${durationMs}ms. Found ${foundDeposits.length} deposits.`);

    await (prisma as any).depositScanLog.create({
        data: {
            userId,
            chain: requestedChain,
            foundCount: credited.filter(c => !c.alreadyProcessed).length,
            durationMs,
            error: chainsFailed.length > 0 ? `Failed chains: ${chainsFailed.join(', ')}` : null,
        }
    }).catch((err: any) => console.error('[DepositScanner] Failed to log scan attempt:', err));

    return {
        success: true,
        scannedAt: new Date().toISOString(),
        chainsScanned: chainsToScan,
        found: credited.length,
        deposits: credited,
        notFoundOnChains: chainsToScan.filter(c =>
            !foundDeposits.some(d => d.chain === c) && !chainsFailed.includes(c)
        ),
        failedChains: chainsFailed
    };
}
