"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./FirstSprayTour.module.css";

interface TourStep {
  id: string;
  title: string;
  content: string;
  target?: string;
  action?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Your First Spray",
    content: "We'll guide you through depositing into a trench. It's simple and takes less than a minute.",
    action: "Get Started",
  },
  {
    id: "select-trench",
    title: "Choose Your Trench",
    content: "Select from Rapid (1 day), Mid (7 days), or Deep (30 days). Each has different entry ranges and yields.",
    target: "[data-tour='trench-select']",
    action: "Next",
  },
  {
    id: "enter-amount",
    title: "Enter Amount",
    content: "Choose how much to deposit. Your funds will buy featured tokens and be locked for the trench duration.",
    target: "[data-tour='amount-input']",
    action: "Next",
  },
  {
    id: "review",
    title: "Review Your Spray",
    content: "Double-check the details. You'll see your expected return and the featured projects you'll be supporting.",
    target: "[data-tour='review-section']",
    action: "Confirm",
  },
  {
    id: "success",
    title: "You're In! 🎉",
    content: "Your spray is complete. Track your position in the dashboard and watch your earnings grow.",
    action: "Go to Dashboard",
  },
];

const STORAGE_KEY = "trenches_first_spray_completed";
const TOUR_ACTIVE_KEY = "trenches_first_spray_tour_active";

interface FirstSprayTourProps {
  isOpen: boolean;
  onClose: () => void;
  onStepChange?: (step: number) => void;
}

export default function FirstSprayTour({ isOpen, onClose, onStepChange }: FirstSprayTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      localStorage.setItem(TOUR_ACTIVE_KEY, "true");
      setTimeout(() => setIsVisible(true), 100);
    } else {
      setIsVisible(false);
      localStorage.removeItem(TOUR_ACTIVE_KEY);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const step = TOUR_STEPS[currentStep];
    onStepChange?.(currentStep);

    if (step.target) {
      // Wait for modal/render to complete
      setTimeout(() => {
        const target = document.querySelector(step.target!);
        if (target) {
          const rect = target.getBoundingClientRect();
          setTargetRect(rect);
          target.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 300);
    } else {
      setTargetRect(null);
    }
  }, [isOpen, currentStep, onStepChange]);

  const handleNext = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsVisible(true);
      }, 200);
    } else {
      completeTour();
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    completeTour();
  }, []);

  const completeTour = () => {
    setIsVisible(false);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, "true");
      localStorage.removeItem(TOUR_ACTIVE_KEY);
      onClose();
    }, 200);
  };

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const isWelcome = currentStep === 0;
  const isSuccess = currentStep === TOUR_STEPS.length - 1;

  return (
    <div className={`${styles.overlay} ${isVisible ? styles.visible : ""}`}>
      {/* Dark backdrop with optional spotlight */}
      <div className={styles.backdrop} onClick={handleSkip}>
        {targetRect && !isWelcome && !isSuccess && (
          <div
            className={styles.spotlight}
            style={{
              top: targetRect.top - 12,
              left: targetRect.left - 12,
              width: targetRect.width + 24,
              height: targetRect.height + 24,
            }}
          />
        )}
      </div>

      {/* Tour card */}
      <div
        className={`${styles.card} ${isVisible ? styles.visible : ""} ${isWelcome ? styles.welcome : ""} ${isSuccess ? styles.success : ""}`}
        style={
          targetRect && !isWelcome && !isSuccess
            ? {
                position: "fixed",
                top: targetRect.bottom + 20,
                left: Math.min(
                  Math.max(targetRect.left + targetRect.width / 2 - 175, 16),
                  window.innerWidth - 366
                ),
              }
            : {}
        }
      >
        {/* Progress dots */}
        <div className={styles.progress}>
          {TOUR_STEPS.map((_, idx) => (
            <span
              key={idx}
              className={`${styles.progressDot} ${idx === currentStep ? styles.active : ""} ${idx < currentStep ? styles.completed : ""}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className={styles.content}>
          {isSuccess && (
            <div className={styles.successIcon}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="24" fill="rgba(34, 197, 94, 0.2)" />
                <path
                  d="M16 24L21 29L32 18"
                  stroke="#22c55e"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
          
          <h2 className={styles.title}>{step.title}</h2>
          <p className={styles.description}>{step.content}</p>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          {!isSuccess && (
            <button className={styles.skipBtn} onClick={handleSkip}>
              Skip tour
            </button>
          )}
          <button className={styles.nextBtn} onClick={handleNext}>
            {step.action}
          </button>
        </div>

        {/* Pointer arrow (only when attached to element) */}
        {targetRect && !isWelcome && !isSuccess && (
          <div 
            className={styles.pointer}
            style={{
              top: -8,
              left: Math.min(
                Math.max(targetRect.left + targetRect.width / 2 - 8, 20),
                330
              ),
            }}
          />
        )}
      </div>

      {/* Helper text for interactive steps */}
      {targetRect && !isWelcome && !isSuccess && (
        <div className={`${styles.helper} ${isVisible ? styles.visible : ""}`}>
          Click the highlighted area to continue
        </div>
      )}
    </div>
  );
}

// Hook to check if user needs the tour
export function useFirstSprayTour() {
  const [shouldShowTour, setShouldShowTour] = useState(false);

  useEffect(() => {
    const hasCompleted = localStorage.getItem(STORAGE_KEY);
    const isTourActive = localStorage.getItem(TOUR_ACTIVE_KEY);
    
    // Show tour if never completed AND not currently in a tour
    setShouldShowTour(!hasCompleted && !isTourActive);
  }, []);

  const markTourCompleted = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    setShouldShowTour(false);
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setShouldShowTour(true);
  }, []);

  return { shouldShowTour, markTourCompleted, resetTour };
}
