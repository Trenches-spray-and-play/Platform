"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./CampaignCard.module.css";

interface CampaignCardProps {
  id: string;
  name: string;
  level: "RAPID" | "MID" | "DEEP";
  tokenSymbol: string;
  chainName: string;
  reserves: string | null;
  roiMultiplier: string;
  entryRange: { min: number; max: number };
  phase?: "WAITLIST" | "ACCEPTING" | "LIVE" | "PAUSED";
  startsAt?: string | null;
  isPaused?: boolean;
  participantCount?: number;
}

export default function CampaignCard({
  id,
  name,
  level,
  tokenSymbol,
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
    const update = () => {
      const diff = new Date(startsAt).getTime() - Date.now();
      if (diff <= 0) { setCountdown(""); return; }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      if (days > 0) setCountdown(`${days}d ${hours}h`);
      else setCountdown(`${hours}h`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [startsAt]);

  const getLevelInfo = () => {
    switch (level) {
      case "RAPID":
        return { label: "Quick Returns", color: styles.rapid, icon: "⚡", desc: "1-3 days" };
      case "MID":
        return { label: "Balanced", color: styles.mid, icon: "📊", desc: "7-14 days" };
      case "DEEP":
        return { label: "High Yield", color: styles.deep, icon: "🎯", desc: "30-60 days" };
    }
  };

  const levelInfo = getLevelInfo();
  const roi = parseFloat(roiMultiplier) || 1.5;

  return (
    <Link href={`/sample-light/campaign/${id}`} className={styles.card}>
      {/* Level Badge */}
      <div className={`${styles.levelBadge} ${levelInfo.color}`}>
        <span>{levelInfo.icon}</span>
        <span>{levelInfo.label}</span>
      </div>

      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.name}>{name}</h3>
        <div className={styles.tokenRow}>
          <span className={styles.token}>${tokenSymbol}</span>
          <span className={styles.dot}>•</span>
          <span className={styles.chain}>{chainName}</span>
        </div>
      </div>

      {/* Status */}
      <div className={styles.statusRow}>
        {isPaused ? (
          <span className={styles.statusPaused}>⏸️ Paused</span>
        ) : countdown ? (
          <span className={styles.statusCountdown}>⏰ Starts in {countdown}</span>
        ) : phase === "LIVE" ? (
          <span className={styles.statusLive}>🟢 {participantCount} participants</span>
        ) : (
          <span className={styles.statusLive}>🟢 Live</span>
        )}
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Return Multiplier</span>
          <span className={`${styles.statValue} ${styles.roi}`}>{roi.toFixed(1)}x</span>
          <span className={styles.statHelp}>Your investment multiplied</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Time to Payout</span>
          <span className={styles.statValue}>{levelInfo.desc}</span>
          <span className={styles.statHelp}>How long you&apos;ll wait</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Entry Range</span>
          <span className={styles.statValue}>
            ${entryRange.min.toLocaleString()} - ${entryRange.max.toLocaleString()}
          </span>
          <span className={styles.statHelp}>Minimum to maximum</span>
        </div>
      </div>

      {/* Action */}
      <div className={styles.action}>
        <span className={styles.actionText}>
          {isPaused ? "Campaign Paused" : countdown ? "Join Waitlist" : "View Details →"}
        </span>
      </div>
    </Link>
  );
}
