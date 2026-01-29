import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { freezeAndMigratePayouts } from '@/services/payout.service';
import { requireAdminAuth } from '@/lib/admin-auth';
import { logConfigChanges } from '@/services/config-audit.service';
import { validateCampaignConfig } from '@/services/config-validation.service';

// Chain options
export const CHAIN_OPTIONS = [
    { id: 999, name: 'HyperEVM' },
    { id: 1, name: 'Ethereum' },
    { id: 8453, name: 'Base' },
    { id: 42161, name: 'Arbitrum' },
    { id: 0, name: 'Solana' },
];

// GET /api/admin/campaigns - List all campaigns with waitlist stats
export async function GET() {
    // Verify admin authentication
    const auth = await requireAdminAuth();
    if (!auth.authorized) {
        return auth.response;
    }

    try {
        const campaigns = await prisma.campaignConfig.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                waitlist: {
                    select: {
                        id: true,
                        hasDeposited: true,
                        depositAmount: true,
                    }
                }
            }
        });

        // Add waitlist stats to each campaign
        const campaignsWithStats = campaigns.map(campaign => {
            const waitlistEntries = campaign.waitlist || [];
            const waitingNoDeposit = waitlistEntries.filter(w => !w.hasDeposited).length;
            const waitingWithDeposit = waitlistEntries.filter(w => w.hasDeposited).length;
            const totalDepositedInWaitlist = waitlistEntries
                .filter(w => w.hasDeposited)
                .reduce((sum, w) => sum + Number(w.depositAmount || 0), 0);

            // Remove the raw waitlist array and add computed stats
            const { waitlist, ...campaignData } = campaign;
            return {
                ...campaignData,
                waitlistStats: {
                    totalInWaitlist: waitlistEntries.length,
                    waitingNoDeposit,
                    waitingWithDeposit,
                    totalDepositedUsd: totalDepositedInWaitlist,
                }
            };
        });

        return NextResponse.json({
            success: true,
            data: campaignsWithStats,
        });
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch campaigns' },
            { status: 500 }
        );
    }
}

// POST /api/admin/campaigns - Create new campaign
export async function POST(request: Request) {
    // Verify admin authentication
    const auth = await requireAdminAuth();
    if (!auth.authorized) {
        return auth.response;
    }

    try {
        const body = await request.json();
        const {
            name,
            trenchIds,
            tokenAddress,
            tokenSymbol,
            tokenDecimals,
            chainId,
            chainName,
            acceptedTokens,
            roiMultiplier,
            manualPrice,
            useOracle,
            oracleSource,
            startsAt,
            acceptDepositsBeforeStart,
            isPaused,
            payoutIntervalSeconds,
        } = body;

        if (!name || !tokenAddress || !tokenSymbol) {
            return NextResponse.json(
                { success: false, error: 'name, tokenAddress, and tokenSymbol are required' },
                { status: 400 }
            );
        }

        // 🔍 Validate input values before saving
        const validation = validateCampaignConfig(body);
        if (!validation.valid) {
            return NextResponse.json({
                success: false,
                error: 'Invalid configuration values',
                validationErrors: validation.errors,
            }, { status: 400 });
        }

        const campaign = await prisma.campaignConfig.create({
            data: {
                name,
                trenchIds: trenchIds || [],
                tokenAddress,
                tokenSymbol,
                tokenDecimals: tokenDecimals || 18,
                chainId: chainId || 999,
                chainName: chainName || 'HyperEVM',
                acceptedTokens: JSON.stringify(acceptedTokens || []),
                roiMultiplier: roiMultiplier || 1.5,
                manualPrice: manualPrice || null,
                useOracle: useOracle || false,
                oracleSource: oracleSource || null,
                isActive: true,
                startsAt: startsAt ? new Date(startsAt) : null,
                acceptDepositsBeforeStart: acceptDepositsBeforeStart || false,
                isPaused: isPaused || false,
                payoutIntervalSeconds: payoutIntervalSeconds || 5,
            },
        });

        return NextResponse.json({
            success: true,
            data: campaign,
            message: `Campaign "${name}" created`,
        });
    } catch (error) {
        console.error('Error creating campaign:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create campaign' },
            { status: 500 }
        );
    }
}

// PUT /api/admin/campaigns - Update campaign
export async function PUT(request: Request) {
    // Verify admin authentication
    const auth = await requireAdminAuth();
    if (!auth.authorized) {
        return auth.response;
    }

    try {
        const body = await request.json();
        const { id, waitlistStats, ...rawUpdates } = body; // Exclude computed fields

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Campaign id is required' },
                { status: 400 }
            );
        }

        // 🔒 PHASE 1B: Block critical updates during active payout processing
        const criticalFields = ['manualPrice', 'roiMultiplier', 'tokenAddress', 'tokenDecimals', 'chainId'];
        const isCriticalUpdate = criticalFields.some(field => field in rawUpdates);

        if (isCriticalUpdate) {
            // Check if there are active payouts
            const activePayoutCount = await prisma.payout.count({
                where: { status: { in: ['EXECUTING', 'PENDING'] } }
            });

            if (activePayoutCount > 0) {
                return NextResponse.json({
                    success: false,
                    error: 'Cannot update price/ROI while payouts are processing',
                    suggestion: 'Pause payouts first, then make changes',
                    activePayouts: activePayoutCount,
                    lockedFields: criticalFields.filter(f => f in rawUpdates),
                }, { status: 409 });
            }
        }

        // 🔍 PHASE 2D: Validate input values before saving
        const validation = validateCampaignConfig(rawUpdates);
        if (!validation.valid) {
            return NextResponse.json({
                success: false,
                error: 'Invalid configuration values',
                validationErrors: validation.errors,
            }, { status: 400 });
        }

        // Sanitize updates - only allow valid campaign fields
        const updates: Record<string, any> = {};

        const allowedFields = [
            'name', 'trenchIds', 'tokenAddress', 'tokenSymbol', 'tokenDecimals',
            'chainId', 'chainName', 'acceptedTokens', 'roiMultiplier', 'manualPrice',
            'useOracle', 'oracleSource', 'reserveRoundingUnit', 'isActive', 'isHidden',
            'isPaused', 'payoutIntervalSeconds', 'startsAt', 'acceptDepositsBeforeStart'
        ];

        for (const field of allowedFields) {
            if (field in rawUpdates) {
                let value = rawUpdates[field];

                // Handle empty strings for nullable fields
                if (field === 'startsAt') {
                    if (value === '' || value === null) {
                        value = null;
                    } else {
                        value = new Date(value);
                    }
                }
                if (field === 'manualPrice' && value === '') {
                    value = null;
                }
                if (field === 'oracleSource' && value === '') {
                    value = null;
                }

                // Ensure numeric types
                if (field === 'roiMultiplier' && typeof value === 'string') {
                    value = parseFloat(value) || 1.5;
                }
                if (field === 'payoutIntervalSeconds' && typeof value === 'string') {
                    value = parseInt(value) || 5;
                }
                if (field === 'tokenDecimals' && typeof value === 'string') {
                    value = parseInt(value) || 18;
                }
                if (field === 'reserveRoundingUnit' && typeof value === 'string') {
                    value = parseInt(value) || 1000000;
                }

                updates[field] = value;
            }
        }

        // If acceptedTokens is an array, stringify it
        if (updates.acceptedTokens && Array.isArray(updates.acceptedTokens)) {
            updates.acceptedTokens = JSON.stringify(updates.acceptedTokens);
        }

        const campaign = await prisma.campaignConfig.update({
            where: { id },
            data: updates,
        });

        // 📝 Log config changes for audit trail
        try {
            const oldCampaign = await prisma.campaignConfig.findUnique({ where: { id } });
            if (oldCampaign) {
                await logConfigChanges({
                    configType: 'campaign',
                    configId: id,
                    oldConfig: rawUpdates, // What was sent
                    newConfig: updates,    // What was applied
                    changedBy: auth.admin?.email || 'admin',
                });
            }
        } catch (auditError) {
            console.error('Failed to log config change:', auditError);
            // Don't fail the update for audit logging errors
        }

        // If token or chain changed, migrate pending payouts
        if (updates.tokenAddress || updates.chainId) {
            try {
                const migratedCount = await freezeAndMigratePayouts({
                    tokenAddress: campaign.tokenAddress,
                    tokenSymbol: campaign.tokenSymbol,
                    tokenDecimals: campaign.tokenDecimals,
                    chainId: campaign.chainId,
                });
                console.log(`Migrated ${migratedCount} pending payouts to new settlement config`);
            } catch (migrateError) {
                console.error('Failed to migrate payouts:', migrateError);
                // Don't fail the update, just log the error
            }
        }

        return NextResponse.json({
            success: true,
            data: campaign,
            message: 'Campaign updated',
        });
    } catch (error) {
        console.error('Error updating campaign:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update campaign' },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/campaigns - Delete campaign
export async function DELETE(request: Request) {
    // Verify admin authentication
    const auth = await requireAdminAuth();
    if (!auth.authorized) {
        return auth.response;
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Campaign id is required' },
                { status: 400 }
            );
        }

        const result = await prisma.campaignConfig.deleteMany({
            where: { id },
        });

        if (result.count === 0) {
            return NextResponse.json({
                success: false,
                error: 'Campaign not found',
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Campaign deleted',
        });
    } catch (error: any) {
        console.error('Error deleting campaign:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to delete campaign',
                details: error.message || 'Unknown error',
                code: error.code
            },
            { status: 500 }
        );
    }
}
