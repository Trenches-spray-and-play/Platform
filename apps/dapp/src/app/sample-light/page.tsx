"use client";

import { useState, useEffect } from "react";
import CampaignCard from "./components/CampaignCard";
import { ComplianceDisclaimer } from "@trenches/ui";
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
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "RAPID" | "MID" | "DEEP">("ALL");

  useEffect(() => {
    fetchTrenches();
  }, []);

  const fetchTrenches = async () => {
    try {
      const res = await fetch("/api/trenches");
      const data = await res.json();
      if (data.data) setTrenchGroups(data.data);
    } catch (error) {
      console.error("Failed to fetch trenches:", error);
    } finally {
      setLoading(false);
    }
  };

  const allCampaigns = trenchGroups.flatMap((g) =>
    g.campaigns.map((c) => ({ ...c, level: g.level as "RAPID" | "MID" | "DEEP", entryRange: g.entryRange }))
  );

  const filteredCampaigns = activeFilter === "ALL"
    ? allCampaigns
    : allCampaigns.filter((c) => c.level === activeFilter);

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroBadge}>✨ Now Live on Mainnet</div>
          <h1 className={styles.heroTitle}>
            Grow Your Crypto
            <span className={styles.heroHighlight}>The Smart Way</span>
          </h1>
          <p className={styles.heroDescription}>
            Deposit into time-locked campaigns, earn boosted returns, and watch your investment grow.
            No complex strategies—just simple, transparent yields.
          </p>
          <div className={styles.heroActions}>
            <a href="#campaigns" className={styles.btnPrimary}>Browse Campaigns</a>
            <a href="#how-it-works" className={styles.btnSecondary}>How It Works</a>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.statsSection}>
        <div className={styles.container}>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>💰</div>
              <div className={styles.statValue}>$2.4M+</div>
              <div className={styles.statLabel}>Total Value Locked</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>👥</div>
              <div className={styles.statValue}>1,200+</div>
              <div className={styles.statLabel}>Active Users</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>📈</div>
              <div className={styles.statValue}>1.5x - 3x</div>
              <div className={styles.statLabel}>Average Returns</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>🛡️</div>
              <div className={styles.statValue}>100%</div>
              <div className={styles.statLabel}>Secure & Audited</div>
            </div>
          </div>
        </div>
      </section>

      {/* What is This Section */}
      <section className={styles.explainerSection}>
        <div className={styles.container}>
          <div className={styles.explainerGrid}>
            <div className={styles.explainerContent}>
              <h2>What is Trenches?</h2>
              <p>
                Trenches is a <strong>coordination protocol</strong> that helps crypto holders earn yields
                through time-locked deposits. Think of it as a digital savings account with boosted returns.
              </p>
              <ul className={styles.featureList}>
                <li>✅ <strong>No lock-in fees</strong> — Withdraw anytime after the lock period</li>
                <li>✅ <strong>Targeted settlement</strong> — Designed to deliver 1.5x rewards for active participants</li>
                <li>✅ <strong>Boost your speed</strong> — Complete tasks to reduce wait time</li>
                <li>✅ <strong>Full transparency</strong> — All transactions on-chain</li>
              </ul>
            </div>
            <div className={styles.explainerVisual}>
              <div className={styles.visualCard}>
                <div className={styles.visualHeader}>
                  <span>💡</span>
                  <span>How Returns Work</span>
                </div>
                <div className={styles.visualExample}>
                  <div className={styles.exampleRow}>
                    <span>You deposit</span>
                    <span className={styles.highlight}>$1,000</span>
                  </div>
                  <div className={styles.exampleArrow}>↓</div>
                  <div className={styles.exampleRow}>
                    <span>Wait period</span>
                    <span className={styles.highlight}>7 days</span>
                  </div>
                  <div className={styles.exampleArrow}>↓</div>
                  <div className={styles.exampleRow}>
                    <span>You receive</span>
                    <span className={`${styles.highlight} ${styles.green}`}>$1,500</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Campaigns Section */}
      <section id="campaigns" className={styles.campaignsSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Active Campaigns</h2>
              <p>Choose a campaign that matches your goals and investment timeline</p>
            </div>
            <div className={styles.filters}>
              {["ALL", "RAPID", "MID", "DEEP"].map((filter) => (
                <button
                  key={filter}
                  className={`${styles.filterBtn} ${activeFilter === filter ? styles.active : ""}`}
                  onClick={() => setActiveFilter(filter as any)}
                >
                  {filter === "ALL" ? "All" : filter.charAt(0) + filter.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <span>Loading campaigns...</span>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>🔍</span>
              <h3>No campaigns found</h3>
              <p>Try a different filter or check back later</p>
            </div>
          ) : (
            <div className={styles.campaignsGrid}>
              {filteredCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  id={campaign.id}
                  name={campaign.name}
                  level={campaign.level}
                  tokenSymbol={campaign.tokenSymbol}
                  chainName={campaign.chainName}
                  reserves={campaign.reserveCachedBalance}
                  roiMultiplier={campaign.roiMultiplier}
                  entryRange={campaign.entryRange}
                  phase={campaign.phase}
                  startsAt={campaign.startsAt}
                  isPaused={campaign.isPaused}
                  participantCount={campaign.participantCount}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className={styles.howItWorks}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>How It Works</h2>
            <p>Three simple steps to start earning</p>
          </div>
          <div className={styles.stepsGrid}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepIcon}>🎯</div>
              <h3>Choose a Campaign</h3>
              <p>Browse active campaigns and pick one that matches your timeline and goals.</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepIcon}>💸</div>
              <h3>Make a Deposit</h3>
              <p>Deposit your tokens. Your position is secured and the countdown begins.</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepIcon}>🚀</div>
              <h3>Earn & Withdraw</h3>
              <p>Wait for the lock period, then withdraw your deposit plus returns.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={styles.faqSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>Frequently Asked Questions</h2>
            <p>Got questions? We&apos;ve got answers.</p>
          </div>
          <div className={styles.faqGrid}>
            <div className={styles.faqItem}>
              <h4>🤔 What happens to my deposit?</h4>
              <p>Your deposit is held in a smart contract during the lock period. It&apos;s fully secure and you can withdraw it plus your returns when the time is up.</p>
            </div>
            <div className={styles.faqItem}>
              <h4>⚡ What are Boost Points?</h4>
              <p>Boost Points reduce your wait time. Complete tasks and raids to earn them—each point shaves time off your lock period.</p>
            </div>
            <div className={styles.faqItem}>
              <h4>🔒 Is my investment safe?</h4>
              <p>All funds are held in audited smart contracts. The protocol has been thoroughly tested and all transactions are transparent on-chain.</p>
            </div>
            <div className={styles.faqItem}>
              <h4>💰 How are returns calculated?</h4>
              <p>Returns are calculated as a multiple of your deposit. For example, a 1.5x multiplier means you&apos;ll receive 150% of your deposit back.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaCard}>
            <h2>Ready to start earning?</h2>
            <p>Join thousands of users already growing their crypto with Trenches.</p>
            <a href="#campaigns" className={styles.ctaBtn}>Browse Campaigns →</a>
          </div>
        </div>
      </section>

      {/* Compliance Disclaimer */}
      <section className={styles.container}>
        <ComplianceDisclaimer variant="footer" />
      </section>
    </div>
  );
}
