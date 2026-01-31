"use client";

import { useEffect, useRef, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { storeReferralCode } from '@/lib/referral-cookie';

function ReferralRedirectContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const code = params.code as string;
    const hasLogged = useRef(false);

    useEffect(() => {
        if (code && !hasLogged.current) {
            hasLogged.current = true;

            // Extract UTM parameters
            const utmSource = searchParams.get('utm_source');
            const utmMedium = searchParams.get('utm_medium');
            const utmCampaign = searchParams.get('utm_campaign');

            // Store referral code in all storage mechanisms
            storeReferralCode(code);

            // Log visit for analytics (async, don't block redirect)
            fetch('/api/referral', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code,
                    utmSource,
                    utmMedium,
                    utmCampaign,
                    logVisitOnly: true
                })
            }).catch(err => console.error('Failed to log referral visit:', err));

            // Redirect to the join page with the code in the query param
            const queryParams = new URLSearchParams(searchParams.toString());
            queryParams.set('ref', code);
            router.push(`/join?${queryParams.toString()}`);
        } else if (!code) {
            router.push('/join');
        }
    }, [code, router, searchParams]);

    return (
        <main style={{
            minHeight: '100vh',
            background: '#000',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '2rem',
        }}>
            <p style={{ letterSpacing: '2px', fontWeight: 700, textTransform: 'uppercase' }}>
                SYNCING REFERRAL PROTOCOL...
            </p>
        </main>
    );
}

export default function ReferralRedirect() {
    return (
        <Suspense fallback={
            <main style={{
                minHeight: '100vh',
                background: '#000',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '2rem',
            }}>
                <p style={{ letterSpacing: '2px', fontWeight: 700, textTransform: 'uppercase' }}>
                    INITIALIZING...
                </p>
            </main>
        }>
            <ReferralRedirectContent />
        </Suspense>
    );
}
