/**
 * User Addresses API
 * 
 * GET  - List user's addresses
 * POST - Add new address
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import { addAddress, listAddresses } from '@/services/address-book.service';
import { sendAddressConfirmationEmail } from '@/services/alert.service';

async function getAuthenticatedUser() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const dbUser = await prisma.user.findUnique({
        where: { supabaseId: user.id }
    });

    return dbUser;
}

/**
 * GET /api/user/addresses
 * List all addresses for authenticated user
 */
export async function GET() {
    const user = await getAuthenticatedUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const addresses = await listAddresses(user.id);

        return NextResponse.json({
            success: true,
            data: addresses
        });
    } catch (error) {
        console.error('Error listing addresses:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to list addresses' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/user/addresses
 * Add new address
 * 
 * Body: { address: string, chain: 'EVM' | 'SOLANA', label?: string }
 */
export async function POST(request: Request) {
    const user = await getAuthenticatedUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { address, chain, label } = body;

        if (!address || !chain) {
            return NextResponse.json(
                { success: false, error: 'Address and chain are required' },
                { status: 400 }
            );
        }

        if (!['EVM', 'SOLANA'].includes(chain)) {
            return NextResponse.json(
                { success: false, error: 'Invalid chain. Must be EVM or SOLANA' },
                { status: 400 }
            );
        }

        const result = await addAddress(user.id, address, chain, label);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        // 📧 Send confirmation email with token
        if (result.token && user.email) {
            await sendAddressConfirmationEmail(user.email, address, result.token);
        }

        return NextResponse.json({
            success: true,
            data: {
                addressId: result.addressId,
                message: 'Check your email to confirm this address'
            }
        });
    } catch (error) {
        console.error('Error adding address:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to add address' },
            { status: 500 }
        );
    }
}
