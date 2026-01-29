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
  chainName: string;
  roiMultiplier: string;
  reserveCachedBalance: string | null;
  trenchIds: string[];
  phase?: string;
  startsAt?: string | null;
  isPaused?: boolean;
  participantCount?: number;
}

export default function CampaignDetailPage() {
  const params = useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchCampaign();
  }, [params.id]);

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
    } finally {
      setLoading(false);
    }
  };

  const getLevelInfo = () => {
    const level = campaign?.trenchIds?.[0]?.toUpperCase() || "RAPID";
    switch (level) {
      case "RAPID":
        return { label: "Quick Returns", color: styles.rapid, icon: "⚡", desc: "1-3 days", min: 5, max: 1000 };
      case "MID":
        return { label: "Balanced", color: styles.mid, icon: "📊", desc: "7-14 days", min: 100, max: 10000 };
      case "DEEP":
        return { label: "High Yield", color: styles.deep, icon: "🎯", desc: "30-60 days", min: 1000, max: 100000 };
      default:
        return { label: "Quick Returns", color: styles.rapid, icon: "⚡", desc: "1-3 days", min: 5, max: 1000 };
    }
  };

  const levelInfo = getLevelInfo();
  const roi = parseFloat(campaign?.roiMultiplier || "1.5");

  if (loading) {
    return (
      <Layout>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Loading campaign details...</span>
        </div>
      </Layout>
    );
  }

  if (!campaign) {
    return (
      <Layout>
        <div className={styles.error}>
          <div className={styles.errorIcon}>🔍</div>
          <h1>Campaign Not Found</h1>
          <p>This campaign may have ended or does not exist.</p>
          <Link href="/sample-light" className={styles.backBtn}>Back to Campaigns</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.container}>
          {/* Breadcrumb */}
          <nav className={styles.breadcrumb}>
            <Link href="/sample-light">← All Campaigns</Link>
          </nav>

          {/* Header */}
          <div className={styles.header}>
            <div className={`${styles.levelBadge} ${levelInfo.color}`}>
              <span>{levelInfo.icon}</span>
              <span>{levelInfo.label}</span>
            </div>
            <h1 className={styles.title}>{campaign.name}</h1>
            <div className={styles.tokenInfo}>
              <span className={styles.token}>${campaign.tokenSymbol}</span>
              <span className={styles.dot}>•</span>
              <span className={styles.chain}>{campaign.chainName}</span>
            </div>
          </div>

          <div className={styles.grid}>
            {/* Left Column - Info */}
            <div className={styles.infoColumn}>
              {/* What You Get */}
              <div className={styles.card}>
                <h3>What You Will Receive</h3>
                <div className={styles.benefitList}>
                  <div className={styles.benefit}>
                    <span className={styles.benefitIcon}>📈</span>
                    <div>
                      <strong>{roi.toFixed(1)}x Return Multiplier</strong>
                      <p>Receive {roi.toFixed(1)} times your deposit amount</p>
                    </div>
                  </div>
                  <div className={styles.benefit}>
                    <span className={styles.benefitIcon}>⏱️</span>
                    <div>
                      <strong>{levelInfo.desc} Wait Time</strong>
                      <p>Your funds will be locked for this duration</p>
                    </div>
                  </div>
                  <div className={styles.benefit}>
                    <span className={styles.benefitIcon}>⚡</span>
                    <div>
                      <strong>Boost to Reduce Time</strong>
                      <p>Earn points to cut your wait time by up to 50%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* How It Works */}
              <div className={styles.card}>
                <h3>How It Works</h3>
                <div className={styles.steps}>
                  <div className={styles.step}>
                    <div className={styles.stepNum}>1</div>
                    <div>
                      <strong>Deposit Your Funds</strong>
                      <p>Enter the amount you want to invest (between ${levelInfo.min.toLocaleString()} and ${levelInfo.max.toLocaleString()})</p>
                    </div>
                  </div>
                  <div className={styles.step}>
                    <div className={styles.stepNum}>2</div>
                    <div>
                      <strong>Wait for the Lock Period</strong>
                      <p>Your funds are securely held in a smart contract</p>
                    </div>
                  </div>
                  <div className={styles.step}>
                    <div className={styles.stepNum}>3</div>
                    <div>
                      <strong>Withdraw Your Returns</strong>
                      <p>Receive your deposit plus {((roi - 1) * 100).toFixed(0)}% returns</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Deposit */}
            <div className={styles.depositColumn}>
              <div className={styles.depositCard}>
                <h3>Enter This Campaign</h3>
                <p>Deposit now to secure your position</p>

                <div className={styles.inputGroup}>
                  <label>Amount to Deposit (USD)</label>
                  <div className={styles.inputWrap}>
                    <span className={styles.prefix}>$</span>
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder={`Min: ${levelInfo.min}`}
                      min={levelInfo.min}
                      max={levelInfo.max}
                    />
                  </div>
                  <div className={styles.inputMeta}>
                    Minimum: ${levelInfo.min.toLocaleString()} • Maximum: ${levelInfo.max.toLocaleString()}
                  </div>
                </div>

                {depositAmount && parseFloat(depositAmount) > 0 && (
                  <div className={styles.preview}>
                    <div className={styles.previewRow}>
                      <span>You invest</span>
                      <span>${parseFloat(depositAmount).toLocaleString()}</span>
                    </div>
                    <div className={styles.previewRow}>
                      <span>Return multiplier</span>
                      <span>{roi.toFixed(1)}x</span>
                    </div>
                    <div className={styles.previewDivider} />
                    <div className={`${styles.previewRow} ${styles.total}`}>
                      <span>You receive</span>
                      <span className={styles.totalValue}>
                        ${Math.floor(parseFloat(depositAmount) * roi).toLocaleString()}
                      </span>
                    </div>
                    <div className={styles.previewProfit}>
                      Profit: ${Math.floor(parseFloat(depositAmount) * (roi - 1)).toLocaleString()} (+{((roi - 1) * 100).toFixed(0)}%)
                    </div>
                  </div>
                )}

                <button
                  className={styles.depositBtn}
                  onClick={() => setShowConfirm(true)}
                  disabled={!depositAmount || parseFloat(depositAmount) < levelInfo.min || campaign.isPaused}
                >
                  {campaign.isPaused ? "⏸️ Campaign Paused" : "Confirm Deposit"}
                </button>

                <div className={styles.securityNote}>
                  <span>🔒</span>
                  <span>Your funds are secured in an audited smart contract</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowConfirm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Your Deposit</h3>
            <p>Please review your deposit details</p>
            
            <div className={styles.modalDetails}>
              <div className={styles.modalRow}>
                <span>Campaign</span>
                <span>{campaign.name}</span>
              </div>
              <div className={styles.modalRow}>
                <span>Your Deposit</span>
                <span>${parseFloat(depositAmount).toLocaleString()}</span>
              </div>
              <div className={styles.modalRow}>
                <span>You Will Receive</span>
                <span>${Math.floor(parseFloat(depositAmount) * roi).toLocaleString()}</span>
              </div>
              <div className={styles.modalRow}>
                <span>Wait Time</span>
                <span>{levelInfo.desc}</span>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.modalCancel} onClick={() => setShowConfirm(false)}>
                Cancel
              </button>
              <button className={styles.modalConfirm} onClick={() => { setShowConfirm(false); alert("Deposit successful! (demo)"); }}>
                Confirm Deposit
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
