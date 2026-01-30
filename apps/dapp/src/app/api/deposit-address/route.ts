/**
 * Deposit Address API
 *
 * GET: Get deposit address for current user on specified chain
 * POST: Get or create deposit addresses for all chains
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    getDepositAddress,
    getUserDepositAddresses,
    getSupportedChains,
    isHdWalletConfigured,
    Chain
} from '@/services/deposit-address.service';
import { rateLimit, addRateLimitHeaders } from '@/lib/rate-limit';

// GET /api/deposit-address?chain=ethereum&userId=xxx
export async function GET(request: NextRequest) {
    // Apply rate limiting - 5 requests per minute
    const { limited, response: rateLimitResponse, rateLimitResult } = await rateLimit(request, 'depositAddress');
    if (limited) return rateLimitResponse;

    try {
        const { searchParams } = new URL(request.url);
        const chain = searchParams.get('chain') as Chain | null;
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'userId is required' },
                { status: 400 }
            );
        }

        if (!isHdWalletConfigured()) {
            return NextResponse.json(
                { error: 'Deposit addresses not configured' },
                { status: 503 }
            );
        }

        // If chain specified, return single address
        if (chain) {
            const supportedChains = getSupportedChains();
            if (!supportedChains.includes(chain)) {
                return NextResponse.json(
                    { error: `Unsupported chain: ${chain}. Supported: ${supportedChains.join(', ')}` },
                    { status: 400 }
                );
            }

            const result = await getDepositAddress(userId, chain);
            return NextResponse.json({
                chain,
                address: result.address,
                isNew: result.isNew,
            });
        }

        // Return all addresses for user
        const addresses = await getUserDepositAddresses(userId);
        return NextResponse.json({ addresses });

    } catch (error) {
        console.error('Error getting deposit address:', error);
        return NextResponse.json(
            { error: 'Failed to get deposit address' },
            { status: 500 }
        );
    }
}

// POST /api/deposit-address - Create deposit addresses for one or all chains
export async function POST(request: NextRequest) {
    // Apply rate limiting - 5 requests per minute
    const { limited, response: rateLimitResponse, rateLimitResult } = await rateLimit(request, 'depositAddress');
    if (limited) return rateLimitResponse;

    try {
        const body = await request.json();
        const { userId, chain } = body;

        if (!userId) {
            return NextResponse.json(
                { error: 'userId is required' },
                { status: 400 }
            );
        }

        if (!isHdWalletConfigured()) {
            return NextResponse.json(
                { error: 'Deposit addresses not configured' },
                { status: 503 }
            );
        }

        const supportedChains = getSupportedChains();

        // If specific chain requested, generate only that one
        if (chain) {
            if (!supportedChains.includes(chain as Chain)) {
                return NextResponse.json(
                    { error: `Unsupported chain: ${chain}. Supported: ${supportedChains.join(', ')}` },
                    { status: 400 }
                );
            }

            const result = await getDepositAddress(userId, chain as Chain);
            return NextResponse.json({
                success: true,
                chain,
                address: result.address,
                isNew: result.isNew
            });
        }

        // Backward compatibility: Create/return all addresses
        const addresses: Record<string, string> = {};

        for (const c of supportedChains) {
            const result = await getDepositAddress(userId, c);
            addresses[c] = result.address;
        }

        return NextResponse.json({
            success: true,
            addresses
        });

    } catch (error) {
        console.error('Error creating deposit addresses:', error);
        return NextResponse.json(
            { error: 'Failed to create deposit addresses' },
            { status: 500 }
        );
    }
}
