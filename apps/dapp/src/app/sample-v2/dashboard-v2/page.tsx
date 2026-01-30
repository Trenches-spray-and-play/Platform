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
  autoBoost?: boolean;
}

interface UserProfile {
  id: string;
  handle: string;
  referralCode?: string;
  beliefScore: number;
  boostPoints: number;
  balance: string;
  walletEvm?: string;
  walletSol?: string;
  stats?: { referrals: number };
}

// Status toast component
function StatusToast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`${styles.statusToast} ${styles[type]}`}>
      <span className={styles.statusIcon}>{type === 'success' ? '✓' : '✕'}</span>
      <span className={styles.statusMessage}>{message}</span>
      <button className={styles.statusClose} onClick={onClose}>×</button>
    </div>
  );
}

// Helper to format handle without double @
function formatHandle(handle: string | undefined): string {
  if (!handle) return "@user";
  return handle.startsWith("@") ? handle : `@${handle}`;
}

// Unauthenticated State
function UnauthenticatedDashboard() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Hero Section */}
        <div className={styles.unauthHero}>
          <div className={styles.unauthBadge}>
            <span className={styles.unauthDot} />
            Protocol v2.0
          </div>
          <h1 className={styles.unauthTitle}>
            Your Dashboard
            <span className={styles.unauthHighlight}>Awaits</span>
          </h1>
          <p className={styles.unauthSubtitle}>
            Connect your account to track your positions, manage wallets, and monitor your earnings.
          </p>
          <Link href="/login" className={styles.unauthCta}>
            Connect Account
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>

        {/* Features Grid */}
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>
              <span className={styles.featureIcon}>◆</span>
            </div>
            <h3>Track Positions</h3>
            <p>Monitor all your active campaign positions in real-time with live ROI updates.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>
              <span className={styles.featureIcon}>◈</span>
            </div>
            <h3>Manage Wallets</h3>
            <p>Securely configure your EVM and Solana withdrawal wallets for payouts.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>
              <span className={styles.featureIcon}>⚡</span>
            </div>
            <h3>Earn Boosts</h3>
            <p>Complete tasks to earn boost points and reduce your wait times.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>
              <span className={styles.featureIcon}>▲</span>
            </div>
            <h3>Refer & Earn</h3>
            <p>Invite friends and earn 10% of their Belief Points forever.</p>
          </div>
        </div>

        {/* Stats Preview */}
        <div className={styles.statsPreview}>
          <div className={styles.statsPreviewHeader}>
            <h2>Platform Stats</h2>
            <Link href="/sample-v2" className={styles.viewCampaignsLink}>
              View Campaigns →
            </Link>
          </div>
          <div className={styles.statsPreviewGrid}>
            <div className={styles.statsPreviewItem}>
              <span className={styles.statsPreviewValue}>$2.4M+</span>
              <span className={styles.statsPreviewLabel}>Total Volume</span>
            </div>
            <div className={styles.statsPreviewItem}>
              <span className={styles.statsPreviewValue}>1,240+</span>
              <span className={styles.statsPreviewLabel}>Active Users</span>
            </div>
            <div className={styles.statsPreviewItem}>
              <span className={styles.statsPreviewValue}>85+</span>
              <span className={styles.statsPreviewLabel}>Campaigns</span>
            </div>
            <div className={styles.statsPreviewItem}>
              <span className={styles.statsPreviewValue}>$450K</span>
              <span className={styles.statsPreviewLabel}>Rewards Paid</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Authenticated Dashboard
function AuthenticatedDashboard({ 
  user, 
  positions, 
  status, 
  setStatus,
  handleCopyReferral,
  copied,
  toggleAutoBoost,
  togglingBoost 
}: { 
  user: UserProfile; 
  positions: Position[];
  status: { message: string; type: 'success' | 'error' } | null;
  setStatus: (status: { message: string; type: 'success' | 'error' } | null) => void;
  handleCopyReferral: () => void;
  copied: boolean;
  toggleAutoBoost: (id: string, current: boolean) => void;
  togglingBoost: string | null;
}) {
  const formatTime = (pos: Position) => {
    if (pos.remainingTime?.isReady) return "Ready";
    if (!pos.remainingTime) return "--";
    const { days, hours, minutes } = pos.remainingTime;
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const activePositions = positions.filter((p) => p.status !== "paid");
  const totalInvested = activePositions.reduce((sum, p) => sum + (p.entryAmount || 0), 0);
  const totalReturn = activePositions.reduce((sum, p) => {
    const entry = p.entryAmount || 0;
    return sum + (p.maxPayout || Math.floor(entry * (p.roiMultiplier || 1.5)));
  }, 0);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Status Toast */}
        {status && (
          <StatusToast 
            message={status.message} 
            type={status.type} 
            onClose={() => setStatus(null)} 
          />
        )}

        {/* Welcome Header */}
        <div className={styles.welcomeSection}>
          <div className={styles.welcomeContent}>
            <span className={styles.welcomeLabel}>Welcome back</span>
            <h1 className={styles.welcomeTitle}>{formatHandle(user.handle)}</h1>
          </div>
          <div className={styles.welcomeActions}>
            <Link href="/sample-v2/deposit" className={styles.depositBtn}>
              <span>+</span>
              Deposit
            </Link>
          </div>
        </div>

        {/* Main Balance Card */}
        <div className={styles.balanceCard}>
          <div className={styles.balanceMain}>
            <div className={styles.balanceInfo}>
              <span className={styles.balanceLabel}>Platform Balance</span>
              <span className={styles.balanceValue}>${parseFloat(user.balance || "0").toFixed(2)}</span>
            </div>
            {!user.walletEvm && !user.walletSol && (
              <Link href="/sample-v2/wallet" className={styles.walletAlert}>
                <span className={styles.walletAlertIcon}>⚠</span>
                <span>Set up your withdrawal wallets</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            )}
          </div>
          <div className={styles.balanceStats}>
            <div className={styles.balanceStat}>
              <span className={styles.balanceStatLabel}>Invested</span>
              <span className={styles.balanceStatValue}>${totalInvested.toLocaleString()}</span>
            </div>
            <div className={styles.balanceStatDivider} />
            <div className={styles.balanceStat}>
              <span className={styles.balanceStatLabel}>Expected Return</span>
              <span className={`${styles.balanceStatValue} ${styles.positive}`}>${totalReturn.toLocaleString()}</span>
            </div>
            <div className={styles.balanceStatDivider} />
            <div className={styles.balanceStat}>
              <span className={styles.balanceStatLabel}>Net Profit</span>
              <span className={`${styles.balanceStatValue} ${styles.positive}`}>+${(totalReturn - totalInvested).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIconWrapper}>
              <span className={styles.statIcon}>◆</span>
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Belief Score</span>
              <span className={styles.statValue}>{user.beliefScore || 0}</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIconWrapper} ${styles.boost}`}>
              <span className={styles.statIcon}>⚡</span>
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Boost Points</span>
              <span className={`${styles.statValue} ${styles.boostValue}`}>{user.boostPoints || 0}</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIconWrapper}>
              <span className={styles.statIcon}>👥</span>
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Referrals</span>
              <span className={styles.statValue}>{user.stats?.referrals || 0}</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIconWrapper}>
              <span className={styles.statIcon}>◈</span>
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Positions</span>
              <span className={styles.statValue}>{activePositions.length}</span>
            </div>
          </div>
        </div>

        {/* Wallets & Referral Section */}
        <div className={styles.infoSection}>
          {/* Wallet Status */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardHeader}>
              <h3>Withdrawal Wallets</h3>
              <Link href="/sample-v2/wallet" className={styles.infoCardLink}>Manage</Link>
            </div>
            <div className={styles.walletList}>
              <div className={styles.walletRow}>
                <div className={styles.walletInfo}>
                  <span className={styles.walletName}>EVM Wallet</span>
                  {user.walletEvm && (
                    <span className={styles.walletAddress}>
                      {user.walletEvm.slice(0, 6)}...{user.walletEvm.slice(-4)}
                    </span>
                  )}
                </div>
                <span className={user.walletEvm ? styles.walletStatusSet : styles.walletStatusUnset}>
                  {user.walletEvm ? "Connected" : "Not Set"}
                </span>
              </div>
              <div className={styles.walletRow}>
                <div className={styles.walletInfo}>
                  <span className={styles.walletName}>Solana Wallet</span>
                  {user.walletSol && (
                    <span className={styles.walletAddress}>
                      {user.walletSol.slice(0, 6)}...{user.walletSol.slice(-4)}
                    </span>
                  )}
                </div>
                <span className={user.walletSol ? styles.walletStatusSet : styles.walletStatusUnset}>
                  {user.walletSol ? "Connected" : "Not Set"}
                </span>
              </div>
            </div>
          </div>

          {/* Referral Card */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardHeader}>
              <h3>Referral Program</h3>
              <span className={styles.referralReward}>Earn 10%</span>
            </div>
            <p className={styles.referralDesc}>Earn 10% of referrals&apos; Belief Points forever</p>
            <div className={styles.referralCodeBox}>
              <code className={styles.referralCode}>playtrenches.xyz/ref/{user.referralCode || "..."}</code>
              <button className={styles.copyBtn} onClick={handleCopyReferral}>
                {copied ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8L7 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <rect x="2" y="2" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="2"/>
                      <path d="M5 11V13C5 13.5523 5.44772 14 6 14H13C13.5523 14 14 13.5523 14 13V6C14 5.44772 13.5523 5 13 5H11" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Positions Section */}
        <div className={styles.positionsSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleWrap}>
              <h2>Active Positions</h2>
              <p>Campaigns you&apos;ve joined</p>
            </div>
            <Link href="/sample-v2" className={styles.browseBtn}>
              Browse Campaigns
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>

          {activePositions.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>◈</div>
              <h3>No Active Positions</h3>
              <p>Deposit funds and join campaigns to start earning yields.</p>
              <div className={styles.emptyActions}>
                <Link href="/sample-v2/deposit" className={styles.primaryBtn}>Deposit Funds</Link>
                <Link href="/sample-v2" className={styles.secondaryBtn}>View Campaigns</Link>
              </div>
            </div>
          ) : (
            <div className={styles.positionsGrid}>
              {activePositions.map((pos) => {
                const entryAmount = pos.entryAmount || 0;
                const exitAmount = pos.maxPayout || Math.floor(entryAmount * (pos.roiMultiplier || 1.5));

                return (
                  <div key={pos.id} className={styles.positionCard}>
                    <div className={styles.positionCardHeader}>
                      <div className={styles.positionBadges}>
                        <span className={`${styles.positionType} ${styles[pos.type]}`}>
                          {pos.type === "active" ? "Active" : pos.type === "secured" ? "Queued" : "Waitlist"}
                        </span>
                        <span className={styles.positionLevel}>{pos.trenchLevel}</span>
                      </div>
                      {pos.remainingTime?.isReady && (
                        <span className={styles.readyBadge}>Ready</span>
                      )}
                    </div>

                    <h3 className={styles.positionName}>{pos.campaignName || "Campaign"}</h3>

                    <div className={styles.positionAmounts}>
                      <div className={styles.positionAmount}>
                        <span className={styles.positionAmountLabel}>Invested</span>
                        <span className={styles.positionAmountValue}>${entryAmount.toLocaleString()}</span>
                      </div>
                      <svg className={styles.positionArrow} width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <div className={styles.positionAmount}>
                        <span className={styles.positionAmountLabel}>Return</span>
                        <span className={`${styles.positionAmountValue} ${styles.highlight}`}>${exitAmount.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className={styles.positionMetrics}>
                      <div className={styles.positionMetric}>
                        <span className={styles.positionMetricLabel}>ROI</span>
                        <span className={styles.positionMetricValue}>{pos.roiMultiplier?.toFixed(1) || "1.5"}x</span>
                      </div>
                      <div className={styles.positionMetric}>
                        <span className={styles.positionMetricLabel}>Time Remaining</span>
                        <span className={`${styles.positionMetricValue} ${pos.remainingTime?.isReady ? styles.ready : ""}`}>
                          {formatTime(pos)}
                        </span>
                      </div>
                      {pos.queueNumber && (
                        <div className={styles.positionMetric}>
                          <span className={styles.positionMetricLabel}>Queue</span>
                          <span className={styles.positionMetricValue}>#{pos.queueNumber}</span>
                        </div>
                      )}
                    </div>

                    <div className={styles.positionFooter}>
                      <label className={styles.toggleLabel}>
                        <input
                          type="checkbox"
                          checked={pos.autoBoost || false}
                          onChange={() => toggleAutoBoost(pos.id, pos.autoBoost || false)}
                          disabled={togglingBoost === pos.id}
                        />
                        <span className={styles.toggle} />
                        <span className={styles.toggleText}>Auto-Boost</span>
                      </label>
                      <Link href="/sample-v2/earn-v2" className={styles.boostLink}>
                        <span>⚡</span>
                        Earn Boost
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Loading State
function LoadingDashboard() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Loading dashboard...</span>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [togglingBoost, setTogglingBoost] = useState<string | null>(null);
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
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
    setStatus({ message: 'Referral link copied to clipboard', type: 'success' });
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleAutoBoost = async (positionId: string, currentValue: boolean) => {
    setTogglingBoost(positionId);
    try {
      const res = await fetch(`/api/user/positions/${positionId}/auto-boost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !currentValue }),
      });

      if (res.ok) {
        setStatus({ 
          message: `Auto-boost ${!currentValue ? 'enabled' : 'disabled'}`, 
          type: 'success' 
        });
        setPositions(prev => prev.map(p => 
          p.id === positionId ? { ...p, autoBoost: !currentValue } : p
        ));
      } else {
        throw new Error("Failed to toggle auto-boost");
      }
    } catch (error) {
      setStatus({ message: 'Failed to update auto-boost', type: 'error' });
    } finally {
      setTogglingBoost(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingDashboard />
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <UnauthenticatedDashboard />
      </Layout>
    );
  }

  return (
    <Layout>
      <AuthenticatedDashboard 
        user={user}
        positions={positions}
        status={status}
        setStatus={setStatus}
        handleCopyReferral={handleCopyReferral}
        copied={copied}
        toggleAutoBoost={toggleAutoBoost}
        togglingBoost={togglingBoost}
      />
    </Layout>
  );
}
