/**
 * Delete Address API
 * 
 * DELETE - Remove address from book
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import { removeAddress } from '@/services/address-book.service';

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
 * DELETE /api/user/addresses/[id]
 * Remove address from book (cannot remove PRIMARY)
 */
export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getAuthenticatedUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: addressId } = await params;

    try {
        const result = await removeAddress(user.id, addressId);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Address removed'
        });
    } catch (error) {
        console.error('Error removing address:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to remove address' },
            { status: 500 }
        );
    }
}
