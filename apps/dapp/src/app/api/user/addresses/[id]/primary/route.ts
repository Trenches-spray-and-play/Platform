/**
 * Set Address as Primary API
 * 
 * PUT - Set address as primary for its chain
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import { setPrimary } from '@/services/address-book.service';

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
 * PUT /api/user/addresses/[id]/primary
 * Set address as primary for its chain
 */
export async function PUT(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getAuthenticatedUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: addressId } = await params;

    try {
        const result = await setPrimary(user.id, addressId);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Address set as primary'
        });
    } catch (error) {
        console.error('Error setting primary:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to set primary address' },
            { status: 500 }
        );
    }
}
