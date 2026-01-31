"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import styles from "./page.module.css";

// Types
interface ReserveToken {
  symbol: string;
  amount: string;
  valueUsd: number;
  percentage: number;
  color: string;
  priceChange24h: number;
}

interface FeaturedProject {
  id: string;
  name: string;
  symbol: string;
  logoUrl?: string;
  reserveContribution: string;
  percentageOfReserve: number;
  addedAt: string;
  priceAtAdd: number;
  currentPrice: number;
  status: "active" | "rotated" | "pending";
}

interface ReserveHistory {
  date: string;
  valueUsd: number;
}

interface UserPosition {
  deposited: number;
  currentValue: number;
  earned: number;
  entryDate: string;
  tokensReceived: { symbol: string; amount: string }[];
}

interface TrenchDetailData {
  level: "RAPID" | "MID" | "DEEP";
  name: string;
  description: string;
  entryRange: { min: number; max: number };
  duration: string;
  totalReserveValue: number;
  reserveValue24hAgo: number;
  participantCount: number;
  avgApy: number;
  reserveComposition: ReserveToken[];
  featuredProjects: FeaturedProject[];
  reserveHistory: ReserveHistory[];
  userPosition?: UserPosition;
  mechanics: {
    minLockPeriod: string;
    earlyExitFee: string;
    rewardDistribution: string;
    rotationFrequency: string;
  };
}

// Mock data generator
const generateMockTrenchDetail = (level: string): TrenchDetailData => {
  const baseData: Record<string, Partial<TrenchDetailData>> = {
    RAPID: {
      name: "Rapid Trench",
      description: "Fast-paced rotations with quick yields. Perfect for active traders who want liquidity and frequent opportunities.",
      entryRange: { min: 5, max: 1000 },
      duration: "1 day",
      totalReserveValue: 2450000,
      reserveValue24hAgo: 2380000,
      participantCount: 3420,
      avgApy: 12.5,
      mechanics: {
        minLockPeriod: "24 hours",
        earlyExitFee: "2%",
        rewardDistribution: "Daily",
        rotationFrequency: "Every 6 hours",
      },
    },
    MID: {
      name: "Mid Trench",
      description: "Balanced exposure with moderate lock periods. Ideal for steady growth and diversified token accumulation.",
      entryRange: { min: 100, max: 10000 },
      duration: "7 days",
      totalReserveValue: 8900000,
      reserveValue24hAgo: 8650000,
      participantCount: 2156,
      avgApy: 18.3,
      mechanics: {
        minLockPeriod: "7 days",
        earlyExitFee: "5%",
        rewardDistribution: "Weekly",
        rotationFrequency: "Daily",
      },
    },
    DEEP: {
      name: "Deep Trench",
      description: "Long-term plays with maximum rewards. For believers who want significant exposure and compounded returns.",
      entryRange: { min: 1000, max: 100000 },
      duration: "30 days",
      totalReserveValue: 24500000,
      reserveValue24hAgo: 23800000,
      participantCount: 892,
      avgApy: 28.7,
      mechanics: {
        minLockPeriod: "30 days",
        earlyExitFee: "10%",
        rewardDistribution: "Monthly",
        rotationFrequency: "Weekly",
      },
    },
  };

  const base = baseData[level] || baseData.RAPID;

  const tokenColors: Record<string, string> = {
    HYPE: "#00D4AA",
    SOL: "#14F195",
    BLT: "#22c55e",
    ETH: "#627EEA",
    ARB: "#28A0F0",
    OP: "#FF0420",
    WBTC: "#F7931A",
    UNI: "#FF007A",
    AAVE: "#B6509E",
  };

  const reserveComposition: ReserveToken[] = level === "RAPID" ? [
    { symbol: "HYPE", amount: "45000", valueUsd: 1200000, percentage: 48.9, color: tokenColors.HYPE, priceChange24h: 5.2 },
    { symbol: "SOL", amount: "3800", valueUsd: 800000, percentage: 32.6, color: tokenColors.SOL, priceChange24h: 3.1 },
    { symbol: "BLT", amount: "280000", valueUsd: 450000, percentage: 18.3, color: tokenColors.BLT, priceChange24h: -1.2 },
  ] : level === "MID" ? [
    { symbol: "ETH", amount: "1200", valueUsd: 4500000, percentage: 50.5, color: tokenColors.ETH, priceChange24h: 2.8 },
    { symbol: "ARB", amount: "890000", valueUsd: 2800000, percentage: 31.4, color: tokenColors.ARB, priceChange24h: 4.5 },
    { symbol: "OP", amount: "620000", valueUsd: 1600000, percentage: 18.0, color: tokenColors.OP, priceChange24h: -0.8 },
  ] : [
    { symbol: "WBTC", amount: "185", valueUsd: 15000000, percentage: 61.2, color: tokenColors.WBTC, priceChange24h: 1.5 },
    { symbol: "UNI", amount: "340000", valueUsd: 6000000, percentage: 24.4, color: tokenColors.UNI, priceChange24h: 6.2 },
    { symbol: "AAVE", amount: "28000", valueUsd: 3500000, percentage: 14.3, color: tokenColors.AAVE, priceChange24h: 3.8 },
  ];

  const featuredProjects: FeaturedProject[] = level === "RAPID" ? [
    { id: "1", name: "Hyperliquid", symbol: "HYPE", reserveContribution: "1200000", percentageOfReserve: 48.9, addedAt: "2026-01-28", priceAtAdd: 24.5, currentPrice: 26.8, status: "active" },
    { id: "2", name: "Solana", symbol: "SOL", reserveContribution: "800000", percentageOfReserve: 32.6, addedAt: "2026-01-29", priceAtAdd: 198.2, currentPrice: 210.5, status: "active" },
    { id: "3", name: "Base Token", symbol: "BLT", reserveContribution: "450000", percentageOfReserve: 18.3, addedAt: "2026-01-30", priceAtAdd: 1.52, currentPrice: 1.61, status: "active" },
    { id: "4", name: "Jupiter", symbol: "JUP", reserveContribution: "300000", percentageOfReserve: 0, addedAt: "2026-01-25", priceAtAdd: 0.85, currentPrice: 0.92, status: "rotated" },
  ] : level === "MID" ? [
    { id: "5", name: "Ethereum", symbol: "ETH", reserveContribution: "4500000", percentageOfReserve: 50.5, addedAt: "2026-01-20", priceAtAdd: 3450, currentPrice: 3750, status: "active" },
    { id: "6", name: "Arbitrum", symbol: "ARB", reserveContribution: "2800000", percentageOfReserve: 31.4, addedAt: "2026-01-22", priceAtAdd: 2.85, currentPrice: 3.15, status: "active" },
    { id: "7", name: "Optimism", symbol: "OP", reserveContribution: "1600000", percentageOfReserve: 18.0, addedAt: "2026-01-24", priceAtAdd: 2.45, currentPrice: 2.58, status: "active" },
  ] : [
    { id: "8", name: "Bitcoin", symbol: "WBTC", reserveContribution: "15000000", percentageOfReserve: 61.2, addedAt: "2026-01-01", priceAtAdd: 98500, currentPrice: 102000, status: "active" },
    { id: "9", name: "Uniswap", symbol: "UNI", reserveContribution: "6000000", percentageOfReserve: 24.4, addedAt: "2026-01-05", priceAtAdd: 12.5, currentPrice: 17.6, status: "active" },
    { id: "10", name: "Aave", symbol: "AAVE", reserveContribution: "3500000", percentageOfReserve: 14.3, addedAt: "2026-01-10", priceAtAdd: 245, currentPrice: 298, status: "active" },
  ];

  // Generate 30 days of history
  const reserveHistory: ReserveHistory[] = [];
  const days = 30;
  const baseValue = base.totalReserveValue! * 0.7;
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const growth = (days - i) / days;
    const randomVariance = 0.95 + Math.random() * 0.1;
    reserveHistory.push({
      date: date.toISOString().split("T")[0],
      valueUsd: Math.round(baseValue + (base.totalReserveValue! - baseValue) * growth * randomVariance),
    });
  }

  return {
    level: level as "RAPID" | "MID" | "DEEP",
    name: base.name!,
    description: base.description!,
    entryRange: base.entryRange!,
    duration: base.duration!,
    totalReserveValue: base.totalReserveValue!,
    reserveValue24hAgo: base.reserveValue24hAgo!,
    participantCount: base.participantCount!,
    avgApy: base.avgApy!,
    reserveComposition,
    featuredProjects,
    reserveHistory,
    mechanics: base.mechanics!,
    userPosition: {
      deposited: 5000,
      currentValue: 5475,
      earned: 475,
      entryDate: "2026-01-25",
      tokensReceived: [
        { symbol: "HYPE", amount: "8.5" },
        { symbol: "SOL", amount: "0.12" },
      ],
    },
  };
};

// Simple SVG Pie Chart Component
function PieChart({ data, size = 200 }: { data: ReserveToken[]; size?: number }) {
  const radius = size / 2;
  const center = size / 2;
  let currentAngle = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.map((token, i) => {
        const angle = (token.percentage / 100) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        currentAngle += angle;

        const startRad = (startAngle - 90) * (Math.PI / 180);
        const endRad = (endAngle - 90) * (Math.PI / 180);

        const x1 = center + radius * Math.cos(startRad);
        const y1 = center + radius * Math.sin(startRad);
        const x2 = center + radius * Math.cos(endRad);
        const y2 = center + radius * Math.sin(endRad);

        const largeArc = angle > 180 ? 1 : 0;

        return (
          <path
            key={token.symbol}
            d={`M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
            fill={token.color}
            stroke="var(--bg-primary)"
            strokeWidth="2"
          />
        );
      })}
      {/* Center hole for donut effect */}
      <circle cx={center} cy={center} r={radius * 0.5} fill="var(--bg-secondary)" />
    </svg>
  );
}

// Simple Line Chart for Reserve History
function LineChart({ data, width = 600, height = 200 }: { data: ReserveHistory[]; width?: number; height?: number }) {
  const padding = { top: 20, right: 20, bottom: 40, left: 80 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const minValue = Math.min(...data.map(d => d.valueUsd));
  const maxValue = Math.max(...data.map(d => d.valueUsd));
  const valueRange = maxValue - minValue;

  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - ((d.valueUsd - minValue) / valueRange) * chartHeight;
    return `${x},${y}`;
  }).join(" ");

  const formatValue = (v: number) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v}`;
  };

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={styles.lineChart}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(t => {
        const y = padding.top + chartHeight * t;
        return (
          <line key={t} x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="var(--border-primary)" strokeDasharray="4" />
        );
      })}

      {/* Y-axis labels */}
      {[0, 0.25, 0.5, 0.75, 1].map(t => {
        const y = padding.top + chartHeight * (1 - t);
        const value = minValue + valueRange * t;
        return (
          <text key={t} x={padding.left - 10} y={y + 4} textAnchor="end" fill="var(--text-tertiary)" fontSize="11">
            {formatValue(value)}
          </text>
        );
      })}

      {/* X-axis labels (first, middle, last) */}
      {[0, Math.floor(data.length / 2), data.length - 1].map(i => {
        const x = padding.left + (i / (data.length - 1)) * chartWidth;
        const date = new Date(data[i].date);
        return (
          <text key={i} x={x} y={height - 10} textAnchor="middle" fill="var(--text-tertiary)" fontSize="11">
            {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </text>
        );
      })}

      {/* Line */}
      <polyline points={points} fill="none" stroke="var(--accent-primary)" strokeWidth="2" />

      {/* Area under line */}
      <polygon
        points={`${padding.left},${padding.top + chartHeight} ${points} ${width - padding.right},${padding.top + chartHeight}`}
        fill="var(--accent-primary)"
        fillOpacity="0.1"
      />

      {/* Last value dot */}
      {(() => {
        const last = data[data.length - 1];
        const x = width - padding.right;
        const y = padding.top + chartHeight - ((last.valueUsd - minValue) / valueRange) * chartHeight;
        return <circle cx={x} cy={y} r="4" fill="var(--accent-primary)" />;
      })()}
    </svg>
  );
}

export default function TrenchDetailPage() {
  const params = useParams();
  const level = (params?.level as string)?.toUpperCase() as "RAPID" | "MID" | "DEEP";

  const [data, setData] = useState<TrenchDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "composition" | "projects" | "mechanics">("overview");

  useEffect(() => {
    if (!level) return;
    
    // Simulate API call
    setTimeout(() => {
      setData(generateMockTrenchDetail(level));
      setIsLoading(false);
    }, 800);
  }, [level]);

  const getLevelConfig = () => {
    switch (level) {
      case "RAPID":
        return {
          color: "#22c55e",
          gradient: "linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, transparent 50%)",
          icon: "⚡",
        };
      case "MID":
        return {
          color: "#a1a1aa",
          gradient: "linear-gradient(135deg, rgba(161, 161, 170, 0.15) 0%, transparent 50%)",
          icon: "◈",
        };
      case "DEEP":
        return {
          color: "#fbbf24",
          gradient: "linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, transparent 50%)",
          icon: "▲",
        };
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const config = getLevelConfig();

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading trench data...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>Trench not found</div>
        <Link href="/sample-v2" className={styles.backLink}>← Back to Trenches</Link>
      </div>
    );
  }

  const reserveGrowth = ((data.totalReserveValue - data.reserveValue24hAgo) / data.reserveValue24hAgo) * 100;

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header} style={{ background: config.gradient }}>
        <div className={styles.headerContent}>
          <Link href="/sample-v2" className={styles.backLink}>← Back to Trenches</Link>
          
          <div className={styles.titleSection}>
            <div className={styles.levelBadge} style={{ color: config.color }}>
              <span>{config.icon}</span>
              {level} TRENCH
            </div>
            <h1 className={styles.title}>{data.name}</h1>
            <p className={styles.description}>{data.description}</p>
          </div>

          {/* Quick Stats */}
          <div className={styles.quickStats}>
            <div className={styles.quickStat}>
              <span className={styles.quickStatValue} style={{ color: config.color }}>
                {formatCurrency(data.totalReserveValue)}
              </span>
              <span className={styles.quickStatLabel}>Total Reserve</span>
              <span className={`${styles.growthBadge} ${reserveGrowth >= 0 ? styles.positive : styles.negative}`}>
                {reserveGrowth >= 0 ? "+" : ""}{reserveGrowth.toFixed(2)}% (24h)
              </span>
            </div>
            <div className={styles.quickStatDivider} />
            <div className={styles.quickStat}>
              <span className={styles.quickStatValue}>+{data.avgApy}%</span>
              <span className={styles.quickStatLabel}>Avg. APY</span>
            </div>
            <div className={styles.quickStatDivider} />
            <div className={styles.quickStat}>
              <span className={styles.quickStatValue}>{data.participantCount.toLocaleString()}</span>
              <span className={styles.quickStatLabel}>Sprayers</span>
            </div>
            <div className={styles.quickStatDivider} />
            <div className={styles.quickStat}>
              <span className={styles.quickStatValue}>{data.duration}</span>
              <span className={styles.quickStatLabel}>Duration</span>
            </div>
          </div>
        </div>
      </header>

      {/* User Position Card (if exists) */}
      {data.userPosition && (
        <section className={styles.userPositionSection}>
          <div className={styles.container}>
            <div className={styles.userPositionCard}>
              <div className={styles.positionHeader}>
                <h3>Your Position</h3>
                <span className={styles.positionBadge}>Active</span>
              </div>
              <div className={styles.positionGrid}>
                <div className={styles.positionStat}>
                  <span className={styles.positionLabel}>Deposited</span>
                  <span className={styles.positionValue}>{formatCurrency(data.userPosition.deposited)}</span>
                </div>
                <div className={styles.positionStat}>
                  <span className={styles.positionLabel}>Current Value</span>
                  <span className={styles.positionValue} style={{ color: "var(--accent-primary)" }}>
                    {formatCurrency(data.userPosition.currentValue)}
                  </span>
                </div>
                <div className={styles.positionStat}>
                  <span className={styles.positionLabel}>Earned</span>
                  <span className={styles.positionValue} style={{ color: "var(--accent-primary)" }}>
                    +{formatCurrency(data.userPosition.earned)}
                  </span>
                </div>
                <div className={styles.positionStat}>
                  <span className={styles.positionLabel}>Entry Date</span>
                  <span className={styles.positionValue}>
                    {new Date(data.userPosition.entryDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className={styles.tokensReceived}>
                <span className={styles.tokensLabel}>Rewards received:</span>
                <div className={styles.tokensList}>
                  {data.userPosition.tokensReceived.map((token) => (
                    <span key={token.symbol} className={styles.tokenPill}>
                      {token.amount} {token.symbol}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Navigation Tabs */}
      <nav className={styles.tabsNav}>
        <div className={styles.container}>
          <div className={styles.tabs}>
            {(["overview", "composition", "projects", "mechanics"] as const).map((tab) => (
              <button
                key={tab}
                className={`${styles.tab} ${activeTab === tab ? styles.active : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Tab Content */}
      <main className={styles.main}>
        <div className={styles.container}>
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className={styles.overviewTab}>
              {/* Reserve Growth Chart */}
              <div className={styles.chartCard}>
                <h3>Reserve Value (30 Days)</h3>
                <LineChart data={data.reserveHistory} />
                <div className={styles.chartStats}>
                  <div className={styles.chartStat}>
                    <span className={styles.chartStatLabel}>Starting Value</span>
                    <span className={styles.chartStatValue}>{formatCurrency(data.reserveHistory[0].valueUsd)}</span>
                  </div>
                  <div className={styles.chartStat}>
                    <span className={styles.chartStatLabel}>Current Value</span>
                    <span className={styles.chartStatValue} style={{ color: config.color }}>
                      {formatCurrency(data.totalReserveValue)}
                    </span>
                  </div>
                  <div className={styles.chartStat}>
                    <span className={styles.chartStatLabel}>Growth</span>
                    <span className={styles.chartStatValue} style={{ color: "var(--accent-primary)" }}>
                      +{((data.totalReserveValue / data.reserveHistory[0].valueUsd - 1) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Entry CTA */}
              <div className={styles.entryCard}>
                <div className={styles.entryInfo}>
                  <h3>Ready to Spray?</h3>
                  <p>Entry range: <strong>${data.entryRange.min.toLocaleString()} - ${data.entryRange.max.toLocaleString()}</strong></p>
                  <p className={styles.entrySubtext}>Your deposit buys featured tokens and grows the reserve.</p>
                </div>
                <button className={styles.sprayButton} style={{ background: config.color }}>
                  Spray into {data.name}
                </button>
              </div>
            </div>
          )}

          {/* COMPOSITION TAB */}
          {activeTab === "composition" && (
            <div className={styles.compositionTab}>
              <div className={styles.compositionGrid}>
                {/* Pie Chart */}
                <div className={styles.chartCard}>
                  <h3>Reserve Composition</h3>
                  <div className={styles.pieChartContainer}>
                    <PieChart data={data.reserveComposition} />
                  </div>
                </div>

                {/* Token List */}
                <div className={styles.tokenListCard}>
                  <h3>Token Breakdown</h3>
                  <div className={styles.tokenList}>
                    {data.reserveComposition.map((token) => (
                      <div key={token.symbol} className={styles.tokenRow}>
                        <div className={styles.tokenInfo}>
                          <div className={styles.tokenColor} style={{ background: token.color }} />
                          <span className={styles.tokenSymbol}>{token.symbol}</span>
                        </div>
                        <div className={styles.tokenDetails}>
                          <span className={styles.tokenPercentage}>{token.percentage.toFixed(1)}%</span>
                          <span className={styles.tokenValue}>{formatCurrency(token.valueUsd)}</span>
                          <span className={`${styles.tokenChange} ${token.priceChange24h >= 0 ? styles.positive : styles.negative}`}>
                            {token.priceChange24h >= 0 ? "+" : ""}{token.priceChange24h.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PROJECTS TAB */}
          {activeTab === "projects" && (
            <div className={styles.projectsTab}>
              <div className={styles.projectsHeader}>
                <h3>Featured Projects</h3>
                <p>Projects currently contributing to this trench&apos;s reserve</p>
              </div>
              <div className={styles.projectsGrid}>
                {data.featuredProjects.filter(p => p.status === "active").map((project) => (
                  <div key={project.id} className={styles.projectCard}>
                    <div className={styles.projectHeader}>
                      <div className={styles.projectTokenLarge} style={{ background: config.color }}>
                        {project.symbol.slice(0, 2)}
                      </div>
                      <div className={styles.projectMeta}>
                        <h4>{project.name}</h4>
                        <span className={styles.projectSymbol}>{project.symbol}</span>
                      </div>
                      <span className={styles.projectShare}>{project.percentageOfReserve.toFixed(1)}%</span>
                    </div>
                    <div className={styles.projectStats}>
                      <div className={styles.projectStat}>
                        <span className={styles.projectStatLabel}>Reserve Contribution</span>
                        <span className={styles.projectStatValue}>{formatCurrency(parseFloat(project.reserveContribution))}</span>
                      </div>
                      <div className={styles.projectStat}>
                        <span className={styles.projectStatLabel}>Price Performance</span>
                        <span className={`${styles.projectStatValue} ${project.currentPrice > project.priceAtAdd ? styles.positive : styles.negative}`}>
                          {((project.currentPrice / project.priceAtAdd - 1) * 100) >= 0 ? "+" : ""}
                          {((project.currentPrice / project.priceAtAdd - 1) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className={styles.projectStat}>
                        <span className={styles.projectStatLabel}>Added</span>
                        <span className={styles.projectStatValue}>
                          {new Date(project.addedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rotation History */}
              {data.featuredProjects.some(p => p.status === "rotated") && (
                <div className={styles.rotationHistory}>
                  <h4>Recently Rotated</h4>
                  <div className={styles.rotationList}>
                    {data.featuredProjects.filter(p => p.status === "rotated").map((project) => (
                      <div key={project.id} className={styles.rotationItem}>
                        <span className={styles.rotationSymbol}>{project.symbol}</span>
                        <span className={styles.rotationName}>{project.name}</span>
                        <span className={styles.rotationDate}>Added {new Date(project.addedAt).toLocaleDateString()}</span>
                        <span className={`${styles.rotationPerformance} ${project.currentPrice > project.priceAtAdd ? styles.positive : styles.negative}`}>
                          {((project.currentPrice / project.priceAtAdd - 1) * 100) >= 0 ? "+" : ""}
                          {((project.currentPrice / project.priceAtAdd - 1) * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MECHANICS TAB */}
          {activeTab === "mechanics" && (
            <div className={styles.mechanicsTab}>
              <div className={styles.mechanicsGrid}>
                <div className={styles.mechanicCard}>
                  <div className={styles.mechanicIcon}>🔒</div>
                  <h4>Lock Period</h4>
                  <p className={styles.mechanicValue}>{data.mechanics.minLockPeriod}</p>
                  <p className={styles.mechanicDesc}>Minimum time before you can exit without penalty</p>
                </div>
                <div className={styles.mechanicCard}>
                  <div className={styles.mechanicIcon}>💸</div>
                  <h4>Early Exit Fee</h4>
                  <p className={styles.mechanicValue}>{data.mechanics.earlyExitFee}</p>
                  <p className={styles.mechanicDesc}>Fee applied if you exit before the lock period ends</p>
                </div>
                <div className={styles.mechanicCard}>
                  <div className={styles.mechanicIcon}>🎁</div>
                  <h4>Rewards</h4>
                  <p className={styles.mechanicValue}>{data.mechanics.rewardDistribution}</p>
                  <p className={styles.mechanicDesc}>How often rewards are distributed to participants</p>
                </div>
                <div className={styles.mechanicCard}>
                  <div className={styles.mechanicIcon}>🔄</div>
                  <h4>Rotation</h4>
                  <p className={styles.mechanicValue}>{data.mechanics.rotationFrequency}</p>
                  <p className={styles.mechanicDesc}>How often new projects can join the reserve</p>
                </div>
              </div>

              {/* How It Works for This Trench */}
              <div className={styles.howItWorksCard}>
                <h3>How {data.name} Works</h3>
                <div className={styles.stepsList}>
                  <div className={styles.stepItem}>
                    <div className={styles.stepNumber}>1</div>
                    <div className={styles.stepContent}>
                      <h5>You Spray Capital</h5>
                      <p>Deposit between ${data.entryRange.min.toLocaleString()} and ${data.entryRange.max.toLocaleString()}. Your funds are locked for {data.mechanics.minLockPeriod}.</p>
                    </div>
                  </div>
                  <div className={styles.stepItem}>
                    <div className={styles.stepNumber}>2</div>
                    <div className={styles.stepContent}>
                      <h5>Platform Buys Tokens</h5>
                      <p>Your deposit is used to buy the featured projects&apos; tokens from the open market, creating buying pressure.</p>
                    </div>
                  </div>
                  <div className={styles.stepItem}>
                    <div className={styles.stepNumber}>3</div>
                    <div className={styles.stepContent}>
                      <h5>Reserve Appreciates</h5>
                      <p>As token prices rise due to buying pressure, the total reserve value increases. Your position grows.</p>
                    </div>
                  </div>
                  <div className={styles.stepItem}>
                    <div className={styles.stepNumber}>4</div>
                    <div className={styles.stepContent}>
                      <h5>Claim Rewards</h5>
                      <p>Rewards are distributed {data.mechanics.rewardDistribution.toLowerCase()} in the reserve token mix or dollar-pegged equivalent.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
