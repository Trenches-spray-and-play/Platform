import { prisma } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { rateLimit, addRateLimitHeaders } from '@/lib/rate-limit';

// ============ VALIDATION HELPERS ============

// Validate EVM wallet address (0x + 40 hex chars)
function isValidEvmAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Validate Solana wallet address (base58, 32-44 chars)
function isValidSolanaAddress(address: string): boolean {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

// Validate handle format (@username, alphanumeric + underscore)
function isValidHandle(handle: string): boolean {
    return /^@?[a-zA-Z0-9_]{1,30}$/.test(handle);
}

// Validate URL format
function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// Validate Twitter/X post URL specifically
function isValidTwitterUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return (parsed.hostname === 'twitter.com' || parsed.hostname === 'x.com') &&
               (parsed.pathname.includes('/status/') || parsed.pathname.includes('/i/'));
    } catch {
        return false;
    }
}

// ============ REFERRAL CODE GENERATOR ============

// Generate a cryptographically secure referral code
async function generateUniqueReferralCode(): Promise<string> {
    const maxAttempts = 10;
    for (let i = 0; i < maxAttempts; i++) {
        const code = crypto.randomBytes(4).toString('hex').toUpperCase();
        const existing = await prisma.user.findUnique({
            where: { referralCode: code },
            select: { id: true }
        });
        if (!existing) {
            return code;
        }
    }
    // Fallback: use longer code if collisions persist
    return crypto.randomBytes(6).toString('hex').toUpperCase();
}

export async function GET(request: Request) {
    // Apply rate limiting - general rate for GET requests
    const { limited, response: rateLimitResponse, rateLimitResult } = await rateLimit(request, 'general');
    if (limited) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const supabaseId = searchParams.get('supabaseId');

    if (!supabaseId) {
        const response = NextResponse.json({ error: 'Missing supabaseId' }, { status: 400 });
        return addRateLimitHeaders(response, rateLimitResult);
    }

    try {
        const user = await prisma.user.findUnique({
            where: { supabaseId },
            include: {
                participants: true,
            }
        });

        if (user) {
            // Generate referral code if user doesn't have one
            let referralCode = user.referralCode;
            if (!referralCode) {
                referralCode = await generateUniqueReferralCode();
                await prisma.user.update({
                    where: { id: user.id },
                    data: { referralCode }
                });
            }

            // Calculate queue position (users created before this user)
            const position = await prisma.user.count({
                where: {
                    createdAt: { lte: user.createdAt }
                }
            });

            // Get boost points from participants
            const boostPoints = user.participants.reduce((sum, p) => sum + (p.boostPoints || 0), 0);

            // Format joined date
            const joinedAt = user.createdAt.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });

            // Calculate referral count
            const referralCount = await prisma.user.count({
                where: { referredById: user.id }
            });

            const response = NextResponse.json({
                exists: true,
                user: {
                    ...user,
                    referralCode,
                    position,
                    boostPoints,
                    joinedAt,
                    referralCount,
                }
            });
            return addRateLimitHeaders(response, rateLimitResult);
        }

        const response = NextResponse.json({ exists: false });
        return addRateLimitHeaders(response, rateLimitResult);
    } catch (error) {
        console.error('Sync error:', error);
        const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        return addRateLimitHeaders(response, rateLimitResult);
    }
}

export async function POST(request: Request) {
    // Apply rate limiting - stricter for user creation (5 requests per minute)
    const { limited, response: rateLimitResponse, rateLimitResult } = await rateLimit(request, 'userSync');
    if (limited) return rateLimitResponse;

    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
        const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        return addRateLimitHeaders(response, rateLimitResult);
    }

    try {
        const body = await request.json();
        const { handle, email, walletSol, walletEvm, referredByCode, verificationLink } = body;

        // ============ INPUT VALIDATION ============
        const errors: string[] = [];

        // Validate handle if provided
        if (handle && !isValidHandle(handle)) {
            errors.push('Invalid handle format. Use 1-30 alphanumeric characters or underscores.');
        }

        // Validate wallet addresses if provided
        if (walletEvm && !isValidEvmAddress(walletEvm)) {
            errors.push('Invalid EVM wallet address format.');
        }

        if (walletSol && !isValidSolanaAddress(walletSol)) {
            errors.push('Invalid Solana wallet address format.');
        }

        // Validate verification link if provided
        if (verificationLink && !isValidTwitterUrl(verificationLink)) {
            errors.push('Invalid verification link. Please provide a valid Twitter/X post URL.');
        }

        // Return validation errors if any
        if (errors.length > 0) {
            const response = NextResponse.json({
                error: 'Validation failed',
                details: errors
            }, { status: 400 });
            return addRateLimitHeaders(response, rateLimitResult);
        }

        // ============ CHECK EXISTING USER ============
        let user = await prisma.user.findUnique({
            where: { supabaseId: authUser.id }
        });

        // ============ VALIDATE & LOOKUP REFERRER ============
        let referrerId: string | null = null;
        let referrerValid = false;

        if (referredByCode) {
            const referrer = await prisma.user.findUnique({
                where: { referralCode: referredByCode.toUpperCase() },
                select: { id: true }
            });
            if (referrer) {
                // Prevent self-referral
                if (user && referrer.id === user.id) {
                    const response = NextResponse.json({
                        error: 'You cannot use your own referral code'
                    }, { status: 400 });
                    return addRateLimitHeaders(response, rateLimitResult);
                }
                referrerId = referrer.id;
                referrerValid = true;
            }
            // If code provided but not found, we silently ignore it (user might have typed wrong)
        }

        if (user) {
            // ============ UPDATE EXISTING USER ============
            // Save old referredById to check if we're setting it for the first time
            const hadReferrerBefore = !!user.referredById;
            const isSettingReferrerNow = referrerId && !hadReferrerBefore;

            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    handle: handle || user.handle,
                    email: email || authUser.email,
                    walletSol: walletSol || user.walletSol,
                    walletEvm: walletEvm || user.walletEvm,
                    // Only set referrer if not already set and referrer is valid
                    ...(isSettingReferrerNow ? { referredById: referrerId } : {})
                }
            });

            // Store verification link as a post submission if provided
            if (verificationLink) {
                // Use the unique constraint on [userId, contentType] for upsert
                await prisma.postSubmission.upsert({
                    where: {
                        userId_contentType: {
                            userId: user.id,
                            contentType: 'onboarding_verification'
                        }
                    },
                    update: {
                        url: verificationLink,
                        updatedAt: new Date()
                    },
                    create: {
                        userId: user.id,
                        platform: 'twitter',
                        url: verificationLink,
                        contentType: 'onboarding_verification',
                        status: 'pending'
                    }
                });
            }

            // Award referrer bonus if this is the first time setting referrer
            if (isSettingReferrerNow && referrerValid && referrerId) {
                await prisma.user.update({
                    where: { id: referrerId },
                    data: { beliefScore: { increment: 50 } }
                });
            }
        } else {
            // ============ CREATE NEW USER ============
            const generatedCode = await generateUniqueReferralCode();

            // Ensure handle is unique or generate one
            let finalHandle = handle;
            if (finalHandle) {
                // Normalize handle (add @ if missing)
                finalHandle = finalHandle.startsWith('@') ? finalHandle : `@${finalHandle}`;

                // Check if handle is taken
                const existingHandle = await prisma.user.findUnique({
                    where: { handle: finalHandle },
                    select: { id: true }
                });
                if (existingHandle) {
                    const response = NextResponse.json({
                        error: 'This handle is already taken. Please choose another.'
                    }, { status: 409 });
                    return addRateLimitHeaders(response, rateLimitResult);
                }
            } else {
                finalHandle = `@user_${authUser.id.slice(0, 8)}`;
            }

            // Use transaction to ensure atomicity
            const result = await prisma.$transaction(async (tx) => {
                // Create the user
                const newUser = await tx.user.create({
                    data: {
                        supabaseId: authUser.id,
                        handle: finalHandle,
                        email: email || authUser.email,
                        walletSol: walletSol || null,
                        walletEvm: walletEvm || null,
                        referralCode: generatedCode,
                        referredById: referrerId,
                        beliefScore: 0,
                    }
                });

                // Award referrer bonus if applicable
                if (referrerId && referrerValid) {
                    await tx.user.update({
                        where: { id: referrerId },
                        data: { beliefScore: { increment: 50 } }
                    });
                }

                // Store verification link as a post submission if provided
                if (verificationLink) {
                    await tx.postSubmission.create({
                        data: {
                            userId: newUser.id,
                            platform: 'twitter',
                            url: verificationLink,
                            contentType: 'onboarding_verification',
                            status: 'pending'
                        }
                    });
                }

                return newUser;
            });

            user = result;
        }

        // Calculate position for new user (rank = how many users joined before or at same time)
        const position = await prisma.user.count({
            where: {
                createdAt: { lte: user.createdAt }
            }
        });

        // Get boost points
        const participants = await prisma.participant.findMany({
            where: { userId: user.id }
        });
        const boostPoints = participants.reduce((sum, p) => sum + (p.boostPoints || 0), 0);

        // Format joined date
        const joinedAt = user.createdAt.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        // Calculate referral count
        const referralCount = await prisma.user.count({
            where: { referredById: user.id }
        });

        const response = NextResponse.json({
            success: true,
            user: {
                ...user,
                position,
                boostPoints,
                joinedAt,
                referralCount,
            }
        });
        return addRateLimitHeaders(response, rateLimitResult);
    } catch (error: any) {
        console.error('Create/Update user error:', error);

        // Handle specific Prisma errors
        if (error.code === 'P2002') {
            // Unique constraint violation
            const field = error.meta?.target?.[0] || 'field';
            const response = NextResponse.json({
                error: `This ${field} is already in use. Please try a different value.`
            }, { status: 409 });
            return addRateLimitHeaders(response, rateLimitResult);
        }

        if (error.code === 'P2003') {
            // Foreign key constraint violation
            const response = NextResponse.json({
                error: 'Invalid reference. Please try again.'
            }, { status: 400 });
            return addRateLimitHeaders(response, rateLimitResult);
        }

        const response = NextResponse.json({
            error: 'An unexpected error occurred. Please try again later.'
        }, { status: 500 });
        return addRateLimitHeaders(response, rateLimitResult);
    }
}
