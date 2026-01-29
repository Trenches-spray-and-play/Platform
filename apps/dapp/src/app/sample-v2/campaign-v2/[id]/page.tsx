"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Layout from "../../components/Layout";
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
  isActive: boolean;
  currentPrice?: string;
  endPrice?: string;
}

interface User {
  id: string;
  handle: string;
  balance: string;
}

export default function CampaignDetailPage() {
  const params = useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amount, setAmount] = useState("");
  const [useAutoBoost, setUseAutoBoost] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    fetchCampaign();
    fetchUser();
  }, [params.id]);

  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => setStatus(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/user");
      const data = await res.json();
      if (data.data) setUser(data.data);
    } catch (error) {
      console.error("Failed to fetch user:", error);
    }
  };

  const fetchCampaign = async () => {
    try {
      const res = await fetch("/api/trenches");
      const data = await res.json();
      
      if (data.data) {
        const allCampaigns = data.data.flatMap((g: any) => 
          g.campaigns.map((c: any) => ({ ...c, entryRange: g.entryRange }))
        );
        const found = allCampaigns.find((c: any) => c.id === params.id);
        setCampaign(found || null);
      }
    } catch (error) {
      console.error("Failed to fetch campaign:", error);
      setStatus({ message: 'FAILED_TO_LOAD_CAMPAIGN', type: 'error' });
    }
  };

  const getLevelFromTrenchIds = (ids: string[]) => {
    if (ids.includes("RAPID")) return "RAPID";
    if (ids.includes("MID")) return "MID";
    if (ids.includes("DEEP")) return "DEEP";
    return "RAPID";
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "RAPID": return styles.levelRapid;
      case "MID": return styles.levelMid;
      case "DEEP": return styles.levelDeep;
      default: return "";
    }
  };

  const handleSpraySubmit = async () => {
    const amountNum = parseFloat(amount);
    if (!campaign || isSubmitting || !amountNum || amountNum <= 0) return;
    
    setIsSubmitting(true);
    setStatus({ message: 'PROCESSING_ENTRY...', type: 'info' });
    
    try {
      const level = getLevelFromTrenchIds(campaign.trenchIds);
      
      // Step 1: Create spray entry
      const sprayRes = await fetch("/api/spray", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trenchId: campaign.id,
          amount: amountNum,
          level: level,
        }),
      });

      const sprayData = await sprayRes.json();

      if (!sprayRes.ok) {
        throw new Error(sprayData.error || "Failed to create spray entry");
      }

      // Step 2: Finalize the spray entry
      const finalizeRes = await fetch("/api/spray/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sprayEntryId: sprayData.data.sprayEntryId,
        }),
      });

      const finalizeData = await finalizeRes.json();

      if (!finalizeRes.ok) {
        if (finalizeData.remainingTasks) {
          setStatus({ message: `COMPLETE_${finalizeData.remainingTasks}_TASKS_FIRST`, type: 'error' });
          setTimeout(() => window.location.href = "/sample-v2/earn-v2", 1500);
          return;
        }
        throw new Error(finalizeData.error || "Failed to finalize entry");
      }

      // Step 3: Enable auto-boost if requested
      if (useAutoBoost && finalizeData.data?.participantId) {
        try {
          await fetch(`/api/user/positions/${finalizeData.data.participantId}/auto-boost`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ enabled: true }),
          });
        } catch (e) {
          console.error("Failed to enable auto-boost:", e);
        }
      }

      setStatus({ 
        message: `ENTRY_CONFIRMED_QUEUE_#${finalizeData.data.queuePosition}`, 
        type: 'success' 
      });
      setAmount("");
      fetchUser();
      
    } catch (error: any) {
      console.error("Spray error:", error);
      setStatus({ message: error.message?.toUpperCase()?.replace(/\s/g, '_') || 'ENTRY_FAILED', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const userBalance = parseFloat(user?.balance || "0");

  if (!campaign) {
    return (
      <Layout>
        <div className={styles.page}>
          <div className={styles.container}>
            <div className={styles.error}>
              <div className={styles.errorIcon}>◈</div>
              <h1>Campaign Not Found</h1>
              <p>The campaign you&apos;re looking for doesn&apos;t exist or has ended.</p>
              <Link href="/sample-v2" className={styles.backBtn}>
                Back to Campaigns
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const level = getLevelFromTrenchIds(campaign.trenchIds);
  const roi = parseFloat(campaign.roiMultiplier) || 1.5;
  const minEntry = level === "RAPID" ? 5 : level === "MID" ? 100 : 1000;
  const maxEntry = level === "RAPID" ? 1000 : level === "MID" ? 10000 : 100000;
  const waitTime = level === "RAPID" ? "1-3 days" : level === "MID" ? "7-14 days" : "30-60 days";
  const amountNum = parseFloat(amount) || 0;
  const isValidAmount = amountNum >= minEntry && amountNum <= maxEntry && amountNum <= userBalance;

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.container}>
          {/* Status Banner */}
          {status && (
            <div className={`${styles.statusBanner} ${styles[status.type]}`}>
              <span className={styles.statusIcon}>
                {status.type === 'success' ? '✓' : status.type === 'error' ? '✕' : '◈'}
              </span>
              {status.message}
            </div>
          )}

          {/* Breadcrumb */}
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/sample-v2">Campaigns</Link>
            <span>/</span>
            <span aria-current="page">{campaign.name}</span>
          </nav>

          {/* Campaign Header */}
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <div className={styles.badgeRow}>
                <span className={`${styles.levelBadge} ${getLevelColor(level)}`}>
                  {level} TRENCH
                </span>
                {campaign.isPaused ? (
                  <span className={styles.pausedBadge}>Paused</span>
                ) : campaign.phase === "LIVE" ? (
                  <span className={styles.liveBadge}>
                    <span className={styles.liveDot} />
                    Live
                  </span>
                ) : (
                  <span className={styles.waitlistBadge}>Waitlist</span>
                )}
              </div>
              <h1 className={styles.title}>{campaign.name}</h1>
              <div className={styles.tokenInfo}>
                <span className={styles.tokenSymbol}>${campaign.tokenSymbol}</span>
                <span className={styles.divider}>•</span>
                <span className={styles.chain}>{campaign.chainName}</span>
                <span className={styles.divider}>•</span>
                <code className={styles.contract}>
                  {campaign.tokenAddress.slice(0, 8)}...{campaign.tokenAddress.slice(-6)}
                </code>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className={styles.grid}>
            {/* Left Column - Info */}
            <div className={styles.infoColumn}>
              {/* Stats Cards */}
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>ROI Multiplier</span>
                  <span className={`${styles.statValue} ${styles.roiValue}`}>{roi.toFixed(1)}x</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Wait Time</span>
                  <span className={styles.statValue}>{waitTime}</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Reserves</span>
                  <span className={styles.statValue}>{campaign.reserveCachedBalance || "0"}</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Participants</span>
                  <span className={styles.statValue}>{campaign.participantCount || 0}</span>
                </div>
              </div>

              {/* About Section */}
              <div className={styles.section}>
                <h2>About This Campaign</h2>
                <p>
                  This is a {level.toLowerCase()} trench campaign with a {roi.toFixed(1)}x ROI multiplier. 
                  Deposit your tokens and wait for the payout cycle to complete. 
                  Complete tasks and raids to earn Boost Points that reduce your wait time.
                </p>
                <div className={styles.infoList}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoIcon}>✓</span>
                    <span>Time-locked deposits with guaranteed ROI</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoIcon}>✓</span>
                    <span>Boost Points reduce wait time</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoIcon}>✓</span>
                    <span>Fair queue system based on deposit time</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoIcon}>✓</span>
                    <span>Automatic payout when cycle completes</span>
                  </div>
                </div>
              </div>

              {/* Entry Requirements */}
              <div className={styles.section}>
                <h2>Entry Requirements</h2>
                <div className={styles.requirements}>
                  <div className={styles.requirement}>
                    <span className={styles.reqLabel}>Minimum Entry</span>
                    <span className={styles.reqValue}>${minEntry.toLocaleString()}</span>
                  </div>
                  <div className={styles.requirement}>
                    <span className={styles.reqLabel}>Maximum Entry</span>
                    <span className={styles.reqValue}>${maxEntry.toLocaleString()}</span>
                  </div>
                  <div className={styles.requirement}>
                    <span className={styles.reqLabel}>Token</span>
                    <span className={styles.reqValue}>${campaign.tokenSymbol}</span>
                  </div>
                  <div className={styles.requirement}>
                    <span className={styles.reqLabel}>Network</span>
                    <span className={styles.reqValue}>{campaign.chainName}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Entry Form */}
            <div className={styles.depositColumn}>
              <div className={styles.depositCard}>
                <h3>// ENTER_CAMPAIGN</h3>
                <p className={styles.entrySubtitle}>Deploy funds to secure position</p>

                {!user ? (
                  <div className={styles.authPrompt}>
                    <p className={styles.promptText}>AUTH_REQUIRED</p>
                    <p>Connect wallet to enter this campaign</p>
                    <Link href="/login" className={styles.connectBtn}>
                      CONNECT_WALLET
                    </Link>
                  </div>
                ) : userBalance < minEntry ? (
                  <div className={styles.depositPrompt}>
                    <p className={styles.promptText}>INSUFFICIENT_BALANCE</p>
                    <p>Your balance: <strong>${userBalance.toFixed(2)}</strong></p>
                    <p className={styles.minRequired}>Min required: ${minEntry.toLocaleString()}</p>
                    <Link href="/sample-v2/deposit" className={styles.depositLinkBtn}>
                      DEPOSIT_FUNDS
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className={styles.balanceDisplay}>
                      <span className={styles.balanceLabel}>AVAILABLE_BALANCE</span>
                      <strong className={styles.balanceAmount}>${userBalance.toFixed(2)} USDC</strong>
                    </div>
                    
                    {/* Amount Input */}
                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>ENTRY_AMOUNT (USDC)</label>
                      <div className={styles.inputWrapper}>
                        <span className={styles.currency}>$</span>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder={`${minEntry} - ${maxEntry}`}
                          min={minEntry}
                          max={maxEntry}
                          step="0.01"
                          className={styles.input}
                          disabled={isSubmitting || campaign.isPaused}
                        />
                      </div>
                      <div className={styles.inputMeta}>
                        <span>MIN: ${minEntry.toLocaleString()}</span>
                        <span>MAX: ${maxEntry.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Auto-Boost Toggle */}
                    <div className={styles.autoBoostSection}>
                      <label className={styles.toggleRow}>
                        <input
                          type="checkbox"
                          checked={useAutoBoost}
                          onChange={(e) => setUseAutoBoost(e.target.checked)}
                          disabled={isSubmitting}
                        />
                        <span className={styles.toggleSwitch} />
                        <span className={styles.toggleLabel}>
                          ENABLE_AUTO_BOOST
                          <small>Auto-reinvest profits on maturity</small>
                        </span>
                      </label>
                    </div>

                    {/* Projections */}
                    {amountNum > 0 && (
                      <div className={styles.projection}>
                        <div className={styles.projectionRow}>
                          <span>YOU_DEPLOY</span>
                          <span>${amountNum.toFixed(2)}</span>
                        </div>
                        <div className={styles.projectionRow}>
                          <span>ROI_MULTIPLIER</span>
                          <span>{roi.toFixed(1)}x</span>
                        </div>
                        <div className={styles.projectionDivider} />
                        <div className={`${styles.projectionRow} ${styles.total}`}>
                          <span>YOU_RECEIVE</span>
                          <span className={styles.projectedReturn}>${Math.floor(amountNum * roi).toLocaleString()}</span>
                        </div>
                      </div>
                    )}

                    <button
                      className={styles.enterBtn}
                      onClick={handleSpraySubmit}
                      disabled={!isValidAmount || campaign.isPaused || isSubmitting}
                    >
                      {isSubmitting ? "PROCESSING..." : campaign.isPaused ? "CAMPAIGN_PAUSED" : "CONFIRM_ENTRY"}
                    </button>

                    <div className={styles.entryNote}>
                      <span>⚡</span>
                      <span>Complete tasks to earn Boost Points and reduce wait time</span>
                    </div>
                  </>
                )}
              </div>

              {/* Quick Stats */}
              <div className={styles.quickStats}>
                <div className={styles.quickStat}>
                  <span>YOUR_POTENTIAL_ROI</span>
                  <strong>{roi.toFixed(1)}x</strong>
                </div>
                <div className={styles.quickStat}>
                  <span>ENTRY_RANGE</span>
                  <strong>${minEntry.toLocaleString()} - ${maxEntry.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
