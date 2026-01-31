"use client";

import { useUIStore } from "@/store/uiStore";
import dynamic from "next/dynamic";

// Dynamically import modals to keep the main bundle thin
const ContentSubmitModal = dynamic(() => import("../earn-v2/components/ContentSubmitModal"), {
    ssr: false,
});

export default function GlobalModalManager() {
    const activeModal = useUIStore((state) => state.activeModal);
    const closeModal = useUIStore((state) => state.closeModal);

    if (!activeModal) return null;

    return (
        <>
            {activeModal === 'SUBMIT_CONTENT' && <ContentSubmitModal />}
            {/* Add more modals here as needed */}
        </>
    );
}
