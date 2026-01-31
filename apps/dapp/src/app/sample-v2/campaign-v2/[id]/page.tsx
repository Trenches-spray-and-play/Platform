"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ComplianceDisclaimer } from "@trenches/ui";
import styles from "./page.module.css";
import { useUser, useCampaign, useApplySpray } from "@/hooks/useQueries";
import { useUIStore } from "@/store/uiStore";
import { SprayRequestSchema } from "@/lib/schemas";
import { validateOrToast } from "@/lib/validation";

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = params.id as string;

  const { data: campaign, isLoading: isLoadingCampaign } = useCampaign(campaignId);
  const { data: user } = useUser();
  const sprayMutation = useApplySpray();
  const addToast = useUIStore((state) => state.addToast);

  const [amount, setAmount] = useState("");
  const [useAutoBoost, setUseAutoBoost] = useState(false);

  const handleSpraySubmit = async () => {
    const amountNum = parseFloat(amount);

    const payload = validateOrToast(SprayRequestSchema, {
      trenchId: campaignId,
      amount: amountNum,
      level: (campaign as any)?.level || (campaign?.trenchIds.includes("RAPID") ? "RAPID" :
        campaign?.trenchIds.includes("MID") ? "MID" : "DEEP"),
      useAutoBoost,
    });

    if (!payload || !campaign || sprayMutation.isPending) return;

    addToast('Processing entry...', 'info');

    try {
      const result = await sprayMutation.mutateAsync(payload);
      addToast(`Entry confirmed! Queue position #${result.queuePosition}`, 'success');
      setAmount("");
    } catch (error: any) {
      console.error("Spray error:", error);
      if (error.type === "TASKS_REQUIRED") {
        addToast(`Please complete ${error.remaining} more tasks first`, 'error');
        setTimeout(() => window.location.href = "/sample-v2/earn-v2", 1500);
      } else {
        addToast(error.message || 'Entry failed', 'error');
      }
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "RAPID": return styles.levelRapid;
      case "MID": return styles.levelMid;
      case "DEEP": return styles.levelDeep;
      default: return "";
    }
  };

  const userBalance = parseFloat(user?.balance || "0");

  if (isLoadingCampaign) {
    return (
      <>
        <div className={styles.page}>
          <div className={styles.container}>
            <div className={styles.loading}>LOADING_CAMPAIGN_DATA...</div>
          </div>
        </div>
      </>
    );
  }

  if (!campaign) {
    return (
      <>
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
      </>
    );
  }

  const level = (campaign as any).level || (campaign.trenchIds.includes("RAPID") ? "RAPID" :
    campaign.trenchIds.includes("MID") ? "MID" : "DEEP");
  const roi = parseFloat(campaign.roiMultiplier) || 1.5;
  const minEntry = (campaign as any).entryRange?.min || (level === "RAPID" ? 5 : level === "MID" ? 100 : 1000);
  const maxEntry = (campaign as any).entryRange?.max || (level === "RAPID" ? 1000 : level === "MID" ? 10000 : 100000);
  const waitTime = level === "RAPID" ? "1-3 days" : level === "MID" ? "7-14 days" : "30-60 days";
  const amountNum = parseFloat(amount) || 0;
  const isValidAmount = amountNum >= minEntry && amountNum <= maxEntry && amountNum <= userBalance;
  const isSubmitting = sprayMutation.isPending;

  return (
    <>
      <div className={styles.page}>
        <div className={styles.container}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/sample-v2">Campaigns</Link>
            <span>/</span>
            <span aria-current="page">{campaign.name}</span>
          </nav>

          <div className={styles.header}>
            <div className={styles.headerContent}>
              <div className={styles.badgeRow}>
                <span className={`${styles.levelBadge} ${getLevelColor(level)}`}>
                  {level} TRENCH
                </span>
                {(campaign as any).isPaused ? (
                  <span className={styles.pausedBadge}>Paused</span>
                ) : (campaign as any).phase === "LIVE" ? (
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

          <div className={styles.grid}>
            <div className={styles.infoColumn}>
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
                  <span className={styles.statValue}>{(campaign as any).reserveCachedBalance || "0"}</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Participants</span>
                  <span className={styles.statValue}>{(campaign as any).participantCount || 0}</span>
                </div>
              </div>

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
                    <span>Time-locked deposits with targeted settlement multiplier</span>
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
                          disabled={isSubmitting || (campaign as any).isPaused}
                        />
                      </div>
                      <div className={styles.inputMeta}>
                        <span>MIN: ${minEntry.toLocaleString()}</span>
                        <span>MAX: ${maxEntry.toLocaleString()}</span>
                      </div>
                    </div>

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
                          <small>Auto-reinvest rewards on maturity</small>
                        </span>
                      </label>
                    </div>

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
                      disabled={!isValidAmount || (campaign as any).isPaused || isSubmitting}
                    >
                      {isSubmitting ? "PROCESSING..." : (campaign as any).isPaused ? "CAMPAIGN_PAUSED" : "CONFIRM_ENTRY"}
                    </button>

                    <div className={styles.entryNote}>
                      <span>⚡</span>
                      <span>Complete tasks to earn Boost Points and reduce wait time</span>
                    </div>
                  </>
                )}
              </div>

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

              <ComplianceDisclaimer variant="footer" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
