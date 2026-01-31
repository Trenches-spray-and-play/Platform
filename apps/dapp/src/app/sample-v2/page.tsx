"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import styles from "./page.module.css";

// Dynamic import TrenchCard
const TrenchCard = dynamic(
  () => import("./components/TrenchCard"),
  {
    loading: () => (
      <div className={styles.trenchSkeleton}>
        <div className={styles.skeletonHeader} />
        <div className={styles.skeletonStats} />
      </div>
    ),
    ssr: false,
  }
);

// Types for the new trench-centric model
interface FeaturedProject {
  id: string;
  name: string;
  symbol: string;
  logoUrl?: string;
  reserveContribution: string;
  percentageOfReserve: number;
}

interface ReserveToken {
  symbol: string;
  amount: string;
  valueUsd: number;
  percentage: number;
}

interface TrenchData {
  level: "RAPID" | "MID" | "DEEP";
  name: string;
  entryRange: { min: number; max: number };
  duration: string;
  totalReserveValue: number;
  participantCount: number;
  featuredProjects: FeaturedProject[];
  reserveComposition: ReserveToken[];
  avgApy: number;
}

// Mock data generator - replace with actual API when backend is ready
const generateMockTrenchData = (): TrenchData[] => [
  {
    level: "RAPID",
    name: "Rapid Trench",
    entryRange: { min: 5, max: 1000 },
    duration: "1 day",
    totalReserveValue: 2450000,
    participantCount: 3420,
    featuredProjects: [
      { id: "1", name: "Hyperliquid", symbol: "HYPE", reserveContribution: "1200000", percentageOfReserve: 48.9 },
      { id: "2", name: "Solana", symbol: "SOL", reserveContribution: "800000", percentageOfReserve: 32.6 },
      { id: "3", name: "Base Token", symbol: "BLT", reserveContribution: "450000", percentageOfReserve: 18.3 },
    ],
    reserveComposition: [
      { symbol: "HYPE", amount: "45000", valueUsd: 1200000, percentage: 48.9 },
      { symbol: "SOL", amount: "3800", valueUsd: 800000, percentage: 32.6 },
      { symbol: "BLT", amount: "280000", valueUsd: 450000, percentage: 18.3 },
    ],
    avgApy: 12.5,
  },
  {
    level: "MID",
    name: "Mid Trench",
    entryRange: { min: 100, max: 10000 },
    duration: "7 days",
    totalReserveValue: 8900000,
    participantCount: 2156,
    featuredProjects: [
      { id: "4", name: "Ethereum", symbol: "ETH", reserveContribution: "4500000", percentageOfReserve: 50.5 },
      { id: "5", name: "Arbitrum", symbol: "ARB", reserveContribution: "2800000", percentageOfReserve: 31.4 },
      { id: "6", name: "Optimism", symbol: "OP", reserveContribution: "1600000", percentageOfReserve: 18.0 },
    ],
    reserveComposition: [
      { symbol: "ETH", amount: "1200", valueUsd: 4500000, percentage: 50.5 },
      { symbol: "ARB", amount: "890000", valueUsd: 2800000, percentage: 31.4 },
      { symbol: "OP", amount: "620000", valueUsd: 1600000, percentage: 18.0 },
    ],
    avgApy: 18.3,
  },
  {
    level: "DEEP",
    name: "Deep Trench",
    entryRange: { min: 1000, max: 100000 },
    duration: "30 days",
    totalReserveValue: 24500000,
    participantCount: 892,
    featuredProjects: [
      { id: "7", name: "Bitcoin", symbol: "WBTC", reserveContribution: "15000000", percentageOfReserve: 61.2 },
      { id: "8", name: "Uniswap", symbol: "UNI", reserveContribution: "6000000", percentageOfReserve: 24.4 },
      { id: "9", name: "Aave", symbol: "AAVE", reserveContribution: "3500000", percentageOfReserve: 14.3 },
    ],
    reserveComposition: [
      { symbol: "WBTC", amount: "185", valueUsd: 15000000, percentage: 61.2 },
      { symbol: "UNI", amount: "340000", valueUsd: 6000000, percentage: 24.4 },
      { symbol: "AAVE", amount: "28000", valueUsd: 3500000, percentage: 14.3 },
    ],
    avgApy: 28.7,
  },
];

export default function HomePage() {
  const [trenches, setTrenches] = useState<TrenchData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [stats, setStats] = useState({
    totalReserveValue: 0,
    totalParticipants: 0,
    featuredProjects: 0,
    avgApy: 0,
  });

  useEffect(() => {
    fetchTrenches();
  }, []);

  const fetchTrenches = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API endpoint when backend is ready
      // const res = await fetch("/api/trenches/v2");
      // const data = await res.json();
      
      // Using mock data for now
      await new Promise(resolve => setTimeout(resolve, 800));
      const data = generateMockTrenchData();
      
      setTrenches(data);

      // Calculate aggregate stats
      const totalReserveValue = data.reduce((acc, t) => acc + t.totalReserveValue, 0);
      const totalParticipants = data.reduce((acc, t) => acc + t.participantCount, 0);
      const allProjects = data.flatMap(t => t.featuredProjects);
      const uniqueProjects = new Set(allProjects.map(p => p.id)).size;
      const avgApy = data.reduce((acc, t) => acc + t.avgApy, 0) / data.length;

      setStats({
        totalReserveValue,
        totalParticipants,
        featuredProjects: uniqueProjects,
        avgApy,
      });
    } catch (error) {
      console.error("Failed to fetch trenches:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span className={styles.heroDot} />
            Protocol v2.0 Live
          </div>
          <h1 className={styles.heroTitle}>
            Three Trenches.
            <span className={styles.heroHighlight}>Infinite Projects.</span>
          </h1>
          <p className={styles.heroDescription}>
            Projects add reserve. You spray capital. The trench buys their tokens, 
            driving price up. Earn yields from a growing reserve of featured projects.
          </p>
          <div className={styles.heroActions}>
            <a href="#trenches" className={styles.heroBtnPrimary}>
              Enter Trenches
            </a>
            <a
              href="https://docs.playtrenches.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.heroBtnSecondary}
            >
              How It Works
            </a>
          </div>
        </div>

        {/* Stats Bar */}
        <div className={styles.statsBar}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{formatCurrency(stats.totalReserveValue)}</span>
            <span className={styles.statLabel}>Total Reserve Value</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statValue}>{stats.totalParticipants.toLocaleString()}</span>
            <span className={styles.statLabel}>Active Sprayers</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statValue}>{stats.featuredProjects}</span>
            <span className={styles.statLabel}>Featured Projects</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statValue}>+{stats.avgApy.toFixed(1)}%</span>
            <span className={styles.statLabel}>Avg. APY</span>
          </div>
        </div>
      </section>

      {/* Trenches Section */}
      <section id="trenches" className={styles.trenches}>
        <div className={styles.container}>
          {/* Section Header */}
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <h2>The Three Trenches</h2>
              <p>Choose your strategy based on duration and entry size</p>
            </div>
          </div>

          {/* Trenches Grid - Always 3 cards */}
          {isLoading ? (
            <div className={styles.trenchesGrid}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={styles.trenchSkeleton}>
                  <div className={styles.skeletonHeader} />
                  <div className={styles.skeletonStats} />
                  <div className={styles.skeletonFooter} />
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.trenchesGrid}>
              {trenches.map((trench) => (
                <TrenchCard
                  key={trench.level}
                  level={trench.level}
                  entryRange={trench.entryRange}
                  duration={trench.duration}
                  totalReserveValue={trench.totalReserveValue}
                  participantCount={trench.participantCount}
                  featuredProjects={trench.featuredProjects}
                  reserveComposition={trench.reserveComposition}
                  avgApy={trench.avgApy}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section - Updated for new model */}
      <section className={styles.howItWorks}>
        <div className={styles.container}>
          <div className={styles.sectionTitleCenter}>
            <h2>How Trenches Work</h2>
            <p>A perpetual flywheel of value creation</p>
          </div>

          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>01</div>
              <div className={styles.stepIcon} style={{ color: '#22c55e' }}>🏗️</div>
              <h3>Projects Add Reserve</h3>
              <p>Projects deposit their tokens into a trench (Rapid, Mid, or Deep) to get featured and gain exposure.</p>
            </div>
            <div className={styles.stepArrow}>→</div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>02</div>
              <div className={styles.stepIcon} style={{ color: '#3b82f6' }}>💰</div>
              <h3>You Spray Capital</h3>
              <p>Deposit into any trench. Your funds are used to buy the featured projects' tokens from the market.</p>
            </div>
            <div className={styles.stepArrow}>→</div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>03</div>
              <div className={styles.stepIcon} style={{ color: '#f59e0b' }}>📈</div>
              <h3>Reserve Grows</h3>
              <p>Token prices rise due to buying pressure. The reserve value increases. You earn yields from the appreciating basket.</p>
            </div>
            <div className={styles.stepArrow}>→</div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>04</div>
              <div className={styles.stepIcon} style={{ color: '#8b5cf6' }}>♻️</div>
              <h3>Cycle Repeats</h3>
              <p>New projects join, more capital flows, reserve compounds. The trench keeps running forever.</p>
            </div>
          </div>

          {/* Reserve Mechanics Info */}
          <div className={styles.mechanicsCard}>
            <h3>Reserve Mechanics</h3>
            <div className={styles.mechanicsGrid}>
              <div className={styles.mechanicItem}>
                <span className={styles.mechanicIcon}>🎯</span>
                <div>
                  <h4>Dollar-Pegged Rewards</h4>
                  <p>Your rewards are calculated in USD value, then paid in the reserve token mix.</p>
                </div>
              </div>
              <div className={styles.mechanicItem}>
                <span className={styles.mechanicIcon}>🔄</span>
                <div>
                  <h4>Token Rotation</h4>
                  <p>As new projects join, the reserve composition shifts. Diversification happens naturally.</p>
                </div>
              </div>
              <div className={styles.mechanicItem}>
                <span className={styles.mechanicIcon}>🛡️</span>
                <div>
                  <h4>Price Protection</h4>
                  <p>Our buying creates constant demand floor for featured tokens, benefiting all participants.</p>
                </div>
              </div>
              <div className={styles.mechanicItem}>
                <span className={styles.mechanicIcon}>⚡</span>
                <div>
                  <h4>Instant Liquidity</h4>
                  <p>Exit anytime. Your position is liquid — we sell from reserve to pay you out.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects Marquee */}
      <section className={styles.featuredSection}>
        <div className={styles.container}>
          <div className={styles.sectionTitleCenter}>
            <h2>Currently Featured</h2>
            <p>Projects earning exposure through trenches right now</p>
          </div>
          
          <div className={styles.projectGrid}>
            {trenches.flatMap(t => t.featuredProjects).slice(0, 6).map((project, idx) => (
              <div key={project.id} className={styles.projectItem}>
                <div className={styles.projectTokenLarge}>{project.symbol.slice(0, 2)}</div>
                <div className={styles.projectInfo}>
                  <span className={styles.projectSymbol}>{project.symbol}</span>
                  <span className={styles.projectName}>{project.name}</span>
                </div>
                <span className={styles.projectReserve}>{formatCurrency(parseFloat(project.reserveContribution))}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2>Ready to Spray?</h2>
          <p>Join thousands of sprayers earning from the perpetual reserve.</p>
          <a href="#trenches" className={styles.ctaButton}>
            Choose Your Trench
          </a>
        </div>
      </section>
    </div>
  );
}
