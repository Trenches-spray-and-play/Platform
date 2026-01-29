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

// Tactical status indicator
function StatusIndicator({ status, type }: { status: string; type: 'success' | 'error' | 'info' }) {
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  return (
    <span className={`${styles.statusInline} ${styles[type]}`}>
      {icons[type]} {status}
    </span>
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [copied, setCopied] = useState(false);
  const [togglingBoost, setTogglingBoost] = useState<string | null>(null);
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => setStatus(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

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
    }
  };

  const handleCopyReferral = () => {
    if (!user?.referralCode) return;
    navigator.clipboard.writeText(`https://playtrenches.xyz/ref/${user.referralCode}`);
    setCopied(true);
    setStatus({ message: 'REFERRAL_LINK_COPIED', type: 'success' });
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
        setStatus({ message: `AUTO_BOOST_${!currentValue ? 'ENABLED' : 'DISABLED'}`, type: 'success' });
        setPositions(prev => prev.map(p => 
          p.id === positionId ? { ...p, autoBoost: !currentValue } : p
        ));
      } else {
        throw new Error("Failed to toggle auto-boost");
      }
    } catch (error) {
      setStatus({ message: 'AUTO_BOOST_UPDATE_FAILED', type: 'error' });
    } finally {
      setTogglingBoost(null);
    }
  };

  const formatTime = (pos: Position) => {
    if (pos.remainingTime?.isReady) return "Ready";
    if (!pos.remainingTime) return "--";
    const { days, hours, minutes } = pos.remainingTime;
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const activePositions = positions.filter((p) => p.status !== "paid");

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.container}>
          {/* Status Banner */}
          {status && (
            <div className={`${styles.statusBanner} ${styles[status.type]}`}>
              <StatusIndicator status={status.message} type={status.type} />
            </div>
          )}

          {/* Welcome Header */}
          <div className={styles.welcome}>
            <h1>@{user?.handle || "user"} // COMMAND_DASHBOARD</h1>
            <p>Platform balance and active positions</p>
          </div>

          {/* Balance Alert */}
          <div className={styles.balanceAlert}>
            <div className={styles.balanceInfo}>
              <span className={styles.balanceLabel}>PLATFORM_BALANCE</span>
              <span className={styles.balanceValue}>${parseFloat(user?.balance || "0").toFixed(2)} USD</span>
            </div>
            <div className={styles.balanceActions}>
              <Link href="/sample-v2/deposit" className={styles.actionBtn}>+ Deposit</Link>
              {!user?.walletEvm && !user?.walletSol && (
                <Link href="/sample-v2/wallet" className={styles.actionBtnSecondary}>⚠ Set Wallet</Link>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>◆</div>
              <div className={styles.statContent}>
                <span className={styles.statLabel}>BELIEF_SCORE</span>
                <span className={styles.statValue}>{user?.beliefScore || 0}</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.boostIcon}`}>⚡</div>
              <div className={styles.statContent}>
                <span className={styles.statLabel}>BOOST_POINTS</span>
                <span className={`${styles.statValue} ${styles.boostValue}`}>+{user?.boostPoints || 0}</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>👥</div>
              <div className={styles.statContent}>
                <span className={styles.statLabel}>REFERRALS</span>
                <span className={styles.statValue}>{user?.stats?.referrals || 0}</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>◈</div>
              <div className={styles.statContent}>
                <span className={styles.statLabel}>POSITIONS</span>
                <span className={styles.statValue}>{activePositions.length}</span>
              </div>
            </div>
          </div>

          {/* Withdrawal Wallets Status */}
          <div className={styles.walletStatus}>
            <h3>Withdrawal Wallets</h3>
            <div className={styles.walletGrid}>
              <div className={styles.walletItem}>
                <span className={styles.walletLabel}>EVM</span>
                <span className={user?.walletEvm ? styles.walletSet : styles.walletNotSet}>
                  {user?.walletEvm ? "✓ Set" : "⚠ Not Set"}
                </span>
              </div>
              <div className={styles.walletItem}>
                <span className={styles.walletLabel}>SOLANA</span>
                <span className={user?.walletSol ? styles.walletSet : styles.walletNotSet}>
                  {user?.walletSol ? "✓ Set" : "⚠ Not Set"}
                </span>
              </div>
            </div>
            <Link href="/sample-v2/wallet" className={styles.manageWalletBtn}>Manage Wallets →</Link>
          </div>

          {/* Referral Banner */}
          <div className={styles.referralBanner}>
            <div className={styles.referralContent}>
              <div className={styles.referralIcon}>🎁</div>
              <div className={styles.referralText}>
                <h3>Referral Program</h3>
                <p>Earn 10% of referrals&apos; Belief Points forever</p>
              </div>
            </div>
            <div className={styles.referralAction}>
              <code className={styles.referralCode}>playtrenches.xyz/ref/{user?.referralCode || "..."}</code>
              <button className={styles.copyBtn} onClick={handleCopyReferral}>
                {copied ? "COPIED" : "COPY"}
              </button>
            </div>
          </div>

          {/* Positions Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h2>Active Positions</h2>
                <p>Campaigns funded from your platform balance</p>
              </div>
              <Link href="/sample-v2" className={styles.browseBtn}>Browse Campaigns →</Link>
            </div>

            {activePositions.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>◈</div>
                <h3>No Active Positions</h3>
                <p>Deposit funds to your platform balance, then join campaigns to start earning.</p>
                <div className={styles.emptyActions}>
                  <Link href="/sample-v2/deposit" className={styles.actionBtn}>Deposit Funds</Link>
                  <Link href="/sample-v2" className={styles.browseBtn}>View Campaigns</Link>
                </div>
              </div>
            ) : (
              <div className={styles.positionsGrid}>
                {activePositions.map((pos) => {
                  const entryAmount = pos.entryAmount || 0;
                  const exitAmount = pos.maxPayout || Math.floor(entryAmount * (pos.roiMultiplier || 1.5));

                  return (
                    <div key={pos.id} className={styles.positionCard}>
                      <div className={styles.positionHeader}>
                        <div className={styles.positionType}>
                          <span className={`${styles.typeBadge} ${styles[pos.type]}`}>
                            {pos.type === "active" ? "ACTIVE" : pos.type === "secured" ? "QUEUED" : "WAITLIST"}
                          </span>
                          <span className={styles.levelBadge}>{pos.trenchLevel}</span>
                        </div>
                      </div>

                      <h3 className={styles.campaignName}>{pos.campaignName || "Campaign"}</h3>

                      <div className={styles.amounts}>
                        <div className={styles.amount}>
                          <span className={styles.amountLabel}>INVESTED</span>
                          <span className={styles.amountValue}>${entryAmount.toLocaleString()}</span>
                        </div>
                        <div className={styles.amountArrow}>→</div>
                        <div className={styles.amount}>
                          <span className={styles.amountLabel}>RETURN</span>
                          <span className={`${styles.amountValue} ${styles.exitValue}`}>${exitAmount.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className={styles.metrics}>
                        <div className={styles.metric}>
                          <span className={styles.metricLabel}>ROI</span>
                          <span className={styles.metricValue}>{pos.roiMultiplier?.toFixed(1) || "1.5"}x</span>
                        </div>
                        <div className={styles.metric}>
                          <span className={styles.metricLabel}>TIME</span>
                          <span className={`${styles.metricValue} ${pos.remainingTime?.isReady ? styles.ready : ""}`}>
                            {formatTime(pos)}
                          </span>
                        </div>
                        {pos.queueNumber && (
                          <div className={styles.metric}>
                            <span className={styles.metricLabel}>QUEUE</span>
                            <span className={styles.metricValue}>#{pos.queueNumber}</span>
                          </div>
                        )}
                      </div>

                      {/* Auto-Boost Toggle */}
                      <div className={styles.autoBoostRow}>
                        <label className={styles.toggleLabel}>
                          <input
                            type="checkbox"
                            checked={pos.autoBoost || false}
                            onChange={() => toggleAutoBoost(pos.id, pos.autoBoost || false)}
                            disabled={togglingBoost === pos.id}
                          />
                          <span className={styles.toggle} />
                          <span className={styles.toggleText}>
                            Auto-Boost
                            <small>Auto-reinvest profits</small>
                          </span>
                        </label>
                        <Link 
                          href="/sample-v2/earn-v2" 
                          className={styles.boostLink}
                          title="Earn Boost Points to reduce wait time"
                        >
                          ⚡ BOOST
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
    </Layout>
  );
}
