"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/store/uiStore";
import styles from "./OnboardingTutorial.module.css";

interface OnboardingTutorialProps {
    username: string;
}

interface TutorialStep {
    id: string;
    title: string;
    description: string;
    icon: string;
    features: string[];
}

const TUTORIAL_STEPS: TutorialStep[] = [
    {
        id: "welcome",
        title: "Welcome to the Trenches",
        description: "You've claimed your identity. Now let's get you familiar with the protocol.",
        icon: "◆",
        features: [
            "Non-custodial coordination protocol",
            "Time-locked yield strategies", 
            "Community-driven campaigns"
        ]
    },
    {
        id: "dashboard",
        title: "Your Command Center",
        description: "The dashboard is where you track everything—positions, balance, and performance.",
        icon: "◈",
        features: [
            "Track active positions in real-time",
            "Monitor expected returns",
            "Manage auto-boost settings"
        ]
    },
    {
        id: "spray",
        title: "Spray & Deploy",
        description: "Spray liquidity into campaigns to start earning. Choose your trench type based on your timeline.",
        icon: "⚡",
        features: [
            "Rapid (1 day): Quick flips, lower ROI",
            "Mid (7 days): Balanced approach",
            "Deep (30 days): Maximum yield"
        ]
    },
    {
        id: "belief",
        title: "Belief Score",
        description: "Your reputation in the trenches. Higher scores unlock better opportunities.",
        icon: "✦",
        features: [
            "Earn points for participation",
            "Complete tasks to boost score",
            "Unlock exclusive campaigns"
        ]
    },
    {
        id: "start",
        title: "You're Ready",
        description: "The trenches await. Start exploring campaigns and deploy your first spray.",
        icon: "→",
        features: [
            "Browse live campaigns",
            "Deposit funds to begin",
            "Join the community"
        ]
    }
];

export default function OnboardingTutorial({ username }: OnboardingTutorialProps) {
    const router = useRouter();
    const closeModal = useUIStore((state) => state.closeModal);
    const addToast = useUIStore((state) => state.addToast);

    const [currentStep, setCurrentStep] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [direction, setDirection] = useState<"next" | "prev">("next");

    const step = TUTORIAL_STEPS[currentStep];
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
    const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

    // Prevent closing during onboarding
    const handleBackdropClick = () => {
        addToast("Complete the tutorial to continue", "info");
    };

    const handleNext = () => {
        if (isLastStep) {
            completeTutorial();
        } else {
            setDirection("next");
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentStep(prev => prev + 1);
                setIsAnimating(false);
            }, 200);
        }
    };

    const handlePrev = () => {
        if (!isFirstStep) {
            setDirection("prev");
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentStep(prev => prev - 1);
                setIsAnimating(false);
            }, 200);
        }
    };

    const handleSkip = () => {
        // Mark as complete but note they skipped
        localStorage.setItem("trenches_onboarding_completed", "skipped");
        localStorage.setItem("trenches_onboarding_skipped_at", new Date().toISOString());
        closeModal();
        addToast("Tutorial skipped. You can revisit tips anytime.", "info");
    };

    const completeTutorial = () => {
        localStorage.setItem("trenches_onboarding_completed", "true");
        localStorage.setItem("trenches_onboarding_completed_at", new Date().toISOString());
        closeModal();
        addToast("Welcome to the Trenches! 🎉", "success");
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") handleNext();
            if (e.key === "ArrowLeft" && !isFirstStep) handlePrev();
            if (e.key === "Escape") handleSkip();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [currentStep, isFirstStep, isLastStep]);

    return (
        <div className={styles.overlay} onClick={handleBackdropClick}>
            <div className={styles.modal}>
                {/* Progress Bar */}
                <div className={styles.progressBar}>
                    <div 
                        className={styles.progressFill} 
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Header */}
                <div className={styles.header}>
                    <span className={styles.stepIndicator}>
                        Step {currentStep + 1} of {TUTORIAL_STEPS.length}
                    </span>
                    {!isLastStep && (
                        <button className={styles.skipBtn} onClick={handleSkip}>
                            Skip
                        </button>
                    )}
                </div>

                {/* Content */}
                <div 
                    className={`${styles.content} ${isAnimating ? styles.animating : ""} ${styles[direction]}`}
                >
                    {/* Icon */}
                    <div className={styles.iconWrapper}>
                        <span className={styles.icon}>{step.icon}</span>
                    </div>

                    {/* Personalization on first step */}
                    {isFirstStep && (
                        <div className={styles.personalization}>
                            <span className={styles.username}>@{username}</span>
                        </div>
                    )}

                    {/* Title & Description */}
                    <h2 className={styles.title}>{step.title}</h2>
                    <p className={styles.description}>{step.description}</p>

                    {/* Features List */}
                    <ul className={styles.features}>
                        {step.features.map((feature, index) => (
                            <li key={index} className={styles.feature}>
                                <span className={styles.featureIcon}>◆</span>
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Navigation */}
                <div className={styles.navigation}>
                    <button
                        className={styles.navBtn}
                        onClick={handlePrev}
                        disabled={isFirstStep}
                    >
                        ← Back
                    </button>

                    {/* Step Dots */}
                    <div className={styles.stepDots}>
                        {TUTORIAL_STEPS.map((_, index) => (
                            <button
                                key={index}
                                className={`${styles.dot} ${index === currentStep ? styles.active : ""} ${index < currentStep ? styles.completed : ""}`}
                                onClick={() => setCurrentStep(index)}
                                aria-label={`Go to step ${index + 1}`}
                            />
                        ))}
                    </div>

                    <button
                        className={`${styles.navBtn} ${styles.primary}`}
                        onClick={handleNext}
                    >
                        {isLastStep ? "Start Exploring →" : "Next →"}
                    </button>
                </div>

                {/* Keyboard hint */}
                <p className={styles.keyboardHint}>
                    Use ← → arrow keys to navigate • ESC to skip
                </p>
            </div>
        </div>
    );
}
