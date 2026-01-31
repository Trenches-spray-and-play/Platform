"use client";

import { useUIStore } from "@/store/uiStore";
import dynamic from "next/dynamic";
import { Suspense } from "react";

// Dynamically import modals to keep the main bundle thin
const ContentSubmitModal = dynamic(() => import("../earn-v2/components/ContentSubmitModal"), {
    ssr: false,
});

const SprayModal = dynamic(() => import("./SprayModal"), {
    ssr: false,
    loading: () => <ModalLoading />,
});

const UsernameModal = dynamic(() => import("./UsernameModal"), {
    ssr: false,
    loading: () => <ModalLoading />,
});

const OnboardingTutorial = dynamic(() => import("./OnboardingTutorial"), {
    ssr: false,
    loading: () => <ModalLoading />,
});

function ModalLoading() {
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
        }}>
            <div style={{
                width: 48,
                height: 48,
                border: '3px solid rgba(34, 197, 94, 0.2)',
                borderTopColor: '#22c55e',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

interface GlobalModalManagerProps {
    campaigns?: any[];
    user?: any;
    requiresUsername?: boolean;
    showOnboarding?: boolean;
    referralInfo?: { referrerHandle: string } | null;
}

export default function GlobalModalManager({ 
    campaigns, 
    user, 
    requiresUsername, 
    showOnboarding,
    referralInfo 
}: GlobalModalManagerProps) {
    const activeModal = useUIStore((state) => state.activeModal);
    const modalData = useUIStore((state) => state.modalData);

    // Priority: Username > Onboarding > Other modals
    if (requiresUsername) {
        return (
            <Suspense fallback={<ModalLoading />}>
                <UsernameModal referralInfo={referralInfo} />
            </Suspense>
        );
    }

    if (showOnboarding && user?.handle) {
        return (
            <Suspense fallback={<ModalLoading />}>
                <OnboardingTutorial username={user.handle.replace(/^@/, "")} />
            </Suspense>
        );
    }

    if (!activeModal) return null;

    return (
        <Suspense fallback={<ModalLoading />}>
            {activeModal === 'SUBMIT_CONTENT' && <ContentSubmitModal />}
            {activeModal === 'SPRAY' && <SprayModal campaigns={modalData?.campaigns || campaigns || []} user={modalData?.user || user} />}
        </Suspense>
    );
}
