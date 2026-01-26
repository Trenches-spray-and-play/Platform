import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * POST /api/user/wallet - Update user's payout wallet address
 */
export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { wallet } = body;

        if (!wallet || typeof wallet !== 'string') {
            return NextResponse.json(
                { error: 'Wallet address is required' },
                { status: 400 }
            );
        }

        // Basic validation - check if it looks like an address
        const isEvmAddress = wallet.startsWith('0x') && wallet.length === 42;
        const isSolAddress = wallet.length >= 32 && wallet.length <= 44 && !wallet.startsWith('0x');

        if (!isEvmAddress && !isSolAddress) {
            return NextResponse.json(
                { error: 'Invalid wallet address format' },
                { status: 400 }
            );
        }

        // Update the appropriate wallet field based on address format
        const updateData = isEvmAddress
            ? { wallet: wallet.toLowerCase(), walletEvm: wallet.toLowerCase() }
            : { wallet, walletSol: wallet };

        const updatedUser = await prisma.user.update({
            where: { id: session.id },
            data: updateData,
        });

        return NextResponse.json({
            success: true,
            data: {
                wallet: updatedUser.wallet,
                walletEvm: updatedUser.walletEvm,
                walletSol: updatedUser.walletSol,
            },
        });
    } catch (error) {
        console.error('Error updating wallet:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
