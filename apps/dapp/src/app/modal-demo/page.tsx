"use client";

import { useState } from "react";
import OnboardingModal from "@/components/OnboardingModal";
import SprayModal from "@/components/SprayModal";
import styles from "./page.module.css";

// Dummy trench data
const mockTrench = {
    id: "trial-trench-1",
    name: "TRIAL TRENCH",
    level: "MID",
    minEntry: 10,
    maxEntry: 100,
    roiMultiplier: 1.5,
    roiCap: "1.5x"
};

export default function ModalDemoPage() {
    const [enlistOpen, setEnlistOpen] = useState(false);
    const [sprayOpen, setSprayOpen] = useState(false);
    const [secureSpotOpen, setSecureSpotOpen] = useState(false);

    return (
        <main className={styles.container}>
            <div className={styles.header}>
                <h1>MODAL UI DEMO</h1>
                <p>Preview the core interaction flows for Trenches.</p>
            </div>

            <div className={styles.demoGrid}>
                <div className={styles.demoCard}>
                    <h2>ENLIST</h2>
                    <p>The initial onboarding flow for new users.</p>
                    <button
                        className={styles.demoBtn}
                        onClick={() => setEnlistOpen(true)}
                    >
                        TRIGGER ENLIST
                    </button>
                </div>

                <div className={styles.demoCard}>
                    <h2>SPRAY</h2>
                    <p>The active deployment flow in a live trench.</p>
                    <button
                        className={styles.demoBtn}
                        onClick={() => setSprayOpen(true)}
                    >
                        TRIGGER SPRAY
                    </button>
                </div>

                <div className={styles.demoCard}>
                    <h2>SECURE SPOT</h2>
                    <p>The pre-launch commitment flow (Accepting Phase).</p>
                    <button
                        className={styles.demoBtn}
                        onClick={() => setSecureSpotOpen(true)}
                    >
                        TRIGGER SECURE SPOT
                    </button>
                </div>
            </div>

            {/* Modals */}
            <OnboardingModal
                isOpen={enlistOpen}
                onClose={() => setEnlistOpen(false)}
                onComplete={(data) => {
                    console.log("Onboarding Complete:", data);
                    setEnlistOpen(false);
                }}
            />

            <SprayModal
                isOpen={sprayOpen}
                onClose={() => setSprayOpen(false)}
                onConfirm={() => {
                    console.log("Spray Confirmed");
                    setSprayOpen(false);
                }}
                trench={mockTrench}
                phase="LIVE"
            />

            <SprayModal
                isOpen={secureSpotOpen}
                onClose={() => setSecureSpotOpen(false)}
                onConfirm={() => {
                    console.log("Secure Spot Confirmed");
                    setSecureSpotOpen(false);
                }}
                trench={mockTrench}
                phase="ACCEPTING"
            />
        </main>
    );
}
