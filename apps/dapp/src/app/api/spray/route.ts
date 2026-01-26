import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { Decimal } from '@prisma/client/runtime/library';
import { rateLimit, addRateLimitHeaders } from '@/lib/rate-limit';

/**
 * POST /api/spray - Process spray payment from user balance
 *
 * New flow:
 * 1. Validate amount against user balance
 * 2. Deduct balance atomically
 * 3. Create SprayEntry with PENDING_TASKS status
 * 4. Return sprayEntryId for task completion flow
 */
export async function POST(request: Request) {
    // Apply rate limiting - 10 requests per minute
    const { limited, response: rateLimitResponse, rateLimitResult } = await rateLimit(request, 'spray');
    if (limited) return rateLimitResponse;

    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { trenchId, amount, level } = body;

        // Validation
        if (!trenchId || !amount) {
            return NextResponse.json(
                { error: 'Missing required fields: trenchId, amount' },
                { status: 400 }
            );
        }

        const amountNum = Number(amount);
        if (amountNum <= 0) {
            return NextResponse.json(
                { error: 'Amount must be positive' },
                { status: 400 }
            );
        }

        // Get user from session
        const user = await prisma.user.findUnique({
            where: { id: session.id },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Check balance
        const userBalance = Number(user.balance);
        if (userBalance < amountNum) {
            return NextResponse.json(
                { error: 'Insufficient balance', balance: userBalance },
                { status: 400 }
            );
        }

        // Verify trench exists - support both direct trenchId and campaignId
        // First, try to find as a direct trench
        let trench = await prisma.trench.findUnique({
            where: { id: trenchId },
        });

        // If not found, check if it's a campaignId and resolve to trench
        if (!trench) {
            const campaign = await prisma.campaignConfig.findUnique({
                where: { id: trenchId },
            });

            if (campaign && campaign.trenchIds.length > 0) {
                // If level is provided, use it; otherwise fallback to first level
                const requestedLevel = level?.toUpperCase() || campaign.trenchIds[0].toUpperCase();
                // Validate that the requested level is in the campaign's trenchIds
                const validLevels = campaign.trenchIds.map(l => l.toUpperCase());
                const trenchLevel = validLevels.includes(requestedLevel) ? requestedLevel : validLevels[0];
                trench = await prisma.trench.findFirst({
                    where: { level: trenchLevel as 'RAPID' | 'MID' | 'DEEP' },
                });
            }
        }

        if (!trench) {
            return NextResponse.json(
                { error: 'Trench not found' },
                { status: 404 }
            );
        }

        if (!trench.active) {
            return NextResponse.json(
                { error: 'Trench is not active' },
                { status: 400 }
            );
        }

        // Atomic operation: deduct balance and create spray entry
        const [updatedUser, sprayEntry] = await prisma.$transaction([
            // Deduct balance
            prisma.user.update({
                where: { id: user.id },
                data: {
                    balance: {
                        decrement: new Decimal(amountNum),
                    },
                },
            }),
            // Create spray entry with PENDING_TASKS status
            prisma.sprayEntry.create({
                data: {
                    userId: user.id,
                    trenchId: trench.id,
                    amount: new Decimal(amountNum),
                    status: 'PENDING_TASKS',
                },
            }),
        ]);

        const response = NextResponse.json({
            success: true,
            data: {
                sprayEntryId: sprayEntry.id,
                amount: amountNum,
                newBalance: Number(updatedUser.balance),
                requiresTasks: true,
            },
        });
        return addRateLimitHeaders(response, rateLimitResult);
    } catch (error) {
        console.error('Error processing spray:', error);
        const response = NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
        return addRateLimitHeaders(response, rateLimitResult);
    }
}
