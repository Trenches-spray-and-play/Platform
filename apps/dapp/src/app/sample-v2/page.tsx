"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import styles from "./page.module.css";

// Dynamic import with loading state for below-fold content
// This reduces initial bundle size and improves TTI (Time to Interactive)
const CampaignCard = dynamic(
  () => import("./components/CampaignCard"),
  {
    loading: () => (
      <div className={styles.cardSkeleton}>
        <div className={styles.skeletonHeader} />
        <div className={styles.skeletonStats} />
      </div>
    ),
    ssr: false, // Campaign cards are interactive, no need for SSR
  }
);

interface Campaign {
  id: string;
  name: string;
  tokenSymbol: string;
  tokenAddress: string;
  tokenDecimals: number;
  chainId: number;
  chainName: string;
  roiMultiplier: string;
  reserveCachedBalance: string | null;
  trenchIds: string[];
  phase?: "WAITLIST" | "ACCEPTING" | "LIVE" | "PAUSED";
  startsAt?: string | null;
  isPaused?: boolean;
  participantCount?: number;
}

interface TrenchGroup {
  level: string;
  name: string;
  entryRange: { min: number; max: number };
  cadence: string;
  campaigns: Campaign[];
}

export default function HomePage() {
  const [trenchGroups, setTrenchGroups] = useState<TrenchGroup[]>([]);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "RAPID" | "MID" | "DEEP">("ALL");

  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeParticipants: 0,
    totalTrenchGroups: 0,
  });

  useEffect(() => {
    fetchTrenches();
  }, []);

  const fetchTrenches = async () => {
    try {
      const res = await fetch("/api/trenches");
      const data = await res.json();
      if (data.data) {
        setTrenchGroups(data.data);

        // Calculate stats
        const totalCampaigns = data.data.reduce(
          (acc: number, group: TrenchGroup) => acc + group.campaigns.length,
          0
        );
        const activeParticipants = data.data.reduce(
          (acc: number, group: TrenchGroup) =>
            acc + group.campaigns.reduce((sum, c) => sum + (c.participantCount || 0), 0),
          0
        );

        setStats({
          totalCampaigns,
          activeParticipants,
          totalTrenchGroups: data.data.length,
        });
      }
    } catch (error) {
      console.error("Failed to fetch trenches:", error);
    }
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
            Spray & Play
            <span className={styles.heroHighlight}>Coordination Protocol</span>
          </h1>
          <p className={styles.heroDescription}>
            Deposit into time-locked campaigns. Earn boosted yields.
            The fairer way to coordinate liquidity.
          </p>
          <div className={styles.heroActions}>
            <a href="#campaigns" className={styles.heroBtnPrimary}>
              Explore Campaigns
            </a>
            <a
              href="https://docs.playtrenches.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.heroBtnSecondary}
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Stats Bar */}
        <div className={styles.statsBar}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{stats.totalCampaigns}</span>
            <span className={styles.statLabel}>Active Campaigns</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statValue}>{stats.activeParticipants}</span>
            <span className={styles.statLabel}>Active Participants</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statValue}>{stats.totalTrenchGroups}</span>
            <span className={styles.statLabel}>Trench Categories</span>
          </div>
        </div>
      </section>

      {/* Campaigns Section */}
      <section id="campaigns" className={styles.campaigns}>
        <div className={styles.container}>
          {/* Section Header */}
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <h2>Active Campaigns</h2>
              <p>Choose your deployment strategy</p>
            </div>

            {/* Filter Tabs */}
            <div className={styles.filterTabs}>
              {(["ALL", "RAPID", "MID", "DEEP"] as const).map((filter) => (
                <button
                  key={filter}
                  className={`${styles.filterTab} ${activeFilter === filter ? styles.active : ""}`}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter === "ALL" ? "All" : filter.charAt(0) + filter.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Campaigns Grid */}
          {trenchGroups.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>◈</div>
              <h3>No Active Campaigns</h3>
              <p>Check back soon for new opportunities</p>
            </div>
          ) : (
            <div className={styles.campaignsGrid}>
              {trenchGroups
                .filter((group) => activeFilter === "ALL" || group.level === activeFilter)
                .map((group) =>
                  group.campaigns.map((campaign) => (
                    <CampaignCard
                      key={campaign.id}
                      id={campaign.id}
                      name={campaign.name}
                      level={group.level as "RAPID" | "MID" | "DEEP"}
                      tokenSymbol={campaign.tokenSymbol}
                      tokenAddress={campaign.tokenAddress}
                      chainName={campaign.chainName}
                      reserves={campaign.reserveCachedBalance}
                      roiMultiplier={campaign.roiMultiplier}
                      entryRange={group.entryRange}
                      phase={campaign.phase}
                      startsAt={campaign.startsAt}
                      isPaused={campaign.isPaused}
                      participantCount={campaign.participantCount}
                    />
                  ))
                )}
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className={styles.howItWorks}>
        <div className={styles.container}>
          <div className={styles.sectionTitleCenter}>
            <h2>How It Works</h2>
            <p>Three simple steps to start earning</p>
          </div>

          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>01</div>
              <div className={styles.stepIcon}>◆</div>
              <h3>Choose Campaign</h3>
              <p>Browse active campaigns across Rapid, Mid, and Deep trenches based on your strategy.</p>
            </div>
            <div className={styles.stepArrow}>→</div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>02</div>
              <div className={styles.stepIcon}>□</div>
              <h3>Deposit Funds</h3>
              <p>Deposit your tokens into the campaign. Your position is secured and time-locked.</p>
            </div>
            <div className={styles.stepArrow}>→</div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>03</div>
              <div className={styles.stepIcon}>▲</div>
              <h3>Earn & Boost</h3>
              <p>Complete tasks and raids to earn Boost Points that reduce your wait time.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
