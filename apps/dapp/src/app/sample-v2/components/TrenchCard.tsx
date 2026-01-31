"use client";

import { useState, useEffect, memo } from "react";
import Link from "next/link";
import styles from "./TrenchCard.module.css";

export interface FeaturedProject {
  id: string;
  name: string;
  symbol: string;
  logoUrl?: string;
  reserveContribution: string; // USD value they added
  percentageOfReserve: number;
}

export interface ReserveToken {
  symbol: string;
  amount: string;
  valueUsd: number;
  percentage: number;
}

interface TrenchCardProps {
  level: "RAPID" | "MID" | "DEEP";
  entryRange: { min: number; max: number };
  duration: string;
  totalReserveValue: number;
  participantCount: number;
  featuredProjects: FeaturedProject[];
  reserveComposition: ReserveToken[];
  avgApy: number;
  isActive?: boolean;
}

// Memoized to prevent unnecessary re-renders
function TrenchCard({
  level,
  entryRange,
  duration,
  totalReserveValue,
  participantCount,
  featuredProjects,
  reserveComposition,
  avgApy,
  isActive = true,
}: TrenchCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getLevelConfig = () => {
    switch (level) {
      case "RAPID":
        return {
          name: "Rapid Trench",
          tagline: "Quick rotations, fast yields",
          color: "#22c55e",
          gradient: "linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, transparent 50%)",
          icon: "⚡",
        };
      case "MID":
        return {
          name: "Mid Trench",
          tagline: "Balanced exposure, steady growth",
          color: "#a1a1aa",
          gradient: "linear-gradient(135deg, rgba(161, 161, 170, 0.1) 0%, transparent 50%)",
          icon: "◈",
        };
      case "DEEP":
        return {
          name: "Deep Trench",
          tagline: "Long-term plays, maximum rewards",
          color: "#fbbf24",
          gradient: "linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, transparent 50%)",
          icon: "▲",
        };
    }
  };

  const config = getLevelConfig();

  // Format large numbers
  const formatCurrency = (value: number) => {
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`;
    }
    if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  // Get primary featured project (highest reserve contribution)
  const primaryProject = featuredProjects[0];
  const hasMultipleProjects = featuredProjects.length > 1;

  return (
    <Link
      href={`/sample-v2/trench/${level.toLowerCase()}`}
      className={styles.card}
      style={{ background: config.gradient }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.levelBadge} style={{ color: config.color }}>
          <span className={styles.levelIcon}>{config.icon}</span>
          {level}
        </div>
        
        {/* Featured Project Badge */}
        {primaryProject && (
          <div className={styles.featuredBadge}>
            <span className={styles.featuredDot} style={{ background: config.color }} />
            Featured: {primaryProject.symbol}
          </div>
        )}
      </div>

      {/* Trench Name & Description */}
      <div className={styles.titleSection}>
        <h3 className={styles.name}>{config.name}</h3>
        <p className={styles.tagline}>{config.tagline}</p>
      </div>

      {/* Featured Projects Stack */}
      {featuredProjects.length > 0 && (
        <div className={styles.projectsSection}>
          <div className={styles.projectsHeader}>
            <span className={styles.projectsLabel}>Reserve Partners</span>
            {hasMultipleProjects && (
              <span className={styles.projectsCount}>+{featuredProjects.length - 1} more</span>
            )}
          </div>
          <div className={styles.projectTokens}>
            {featuredProjects.slice(0, 4).map((project, idx) => (
              <div
                key={project.id}
                className={styles.projectToken}
                style={{ 
                  zIndex: featuredProjects.length - idx,
                  marginLeft: idx > 0 ? -12 : 0 
                }}
                title={`${project.name}: ${formatCurrency(parseFloat(project.reserveContribution))} (${project.percentageOfReserve.toFixed(1)}%)`}
              >
                <span className={styles.tokenSymbol}>{project.symbol.slice(0, 3)}</span>
              </div>
            ))}
            {featuredProjects.length > 4 && (
              <div className={styles.projectTokenMore}>
                +{featuredProjects.length - 4}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reserve Bar - Visual representation of token mix */}
      {reserveComposition.length > 0 && (
        <div className={styles.reserveBarSection}>
          <div className={styles.reserveBar}>
            {reserveComposition.map((token, idx) => (
              <div
                key={token.symbol}
                className={styles.reserveSegment}
                style={{
                  width: `${token.percentage}%`,
                  background: getTokenColor(token.symbol, idx),
                }}
                title={`${token.symbol}: ${token.percentage.toFixed(1)}%`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Total Reserve</span>
          <span className={styles.statValue} style={{ color: config.color }}>
            {formatCurrency(totalReserveValue)}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Est. APY</span>
          <span className={`${styles.statValue} ${styles.apyValue}`}>
            +{avgApy.toFixed(1)}%
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Duration</span>
          <span className={styles.statValue}>{duration}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Entry</span>
          <span className={styles.statValue}>
            ${entryRange.min.toLocaleString()} - ${entryRange.max.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Participants & Activity */}
      <div className={styles.activitySection}>
        <div className={styles.participants}>
          <span className={styles.participantCount}>{participantCount.toLocaleString()}</span>
          <span className={styles.participantLabel}>sprayers active</span>
        </div>
        <div className={styles.pulseIndicator}>
          <span className={styles.pulseDot} style={{ background: config.color }} />
          <span className={styles.pulseText}>Accepting deposits</span>
        </div>
      </div>

      {/* CTA Footer */}
      <div className={styles.footer}>
        <span className={styles.reserveNote}>
          Paid in {reserveComposition.length > 1 ? 'token mix' : reserveComposition[0]?.symbol || 'featured tokens'}
        </span>
        <span className={styles.action} style={{ color: config.color }}>
          Spray Now
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={styles.arrow}>
            <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </div>
    </Link>
  );
}

// Helper to get consistent colors for tokens
function getTokenColor(symbol: string, index: number): string {
  const colors: Record<string, string> = {
    'USDC': '#2775CA',
    'USDT': '#26A17B',
    'ETH': '#627EEA',
    'WETH': '#627EEA',
    'BNB': '#F3BA2F',
    'SOL': '#14F195',
    'BLT': '#22c55e',
    'HYPE': '#00D4AA',
    'WBTC': '#F7931A',
    'DAI': '#F5AC37',
  };
  
  if (colors[symbol.toUpperCase()]) {
    return colors[symbol.toUpperCase()];
  }
  
  // Fallback colors based on index
  const fallbackColors = ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];
  return fallbackColors[index % fallbackColors.length];
}

export default memo(TrenchCard);
