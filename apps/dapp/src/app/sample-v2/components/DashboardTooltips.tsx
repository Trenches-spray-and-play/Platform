"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./DashboardTooltips.module.css";

interface TooltipStep {
  id: string;
  target: string;
  title: string;
  content: string;
  position: "top" | "bottom" | "left" | "right";
}

const TOOLTIP_STEPS: TooltipStep[] = [
  {
    id: "balance",
    target: "[data-tooltip='balance']",
    title: "Platform Balance",
    content: "This shows your available funds that aren't currently invested. Use this to spray into trenches or withdraw to your wallet.",
    position: "bottom",
  },
  {
    id: "spray",
    target: "[data-tooltip='spray-btn']",
    title: "Spray Button",
    content: "Click here to deposit into a trench. Your funds will buy featured tokens and start earning yields.",
    position: "bottom",
  },
  {
    id: "belief",
    target: "[data-tooltip='belief-score']",
    title: "Belief Score",
    content: "Your reputation score in the trenches. Higher scores unlock better positions, higher entry limits, and exclusive campaigns. Earn points by participating consistently.",
    position: "right",
  },
  {
    id: "boost",
    target: "[data-tooltip='boost-points']",
    title: "Boost Points",
    content: "Use these to skip queue positions or auto-boost your returns. Earn BP by completing tasks, referring friends, or holding positions longer.",
    position: "right",
  },
  {
    id: "positions",
    target: "[data-tooltip='positions']",
    title: "Your Positions",
    content: "Track all your active investments here. See your entry amount, expected return, time remaining, and enable auto-boost for hands-off earning.",
    position: "top",
  },
];

const STORAGE_KEY = "trenches_dashboard_tooltips_completed";

export default function DashboardTooltips() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Check if tooltips should show (first visit only)
  useEffect(() => {
    const hasCompleted = localStorage.getItem(STORAGE_KEY);
    if (!hasCompleted) {
      // Small delay to let dashboard render
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Update target position when step changes
  useEffect(() => {
    if (!isActive) return;

    const step = TOOLTIP_STEPS[currentStep];
    const target = document.querySelector(step.target);

    if (target) {
      const rect = target.getBoundingClientRect();
      setTargetRect(rect);
      
      // Scroll target into view if needed
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      
      // Fade in
      setTimeout(() => setIsVisible(true), 100);
    }
  }, [isActive, currentStep]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!isActive) return;
      const step = TOOLTIP_STEPS[currentStep];
      const target = document.querySelector(step.target);
      if (target) {
        setTargetRect(target.getBoundingClientRect());
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isActive, currentStep]);

  const handleNext = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      if (currentStep < TOOLTIP_STEPS.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        completeTooltips();
      }
    }, 200);
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    completeTooltips();
  }, []);

  const completeTooltips = () => {
    setIsVisible(false);
    setTimeout(() => {
      setIsActive(false);
      localStorage.setItem(STORAGE_KEY, "true");
    }, 200);
  };

  if (!isActive || !targetRect) return null;

  const step = TOOLTIP_STEPS[currentStep];
  const progress = ((currentStep + 1) / TOOLTIP_STEPS.length) * 100;

  // Calculate tooltip position
  const getTooltipPosition = () => {
    const tooltipWidth = 320;
    const tooltipHeight = 180;
    const offset = 16;

    let top = 0;
    let left = 0;

    switch (step.position) {
      case "bottom":
        top = targetRect.bottom + offset;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case "top":
        top = targetRect.top - tooltipHeight - offset;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case "left":
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.left - tooltipWidth - offset;
        break;
      case "right":
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.right + offset;
        break;
    }

    // Keep within viewport
    const padding = 16;
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));

    return { top, left };
  };

  const position = getTooltipPosition();

  return (
    <>
      {/* Backdrop with spotlight */}
      <div 
        className={`${styles.backdrop} ${isVisible ? styles.visible : ""}`}
        onClick={handleSkip}
      >
        <div 
          className={styles.spotlight}
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      </div>

      {/* Tooltip */}
      <div
        className={`${styles.tooltip} ${isVisible ? styles.visible : ""}`}
        style={{
          top: position.top,
          left: position.left,
        }}
      >
        {/* Progress bar */}
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className={styles.header}>
          <span className={styles.stepCounter}>
            {currentStep + 1} / {TOOLTIP_STEPS.length}
          </span>
          <button className={styles.skipBtn} onClick={handleSkip}>
            Skip tour
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          <h3 className={styles.title}>{step.title}</h3>
          <p className={styles.description}>{step.content}</p>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.dots}>
            {TOOLTIP_STEPS.map((_, idx) => (
              <span
                key={idx}
                className={`${styles.dot} ${idx === currentStep ? styles.active : ""}`}
              />
            ))}
          </div>
          <button className={styles.nextBtn} onClick={handleNext}>
            {currentStep === TOOLTIP_STEPS.length - 1 ? "Finish" : "Next"}
          </button>
        </div>

        {/* Arrow pointer */}
        <div 
          className={`${styles.arrow} ${styles[step.position]}`}
          style={{
            ...(step.position === "bottom" && {
              top: -8,
              left: "50%",
              transform: "translateX(-50%)",
            }),
            ...(step.position === "top" && {
              bottom: -8,
              left: "50%",
              transform: "translateX(-50%) rotate(180deg)",
            }),
            ...(step.position === "left" && {
              right: -8,
              top: "50%",
              transform: "translateY(-50%) rotate(90deg)",
            }),
            ...(step.position === "right" && {
              left: -8,
              top: "50%",
              transform: "translateY(-50%) rotate(-90deg)",
            }),
          }}
        />
      </div>
    </>
  );
}
