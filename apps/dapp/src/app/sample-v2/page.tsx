"use client";

import { useState, useEffect } from "react";
import Layout from "./components/Layout";
import CampaignCard from "./components/CampaignCard";
import styles from "./page.module.css";

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

  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeParticipants: 0,
    totalVolume: "$0",
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
          totalVolume: "$2.4M+", // Would come from API in real app
        });
      }
    } catch (error) {
      console.error("Failed to fetch trenches:", error);
    }
  };

  return (
    <Layout>
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
              <span className={styles.statValue}>{stats.totalVolume}</span>
              <span className={styles.statLabel}>Total Volume</span>
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
                <button className={`${styles.filterTab} ${styles.active}`}>All</button>
                <button className={styles.filterTab}>Rapid</button>
                <button className={styles.filterTab}>Mid</button>
                <button className={styles.filterTab}>Deep</button>
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
                {trenchGroups.map((group) =>
                  group.campaigns.map((campaign, idx) => (
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
    </Layout>
  );
}
