"use client";

import { useEffect, useState } from "react";
import styles from "./UserDetailModal.module.css";

interface UserDetail {
  id: string;
  handle: string;
  email: string | null;
  walletEvm: string | null;
  walletSol: string | null;
  beliefScore: number;
  balance: number;
  createdAt: string;
  isBanned?: boolean;
  banReason?: string | null;
  referralCode: string | null;
  referrer: { id: string; handle: string } | null;
  referrals: { id: string; handle: string; createdAt: string }[];
  deposits: {
    id: string;
    chain: string;
    asset: string;
    amount: string;
    amountUsd: string;
    status: string;
    txHash: string | null;
    createdAt: string;
  }[];
  participants: {
    id: string;
    trenchId: string;
    status: string;
    boostPoints: number;
    entryAmount: number;
    maxPayout: number;
    receivedAmount: number;
    trench: { name: string; level: string };
  }[];
  userTasks: {
    id: string;
    completedAt: string;
    task: { title: string; reward: number };
  }[];
  campaignWaitlists: {
    id: string;
    campaignId: string;
    hasDeposited: boolean;
    depositAmount: string | null;
    queueNumber: number | null;
    joinedAt: string;
    campaign: { id: string; name: string };
  }[];
  stats: {
    totalDepositsUsd: number;
    totalReceived: number;
    totalBoostPoints: number;
    pendingPayoutTotal: number;
    profitLoss: number;
    referralCount: number;
    waitlistCount: number;
  };
}

interface UserDetailModalProps {
  userId: string | null;
  onClose: () => void;
}

export default function UserDetailModal({ userId, onClose }: UserDetailModalProps) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "deposits" | "positions" | "tasks" | "referrals">("overview");
  const [balanceAdjustment, setBalanceAdjustment] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [banning, setBanning] = useState(false);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    handle: "",
    email: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setUser(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch user details:", err);
    }
    setLoading(false);
  };

  const handleAdjustBalance = async () => {
    const amount = parseFloat(balanceAdjustment);
    if (isNaN(amount) || amount === 0) {
      alert("Please enter a valid amount");
      return;
    }
    if (!adjustmentReason.trim()) {
      alert("Please provide a reason for the adjustment");
      return;
    }
    setAdjusting(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/adjust-balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, reason: adjustmentReason }),
      });
      const data = await res.json();
      if (data.success) {
        setBalanceAdjustment("");
        setAdjustmentReason("");
        fetchUserDetails();
        alert(`Balance adjusted by $${amount.toFixed(2)}`);
      } else {
        alert(data.error || "Failed to adjust balance");
      }
    } catch (err) {
      console.error("Failed to adjust balance:", err);
      alert("Failed to adjust balance");
    }
    setAdjusting(false);
  };

  const handleBanUnban = async () => {
    const action = user?.isBanned ? "unban" : "ban";
    const reason = action === "ban" ? prompt("Enter ban reason:") : null;
    if (action === "ban" && !reason) return;
    
    setBanning(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: reason ? JSON.stringify({ reason }) : undefined,
      });
      const data = await res.json();
      if (data.success) {
        fetchUserDetails();
        alert(`User ${action === "ban" ? "banned" : "unbanned"} successfully`);
      } else {
        alert(data.error || `Failed to ${action} user`);
      }
    } catch (err) {
      console.error(`Failed to ${action} user:`, err);
      alert(`Failed to ${action} user`);
    }
    setBanning(false);
  };

  const startEditing = () => {
    if (user) {
      setEditForm({
        handle: user.handle,
        email: user.email || "",
      });
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditForm({ handle: "", email: "" });
  };

  const handleSaveEdit = async () => {
    if (!editForm.handle.trim()) {
      alert("Handle is required");
      return;
    }
    
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: editForm.handle.trim(),
          email: editForm.email.trim() || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsEditing(false);
        fetchUserDetails();
        alert("User updated successfully");
      } else {
        alert(data.error || "Failed to update user");
      }
    } catch (err) {
      console.error("Failed to update user:", err);
      alert("Failed to update user");
    }
    setSavingEdit(false);
  };

  if (!userId) return null;

  const formatDate = (date: string) => new Date(date).toLocaleDateString();
  const truncateAddress = (addr: string | null) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "-";

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>User Details</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading...</div>
        ) : user ? (
          <>
            <div className={styles.userHeader}>
              <div className={styles.avatar}>{user.handle.charAt(0).toUpperCase()}</div>
              <div className={styles.userInfo}>
                {isEditing ? (
                  <div className={styles.editForm}>
                    <input
                      type="text"
                      className={styles.editInput}
                      value={editForm.handle}
                      onChange={(e) => setEditForm({ ...editForm, handle: e.target.value })}
                      placeholder="Handle"
                    />
                    <input
                      type="email"
                      className={styles.editInput}
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="Email"
                    />
                    <div className={styles.editActions}>
                      <button
                        className={styles.editBtn}
                        onClick={handleSaveEdit}
                        disabled={savingEdit}
                      >
                        {savingEdit ? "Saving..." : "Save"}
                      </button>
                      <button className={styles.editBtnCancel} onClick={cancelEditing}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3>
                      @{user.handle}
                      {user.isBanned && <span className={styles.bannedBadge}>BANNED</span>}
                    </h3>
                    <p>{user.email || "No email"}</p>
                    <p className={styles.meta}>Joined {formatDate(user.createdAt)}</p>
                    <button className={styles.editLink} onClick={startEditing}>
                      ✎ Edit
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Admin Actions */}
            <div className={styles.adminActions}>
              <div className={styles.balanceForm}>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Adjust Balance:</span>
                <input
                  type="number"
                  className={styles.balanceInput}
                  placeholder="+/-"
                  value={balanceAdjustment}
                  onChange={(e) => setBalanceAdjustment(e.target.value)}
                  disabled={adjusting}
                />
                <input
                  type="text"
                  className={styles.balanceInput}
                  style={{ width: "150px" }}
                  placeholder="Reason"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  disabled={adjusting}
                />
                <button
                  className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                  onClick={handleAdjustBalance}
                  disabled={adjusting || !balanceAdjustment || !adjustmentReason}
                >
                  {adjusting ? "..." : "Apply"}
                </button>
              </div>
              <button
                className={`${styles.actionBtn} ${user.isBanned ? styles.actionBtnPrimary : styles.actionBtnDanger}`}
                onClick={handleBanUnban}
                disabled={banning}
              >
                {banning ? "..." : user.isBanned ? "Unban User" : "Ban User"}
              </button>
            </div>

            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statValue}>${Number(user.balance).toFixed(2)}</span>
                <span className={styles.statLabel}>Balance</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{user.beliefScore.toLocaleString()}</span>
                <span className={styles.statLabel}>Belief Score</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>${Number(user.stats.totalDepositsUsd).toFixed(2)}</span>
                <span className={styles.statLabel}>Total Deposits</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>${Number(user.stats.profitLoss).toFixed(2)}</span>
                <span className={styles.statLabel}>P/L</span>
              </div>
            </div>

            <div className={styles.tabs}>
              {(["overview", "deposits", "positions", "tasks", "referrals"] as const).map((tab) => (
                <button
                  key={tab}
                  className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className={styles.content}>
              {activeTab === "overview" && (
                <div className={styles.overview}>
                  <div className={styles.infoSection}>
                    <h4>Wallet Addresses</h4>
                    <div className={styles.infoRow}>
                      <span>EVM:</span>
                      <span>{truncateAddress(user.walletEvm)}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span>Solana:</span>
                      <span>{truncateAddress(user.walletSol)}</span>
                    </div>
                  </div>
                  <div className={styles.infoSection}>
                    <h4>Statistics</h4>
                    <div className={styles.infoRow}>
                      <span>Referrals:</span>
                      <span>{user.stats.referralCount}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span>Waitlist Entries:</span>
                      <span>{user.stats.waitlistCount}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span>Pending Payouts:</span>
                      <span>${Number(user.stats.pendingPayoutTotal).toFixed(2)}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span>Total Received:</span>
                      <span>${Number(user.stats.totalReceived).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "deposits" && (
                <div className={styles.tableContainer}>
                  {user.deposits.length === 0 ? (
                    <p className={styles.empty}>No deposits</p>
                  ) : (
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Chain</th>
                          <th>Amount</th>
                          <th>USD</th>
                          <th>Status</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {user.deposits.map((d) => (
                          <tr key={d.id}>
                            <td>{d.chain}</td>
                            <td>{d.amount} {d.asset}</td>
                            <td>${Number(d.amountUsd).toFixed(2)}</td>
                            <td>{d.status}</td>
                            <td>{formatDate(d.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {activeTab === "positions" && (
                <div className={styles.tableContainer}>
                  {user.participants.length === 0 ? (
                    <p className={styles.empty}>No positions</p>
                  ) : (
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Trench</th>
                          <th>Entry</th>
                          <th>Max Payout</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {user.participants.map((p) => (
                          <tr key={p.id}>
                            <td>{p.trench.name}</td>
                            <td>${p.entryAmount}</td>
                            <td>${p.maxPayout}</td>
                            <td>{p.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {activeTab === "tasks" && (
                <div className={styles.tableContainer}>
                  {user.userTasks.length === 0 ? (
                    <p className={styles.empty}>No completed tasks</p>
                  ) : (
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Task</th>
                          <th>Reward</th>
                          <th>Completed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {user.userTasks.map((t) => (
                          <tr key={t.id}>
                            <td>{t.task.title}</td>
                            <td>{t.task.reward} BP</td>
                            <td>{formatDate(t.completedAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {activeTab === "referrals" && (
                <div className={styles.tableContainer}>
                  {user.referrals.length === 0 ? (
                    <p className={styles.empty}>No referrals</p>
                  ) : (
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {user.referrals.map((r) => (
                          <tr key={r.id}>
                            <td>@{r.handle}</td>
                            <td>{formatDate(r.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className={styles.error}>Failed to load user details</div>
        )}
      </div>
    </div>
  );
}
