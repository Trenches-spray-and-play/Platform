import { NextResponse } from 'next/server';
import { getActiveCampaignToken, updateCampaignToken } from '@/services/payout.service';
import { requireAdminAuth } from '@/lib/admin-auth';

// GET /api/admin/campaign - Get current campaign token config
export async function GET() {
    const auth = await requireAdminAuth();
    if (!auth.authorized) return auth.response;

    try {
        const config = await getActiveCampaignToken();

        return NextResponse.json({
            success: true,
            data: config,
        });
    } catch (error) {
        console.error('Error fetching campaign config:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch campaign config' },
            { status: 500 }
        );
    }
}

// PUT /api/admin/campaign - Update campaign token
export async function PUT(request: Request) {
    const auth = await requireAdminAuth();
    if (!auth.authorized) return auth.response;

    try {
        const body = await request.json();
        const { tokenAddress, tokenSymbol, tokenDecimals, chainId, chainName } = body;

        if (!tokenAddress || !tokenSymbol || !chainId) {
            return NextResponse.json(
                { success: false, error: 'tokenAddress, tokenSymbol, and chainId are required' },
                { status: 400 }
            );
        }

        const config = await updateCampaignToken({
            tokenAddress,
            tokenSymbol,
            tokenDecimals,
            chainId,
            chainName,
        });

        return NextResponse.json({
            success: true,
            data: config,
            message: `Campaign token updated to ${tokenSymbol}`,
        });
    } catch (error) {
        console.error('Error updating campaign config:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update campaign config' },
            { status: 500 }
        );
    }
}
