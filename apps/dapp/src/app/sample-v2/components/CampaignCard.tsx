"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./CampaignCard.module.css";

export type CampaignPhase = "WAITLIST" | "ACCEPTING" | "LIVE" | "PAUSED";

interface CampaignCardProps {
  id: string;
  name: string;
  level: "RAPID" | "MID" | "DEEP";
  tokenSymbol: string;
  tokenAddress: string;
  chainName: string;
  reserves: string | null;
  roiMultiplier: string;
  entryRange: { min: number; max: number };
  phase?: CampaignPhase;
  startsAt?: string | null;
  isPaused?: boolean;
  participantCount?: number;
}

export default function CampaignCard({
  id,
  name,
  level,
  tokenSymbol,
  tokenAddress,
  chainName,
  reserves,
  roiMultiplier,
  entryRange,
  phase = "LIVE",
  startsAt,
  isPaused = false,
  participantCount = 0,
}: CampaignCardProps) {
  const [countdown, setCountdown] = useState<string>("");

  useEffect(() => {
    if (!startsAt) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const target = new Date(startsAt).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setCountdown("");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setCountdown(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setCountdown(`${hours}h ${mins}m`);
      } else {
        setCountdown(`${mins}m`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [startsAt]);

  const getLevelBadge = () => {
    switch (level) {
      case "RAPID":
        return <span className={`${styles.badge} ${styles.badgeRapid}`}>RAPID</span>;
      case "MID":
        return <span className={`${styles.badge} ${styles.badgeMid}`}>MID</span>;
      case "DEEP":
        return <span className={`${styles.badge} ${styles.badgeDeep}`}>DEEP</span>;
    }
  };

  const getPhaseBadge = () => {
    if (isPaused) return <span className={`${styles.phaseBadge} ${styles.phasePaused}`}>Paused</span>;
    if (countdown) return <span className={`${styles.phaseBadge} ${styles.phaseCountdown}`}>Starts in {countdown}</span>;
    if (phase === "LIVE" && participantCount > 0) {
      return (
        <span className={`${styles.phaseBadge} ${styles.phaseLive}`}>
          <span className={styles.liveDot} />
          {participantCount} Active
        </span>
      );
    }
    return <span className={`${styles.phaseBadge} ${styles.phaseLive}`}>
      <span className={styles.liveDot} />
      Live
    </span>;
  };

  const getActionText = () => {
    if (isPaused) return "Paused";
    if (phase === "WAITLIST") return "Join Waitlist";
    if (phase === "ACCEPTING") return "Secure Spot";
    return "Enter Campaign";
  };

  const roi = parseFloat(roiMultiplier) || 1.5;
  const reserveDisplay = reserves || "0";

  return (
    <Link href={`/sample-v2/campaign-v2/${id}`} className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.badgeRow}>
          {getLevelBadge()}
          {getPhaseBadge()}
        </div>
        <h3 className={styles.name}>{name}</h3>
        <div className={styles.tokenRow}>
          <span className={styles.tokenSymbol}>${tokenSymbol}</span>
          <span className={styles.divider}>•</span>
          <span className={styles.chainName}>{chainName}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>ROI Multiplier</span>
          <span className={`${styles.statValue} ${styles.roiValue}`}>{roi.toFixed(1)}x</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Entry Range</span>
          <span className={styles.statValue}>
            ${entryRange.min.toLocaleString()} - ${entryRange.max.toLocaleString()}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Reserves</span>
          <span className={styles.statValue}>{reserveDisplay}</span>
        </div>
      </div>

      {/* Progress Bar (visual indicator) */}
      <div className={styles.progressSection}>
        <div className={styles.progressBar}>
          <div 
            className={`${styles.progressFill} ${styles[`progress${level}`]}`}
            style={{ width: `${Math.min(65 + Math.random() * 20, 100)}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <span className={styles.contract}>
          {tokenAddress.slice(0, 6)}...{tokenAddress.slice(-4)}
        </span>
        <span className={`${styles.action} ${isPaused ? styles.actionDisabled : ""}`}>
          {getActionText()}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={styles.arrow}>
            <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </div>
    </Link>
  );
}
