"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Layout from "../components/Layout";
import styles from "./page.module.css";

interface Position {
  id: string;
  type: "active" | "secured" | "enlisted";
  trenchLevel: string;
  status: string;
  campaignName?: string;
  entryAmount?: number;
  maxPayout?: number;
  roiMultiplier?: number;
  remainingTime?: { days: number; hours: number; minutes: number; isReady: boolean };
  queueNumber?: number | null;
}

interface UserProfile {
  id: string;
  handle: string;
  referralCode?: string;
  beliefScore: number;
  boostPoints: number;
  balance?: string;
  stats?: { referrals: number };
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [positionsRes, profileRes] = await Promise.all([
        fetch("/api/user/positions"),
        fetch("/api/user"),
      ]);
      const positionsData = await positionsRes.json();
      const profileData = await profileRes.json();
      if (positionsData.data) setPositions(positionsData.data);
      if (profileData.data) setUser(profileData.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReferral = () => {
    if (!user?.referralCode) return;
    navigator.clipboard.writeText(`https://playtrenches.xyz/ref/${user.referralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activePositions = positions.filter((p) => p.status !== "paid");

  if (loading) {
    return (
      <Layout>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Loading your dashboard...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.container}>
          {/* Welcome Header */}
          <div className={styles.welcome}>
            <h1>Welcome back, {user?.handle || "Guest"}! 👋</h1>
            <p>Here&apos;s everything you need to know about your investments</p>
          </div>

          {/* Stats Cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>🏆</div>
              <div className={styles.statValue}>{user?.beliefScore || 0}</div>
              <div className={styles.statLabel}>Belief Score</div>
              <div className={styles.statHelp}>Your reputation points</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>⚡</div>
              <div className={`${styles.statValue} ${styles.boost}`}>+{user?.boostPoints || 0}</div>
              <div className={styles.statLabel}>Boost Points</div>
              <div className={styles.statHelp}>Reduces wait time</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>💵</div>
              <div className={styles.statValue}>${user?.balance || "0.00"}</div>
              <div className={styles.statLabel}>Your Balance</div>
              <div className={styles.statHelp}>Available to deposit</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>👥</div>
              <div className={styles.statValue}>{user?.stats?.referrals || 0}</div>
              <div className={styles.statLabel}>Referrals</div>
              <div className={styles.statHelp}>Friends you invited</div>
            </div>
          </div>

          {/* Referral Banner */}
          <div className={styles.referralBanner}>
            <div className={styles.referralContent}>
              <div className={styles.referralIcon}>🎁</div>
              <div>
                <h3>Invite Friends & Earn Together</h3>
                <p>Share your referral link and earn 10% of their Belief Points forever</p>
              </div>
            </div>
            <div className={styles.referralAction}>
              <code className={styles.referralCode}>playtrenches.xyz/ref/{user?.referralCode || "..."}</code>
              <button className={styles.copyBtn} onClick={handleCopyReferral}>
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </div>

          {/* Positions Section */}
          <div className={styles.positionsSection}>
            <div className={styles.sectionHeader}>
              <div>
                <h2>Your Active Positions</h2>
                <p>Campaigns you&apos;re currently invested in</p>
              </div>
              <Link href="/sample-light" className={styles.browseBtn}>
                Browse More Campaigns →
              </Link>
            </div>

            {activePositions.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📭</div>
                <h3>No Active Positions Yet</h3>
                <p>You haven&apos;t joined any campaigns. Start by browsing available campaigns below.</p>
                <Link href="/sample-light" className={styles.exploreBtn}>
                  Explore Campaigns
                </Link>
              </div>
            ) : (
              <div className={styles.positionsGrid}>
                {activePositions.map((pos) => {
                  const entry = pos.entryAmount || 0;
                  const exit = pos.maxPayout || Math.floor(entry * (pos.roiMultiplier || 1.5));
                  return (
                    <div key={pos.id} className={styles.positionCard}>
                      <div className={styles.positionHeader}>
                        <span className={`${styles.typeBadge} ${styles[pos.type]}`}>
                          {pos.type === "active" ? "Active" : pos.type === "secured" ? "Queued" : "Waitlisted"}
                        </span>
                        <span className={styles.levelBadge}>{pos.trenchLevel}</span>
                      </div>
                      <h3 className={styles.campaignName}>{pos.campaignName || "Campaign"}</h3>
                      
                      <div className={styles.amounts}>
                        <div className={styles.amount}>
                          <span className={styles.amountLabel}>You Invested</span>
                          <span className={styles.amountValue}>${entry.toLocaleString()}</span>
                        </div>
                        <div className={styles.arrow}>→</div>
                        <div className={styles.amount}>
                          <span className={styles.amountLabel}>You&apos;ll Receive</span>
                          <span className={`${styles.amountValue} ${styles.exit}`}>${exit.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className={styles.metrics}>
                        <div className={styles.metric}>
                          <span className={styles.metricLabel}>ROI</span>
                          <span className={styles.metricValue}>{pos.roiMultiplier?.toFixed(1) || "1.5"}x</span>
                        </div>
                        <div className={styles.metric}>
                          <span className={styles.metricLabel}>Time Left</span>
                          <span className={styles.metricValue}>
                            {pos.remainingTime?.isReady ? "Ready!" : pos.remainingTime ? `${pos.remainingTime.days}d ${pos.remainingTime.hours}h` : "--"}
                          </span>
                        </div>
                        {pos.queueNumber && (
                          <div className={styles.metric}>
                            <span className={styles.metricLabel}>Queue Position</span>
                            <span className={styles.metricValue}>#{pos.queueNumber}</span>
                          </div>
                        )}
                      </div>

                      <button className={styles.boostBtn}>⚡ Boost to Reduce Time</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
