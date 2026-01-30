"use client";

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { storeReferralCode } from '@/lib/referral-cookie';

export default function ReferralRedirect() {
    const params = useParams();
    const router = useRouter();
    const code = params.code as string;

    useEffect(() => {
        if (code) {
            // Store referral code in all storage mechanisms
            // This ensures it persists through OAuth redirects
            storeReferralCode(code);
            
            // Redirect to the join page with the code in the query param
            router.push(`/join?ref=${code}`);
        } else {
            router.push('/join');
        }
    }, [code, router]);

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
