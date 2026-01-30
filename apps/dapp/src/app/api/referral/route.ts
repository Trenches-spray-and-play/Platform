import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
    getOrCreateReferralCode,
    validateReferralCode,
    applyReferral,
    getReferrals,
    generateReferralLink,
    logReferralVisit,
} from '@/services/referral.service';
import { prisma } from '@/lib/db';

/**
 * GET /api/referral
 * Get current user's referral code, link, and referrals list
 * Query params: ?code=ABC123 to validate a code
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const codeToValidate = searchParams.get('code');

    // If validating a code (public endpoint)
    if (codeToValidate) {
        const result = await validateReferralCode(codeToValidate);
        return NextResponse.json(result);
    }

    // Otherwise, get current user's referral info
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
        where: { supabaseId: user.id },
        select: { id: true },
    });

    if (!dbUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    try {
        const code = await getOrCreateReferralCode(dbUser.id);
        const link = generateReferralLink(code);
        const { count, referrals } = await getReferrals(dbUser.id);

        return NextResponse.json({
            success: true,
            data: {
                code,
                link,
                referralCount: count,
                referrals: referrals.map(r => ({
                    id: r.id,
                    handle: r.handle,
                    joinedAt: r.createdAt.toISOString(),
                })),
            },
        });
    } catch (error) {
        console.error('Error getting referral info:', error);
        return NextResponse.json(
            { error: 'Failed to get referral info' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/referral
 * Apply a referral code to the current user
 * Body: { code: "ABC123" }
 */
export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
        where: { supabaseId: user.id },
        select: { id: true, referredById: true },
    });

    if (!dbUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (dbUser.referredById) {
        return NextResponse.json(
            { error: 'You have already been referred' },
            { status: 400 }
        );
    }

    try {
        const body = await request.json();
        const { code, utmSource, utmMedium, utmCampaign, logVisitOnly } = body;

        if (!code) {
            return NextResponse.json(
                { error: 'Referral code is required' },
                { status: 400 }
            );
        }

        // Validate the code
        const validation = await validateReferralCode(code);
        if (!validation.valid || !validation.referrer) {
            return NextResponse.json(
                { error: validation.error || 'Invalid referral code' },
                { status: 400 }
            );
        }

        // Handle analytics visit logging only
        if (logVisitOnly) {
            const forwardedFor = request.headers.get('x-forwarded-for');
            const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';
            const userAgent = request.headers.get('user-agent') || 'unknown';

            await logReferralVisit({
                code: code.toUpperCase(),
                referrerId: validation.referrer.id,
                ip,
                userAgent,
                utmSource,
                utmMedium,
                utmCampaign,
            });

            return NextResponse.json({ success: true, message: 'Visit logged' });
        }

        // Apply the referral
        const result = await applyReferral(dbUser.id, validation.referrer.id);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to apply referral' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Successfully linked to ${validation.referrer.handle}`,
            data: {
                referrerHandle: validation.referrer.handle,
            },
        });
    } catch (error) {
        console.error('Error applying referral:', error);
        return NextResponse.json(
            { error: 'Failed to apply referral' },
            { status: 500 }
        );
    }
}
