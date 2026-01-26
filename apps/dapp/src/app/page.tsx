"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import CampaignCard from "@/components/CampaignCard";
import ActivityTicker from "@/components/ActivityTicker";

import Logo from "@/components/Logo";

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
  phase?: 'WAITLIST' | 'ACCEPTING' | 'LIVE' | 'PAUSED';
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

export default function Home() {
  const [trenchGroups, setTrenchGroups] = useState<TrenchGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrenches();
  }, []);

  const fetchTrenches = async () => {
    try {
      const res = await fetch('/api/trenches');
      const data = await res.json();
      if (data.data) {
        setTrenchGroups(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch trenches:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.container}>
      <header className={`${styles.header} animate-slide-up`}>
        <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
          <div className="desktop-hidden">
            <Logo variant="horizontal" />
          </div>
          <div className="status-indicator">ONLINE</div>
        </div>
        <h1 className="heading-l">SPRAY & PLAY</h1>
        <p className={styles.tagline}>COORDINATION PROTOCOL</p>
      </header>

      {loading ? (
        <div className={styles.loadingArea}>
          <div className="animate-pulse">SYNCHRONIZING POSITIONS...</div>
        </div>
      ) : trenchGroups.length === 0 ? (
        <div className={styles.emptyArea}>
          <p className="label-s">NO ACTIVE DEPLOYMENTS FOUND</p>
        </div>
      ) : (
        trenchGroups.map((group, idx) => (
          <section key={group.level} className={`${styles.trenchSection} animate-fade-in`} style={{ animationDelay: `${idx * 0.1}s` }}>
            <div className={styles.sectionHeaderWrap}>
              <div className={styles.headerIndicator} style={{
                background:
                  group.level === 'RAPID' ? 'var(--accent-rapid)' :
                    group.level === 'MID' ? 'var(--accent-mid)' : 'var(--accent-deep)'
              }} />
              <div className={styles.headerText}>
                <h2 className="heading-m">{group.level} TRENCH</h2>
              </div>
            </div>

            <div className={styles.campaignStack}>
              {group.campaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  id={campaign.id}
                  name={campaign.name}
                  level={group.level as 'RAPID' | 'MID' | 'DEEP'}
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
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  );
}


