"use client";

import { useEffect, useState } from "react";
import styles from "./CampaignDetailModal.module.css";

interface WaitlistUser {
  id: string;
  position: number;
  user: { id: string; handle: string; email: string | null };
  depositAmount?: number;
  joinedAt: string;
}

interface CampaignDetail {
  id: string;
  name: string;
  tokenSymbol: string;
  chainName: string;
  phase: "WAITLIST" | "ACCEPTING" | "LIVE" | "PAUSED";
  startsAt: string | null;
  isPaused: boolean;
  acceptDepositsBeforeStart: boolean;
  payoutIntervalSeconds: number;
  stats: {
    totalParticipants: number;
    totalDeposits: number;
    totalDepositedUsd: number;
  };
  waitlistStats: {
    totalInWaitlist: number;
    waitingNoDeposit: number;
    waitingWithDeposit: number;
    totalDepositedInWaitlist: number;
  };
  waitlistUsers: {
    waiting: WaitlistUser[];
    deposited: WaitlistUser[];
  };
}

interface CampaignDetailModalProps {
  campaignId: string | null;
  onClose: () => void;
}

export default function CampaignDetailModal({ campaignId, onClose }: CampaignDetailModalProps) {
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "waitlist">("overview");

  useEffect(() => {
    if (campaignId) {
      fetchCampaignDetails();
    }
  }, [campaignId]);

  const fetchCampaignDetails = async () => {
    if (!campaignId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setCampaign(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch campaign details:", err);
    }
    setLoading(false);
  };

  if (!campaignId) return null;

  const getPhaseBadgeClass = (phase: string) => {
    switch (phase) {
      case "LIVE":
        return styles.phaseLive;
      case "PAUSED":
        return styles.phasePaused;
      case "WAITLIST":
        return styles.phaseWaitlist;
      case "ACCEPTING":
        return styles.phaseAccepting;
      default:
        return "";
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Campaign Details</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading...</div>
        ) : campaign ? (
          <>
            <div className={styles.campaignHeader}>
              <div className={styles.campaignInfo}>
                <h3>{campaign.name}</h3>
                <p>
                  {campaign.tokenSymbol} on {campaign.chainName}
                </p>
                <span className={`${styles.phaseBadge} ${getPhaseBadgeClass(campaign.phase)}`}>
                  {campaign.phase}
                </span>
              </div>
            </div>

            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{campaign.stats.totalParticipants}</span>
                <span className={styles.statLabel}>Participants</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{campaign.stats.totalDeposits}</span>
                <span className={styles.statLabel}>Deposits</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>${campaign.stats.totalDepositedUsd.toFixed(2)}</span>
                <span className={styles.statLabel}>Total Deposited</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{campaign.waitlistStats.totalInWaitlist}</span>
                <span className={styles.statLabel}>In Waitlist</span>
              </div>
            </div>

            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeTab === "overview" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("overview")}
              >
                Overview
              </button>
              <button
                className={`${styles.tab} ${activeTab === "waitlist" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("waitlist")}
              >
                Waitlist ({campaign.waitlistStats.totalInWaitlist})
              </button>
            </div>

            <div className={styles.content}>
              {activeTab === "overview" && (
                <div className={styles.overview}>
                  <div className={styles.infoSection}>
                    <h4>Campaign Settings</h4>
                    <div className={styles.infoRow}>
                      <span>Payout Interval:</span>
                      <span>{campaign.payoutIntervalSeconds} seconds</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span>Accept Deposits Before Start:</span>
                      <span>{campaign.acceptDepositsBeforeStart ? "Yes" : "No"}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span>Paused:</span>
                      <span>{campaign.isPaused ? "Yes" : "No"}</span>
                    </div>
                    {campaign.startsAt && (
                      <div className={styles.infoRow}>
                        <span>Starts At:</span>
                        <span>{new Date(campaign.startsAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.infoSection}>
                    <h4>Waitlist Statistics</h4>
                    <div className={styles.infoRow}>
                      <span>Waiting (No Deposit):</span>
                      <span>{campaign.waitlistStats.waitingNoDeposit}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span>Waiting (With Deposit):</span>
                      <span>{campaign.waitlistStats.waitingWithDeposit}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span>Total Deposited in Waitlist:</span>
                      <span>${campaign.waitlistStats.totalDepositedInWaitlist.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "waitlist" && (
                <div className={styles.waitlistSection}>
                  {campaign.waitlistUsers.deposited.length > 0 && (
                    <>
                      <h4>With Deposit ({campaign.waitlistUsers.deposited.length})</h4>
                      <div className={styles.tableContainer}>
                        <table className={styles.table}>
                          <thead>
                            <tr>
                              <th>Position</th>
                              <th>User</th>
                              <th>Deposit</th>
                              <th>Joined</th>
                            </tr>
                          </thead>
                          <tbody>
                            {campaign.waitlistUsers.deposited.map((w) => (
                              <tr key={w.id}>
                                <td>#{w.position}</td>
                                <td>@{w.user.handle}</td>
                                <td>${w.depositAmount?.toFixed(2)}</td>
                                <td>{new Date(w.joinedAt).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {campaign.waitlistUsers.waiting.length > 0 && (
                    <>
                      <h4>Waiting ({campaign.waitlistUsers.waiting.length})</h4>
                      <div className={styles.tableContainer}>
                        <table className={styles.table}>
                          <thead>
                            <tr>
                              <th>Position</th>
                              <th>User</th>
                              <th>Joined</th>
                            </tr>
                          </thead>
                          <tbody>
                            {campaign.waitlistUsers.waiting.map((w) => (
                              <tr key={w.id}>
                                <td>#{w.position}</td>
                                <td>@{w.user.handle}</td>
                                <td>{new Date(w.joinedAt).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {campaign.waitlistStats.totalInWaitlist === 0 && (
                    <p className={styles.empty}>No users in waitlist</p>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className={styles.error}>Failed to load campaign details</div>
        )}
      </div>
    </div>
  );
}
