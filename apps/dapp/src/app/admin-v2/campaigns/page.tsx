"use client";

import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import CampaignDetailModal from "../components/modals/CampaignDetailModal";
import styles from "./page.module.css";

interface Campaign {
  id: string;
  name: string;
  tokenSymbol: string;
  chainName: string;
  trenchIds: string[];
  roiMultiplier: number;
  reserveCachedBalance: string | null;
  isActive: boolean;
  isHidden: boolean;
  isPaused: boolean;
  manualPrice: number | null;
  useOracle: boolean;
  oracleSource: string | null;
}

const TRENCH_OPTIONS = [
  { id: "rapid", name: "RAPID" },
  { id: "mid", name: "MID" },
  { id: "deep", name: "DEEP" },
];

const CHAIN_OPTIONS = [
  { id: 999, name: "HyperEVM" },
  { id: 1, name: "Ethereum" },
  { id: 8453, name: "Base" },
  { id: 42161, name: "Arbitrum" },
  { id: 0, name: "Solana" },
];

// Preset tokens for quick selection
const PRESET_TOKENS = [
  { symbol: "BLT", address: "0xFEF20Fd2422a9d47Fe1a8C355A1AE83F04025EDF", chainId: 999, chainName: "HyperEVM", decimals: 18 },
  { symbol: "HYPE", address: "0x0000000000000000000000000000000000000000", chainId: 999, chainName: "HyperEVM", decimals: 18 },
  { symbol: "USDC", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", chainId: 1, chainName: "Ethereum", decimals: 6 },
  { symbol: "USDC", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", chainId: 8453, chainName: "Base", decimals: 6 },
  { symbol: "USDT", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", chainId: 1, chainName: "Ethereum", decimals: 6 },
  { symbol: "ETH", address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", chainId: 1, chainName: "Ethereum", decimals: 18 },
  { symbol: "ETH", address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", chainId: 8453, chainName: "Base", decimals: 18 },
  { symbol: "SOL", address: "So11111111111111111111111111111111111111112", chainId: 0, chainName: "Solana", decimals: 9 },
  { symbol: "USDC", address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", chainId: 0, chainName: "Solana", decimals: 6 },
];

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [saving, setSaving] = useState(false);
  const [refreshingReserve, setRefreshingReserve] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    tokenSymbol: "",
    tokenAddress: "",
    chainId: 999,
    trenchIds: [] as string[],
    roiMultiplier: 1.5,
    manualPrice: "",
    useOracle: false,
    oracleSource: "manual",
    isActive: true,
    isHidden: false,
    startsAt: "" as string,
    acceptDepositsBeforeStart: false,
    payoutIntervalSeconds: 5,
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/campaigns");
      const data = await res.json();
      // Handle both { success: true, data: [] } and { data: [] } formats
      const campaigns = data.data || data;
      if (Array.isArray(campaigns)) {
        setCampaigns(campaigns);
      }
    } catch (err) {
      console.error("Failed to fetch campaigns:", err);
    }
    setLoading(false);
  };

  const handleNew = () => {
    setEditingCampaign(null);
    setFormData({
      name: "",
      tokenSymbol: "",
      tokenAddress: "",
      chainId: 999,
      trenchIds: [],
      roiMultiplier: 1.5,
      manualPrice: "",
      useOracle: false,
      oracleSource: "manual",
      isActive: true,
      isHidden: false,
      startsAt: "",
      acceptDepositsBeforeStart: false,
      payoutIntervalSeconds: 5,
    });
    setShowModal(true);
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      tokenSymbol: campaign.tokenSymbol,
      tokenAddress: "",
      chainId: 999,
      trenchIds: campaign.trenchIds,
      roiMultiplier: campaign.roiMultiplier,
      manualPrice: campaign.manualPrice?.toString() || "",
      useOracle: campaign.useOracle,
      oracleSource: campaign.oracleSource || "manual",
      isActive: campaign.isActive,
      isHidden: campaign.isHidden,
      startsAt: "",
      acceptDepositsBeforeStart: false,
      payoutIntervalSeconds: 5,
    });
    setShowModal(true);
  };

  const handleDelete = async (campaign: Campaign) => {
    if (!confirm(`Delete campaign "${campaign.name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/campaigns?id=${campaign.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchCampaigns();
      } else {
        alert(data.error || "Failed to delete campaign");
      }
    } catch (err) {
      console.error("Failed to delete campaign:", err);
      alert("Failed to delete campaign");
    }
  };

  const handleToggleVisibility = async (campaign: Campaign) => {
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: campaign.id, isHidden: !campaign.isHidden }),
      });
      const data = await res.json();
      if (data.success) {
        fetchCampaigns();
      } else {
        alert(data.error || "Failed to update visibility");
      }
    } catch (err) {
      console.error("Failed to toggle visibility:", err);
      alert("Failed to update visibility");
    }
  };

  const handlePauseResume = async (campaign: Campaign) => {
    const action = campaign.isPaused ? "resume" : "pause";
    if (!confirm(`${action === "pause" ? "Pause" : "Resume"} campaign "${campaign.name}"?`)) {
      return;
    }
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: campaign.id, isPaused: !campaign.isPaused }),
      });
      const data = await res.json();
      if (data.success) {
        fetchCampaigns();
      } else {
        alert(data.error || `Failed to ${action} campaign`);
      }
    } catch (err) {
      console.error(`Failed to ${action} campaign:`, err);
      alert(`Failed to ${action} campaign`);
    }
  };

  const selectPresetToken = (token: typeof PRESET_TOKENS[0]) => {
    setFormData((prev) => ({
      ...prev,
      tokenSymbol: token.symbol,
      tokenAddress: token.address,
      chainId: token.chainId,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const method = editingCampaign ? "PUT" : "POST";
      const body = {
        ...formData,
        id: editingCampaign?.id,
        manualPrice: formData.manualPrice ? parseFloat(formData.manualPrice) : null,
        tokenAddress: formData.tokenAddress || "0x0000000000000000000000000000000000000000",
        tokenDecimals: 18,
        acceptedTokens: [],
        startsAt: formData.startsAt || null,
      };

      const res = await fetch("/api/admin/campaigns", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success || data.data) {
        setShowModal(false);
        fetchCampaigns();
      } else {
        alert(data.error || "Failed to save campaign");
      }
    } catch (err) {
      console.error("Failed to save campaign:", err);
      alert("Failed to save campaign");
    }
    setSaving(false);
  };

  const toggleTrench = (trenchId: string) => {
    setFormData((prev) => ({
      ...prev,
      trenchIds: prev.trenchIds.includes(trenchId)
        ? prev.trenchIds.filter((id) => id !== trenchId)
        : [...prev.trenchIds, trenchId],
    }));
  };

  const handleRefreshReserve = async (campaignId: string) => {
    setRefreshingReserve(campaignId);
    try {
      const res = await fetch("/api/reserves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Reserve refreshed: ${data.data.reserve}`);
        fetchCampaigns();
      } else {
        alert(data.error || "Failed to refresh reserve");
      }
    } catch (err) {
      console.error("Failed to refresh reserve:", err);
      alert("Failed to refresh reserve");
    }
    setRefreshingReserve(null);
  };

  const columns = [
    {
      key: "name",
      header: "Campaign",
      render: (c: Campaign) => (
        <div>
          <div className={styles.tokenDisplay}>
            <span className={styles.tokenSymbol}>{c.name}</span>
            {c.isPaused && <span className={`${styles.statusBadge} ${styles.statusPaused}`}>Paused</span>}
          </div>
        </div>
      ),
    },
    {
      key: "trenches",
      header: "Trenches",
      render: (c: Campaign) => (c.trenchIds || []).map((t) => t.toUpperCase()).join(", ") || "-",
    },
    {
      key: "token",
      header: "Token",
      render: (c: Campaign) => (
        <div className={styles.tokenDisplay}>
          <span className={styles.tokenSymbol}>{c.tokenSymbol}</span>
          <span className={styles.tokenChain}>{c.chainName}</span>
        </div>
      ),
    },
    {
      key: "reserves",
      header: "Reserves",
      render: (c: Campaign) => (
        <div className={styles.reserveCell}>
          <span>{c.reserveCachedBalance || "-"}</span>
          <button
            className={styles.refreshBtn}
            onClick={(e) => {
              e.stopPropagation();
              handleRefreshReserve(c.id);
            }}
            disabled={refreshingReserve === c.id}
            title="Refresh reserve"
          >
            {refreshingReserve === c.id ? "..." : "↻"}
          </button>
        </div>
      ),
    },
    {
      key: "roi",
      header: "ROI",
      render: (c: Campaign) => `${c.roiMultiplier}x`,
    },
    {
      key: "price",
      header: "Price",
      render: (c: Campaign) =>
        c.manualPrice ? `$${Number(c.manualPrice).toFixed(4)}` : c.useOracle ? c.oracleSource : "-",
    },
    {
      key: "status",
      header: "Status",
      render: (c: Campaign) => (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <span className={`${styles.statusBadge} ${c.isHidden ? styles.statusHidden : styles.statusActive}`}>
            {c.isHidden ? "Hidden" : "Visible"}
          </span>
          {c.isPaused && (
            <span className={`${styles.statusBadge} ${styles.statusPaused}`}>
              Paused
            </span>
          )}
        </div>
      ),
    },
  ];

  const actions = [
    {
      label: "View",
      onClick: (c: Campaign) => setSelectedCampaignId(c.id),
    },
    {
      label: (c: Campaign) => c.isHidden ? "Show" : "Hide",
      onClick: handleToggleVisibility,
    },
    {
      label: (c: Campaign) => c.isPaused ? "Resume" : "Pause",
      variant: (c: Campaign) => c.isPaused ? "primary" : ("danger" as const),
      onClick: handlePauseResume,
    },
    {
      label: "Edit",
      variant: "primary" as const,
      onClick: handleEdit,
    },
    {
      label: "Delete",
      variant: "danger" as const,
      onClick: handleDelete,
    },
  ];

  return (
    <AdminLayout pageTitle="Campaigns">
      <div className={styles.page}>
        <PageHeader
          title="Campaign Management"
          subtitle="Create and manage spray campaigns"
          actions={[
            {
              label: "+ New Campaign",
              variant: "primary",
              onClick: handleNew,
            },
          ]}
        />

        <DataTable
          columns={columns}
          data={campaigns}
          keyExtractor={(c) => c.id}
          actions={actions}
          loading={loading}
          emptyMessage="No campaigns yet"
          emptySubtitle="Create your first campaign to get started"
        />

        {/* Campaign Detail Modal */}
        <CampaignDetailModal
          campaignId={selectedCampaignId}
          onClose={() => setSelectedCampaignId(null)}
        />

        {/* Create/Edit Modal */}
        {showModal && (
          <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>
                  {editingCampaign ? "Edit Campaign" : "Create Campaign"}
                </h2>
                <button className={styles.modalClose} onClick={() => setShowModal(false)}>
                  ×
                </button>
              </div>

              <div className={styles.modalContent}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Campaign Name</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., BLT Rapid Spray"
                    />
                  </div>

                  <div className={styles.formGroupFull}>
                    <label className={styles.formLabel}>Token</label>
                    <div className={styles.trenchTags}>
                      {PRESET_TOKENS.map((token, idx) => (
                        <button
                          key={`${token.symbol}-${token.chainId}-${idx}`}
                          type="button"
                          className={`${styles.trenchTag} ${
                            formData.tokenSymbol === token.symbol && formData.chainId === token.chainId
                              ? styles.trenchTagActive
                              : ""
                          }`}
                          onClick={() => selectPresetToken(token)}
                          title={`${token.symbol} on ${token.chainName}`}
                        >
                          {token.symbol} ({token.chainName})
                        </button>
                      ))}
                    </div>
                    <input
                      type="hidden"
                      value={formData.tokenAddress}
                      onChange={(e) => setFormData({ ...formData, tokenAddress: e.target.value })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Chain</label>
                    <select
                      className={styles.formSelect}
                      value={formData.chainId}
                      onChange={(e) => setFormData({ ...formData, chainId: parseInt(e.target.value) })}
                    >
                      {CHAIN_OPTIONS.map((chain) => (
                        <option key={chain.id} value={chain.id}>
                          {chain.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>ROI Multiplier</label>
                    <input
                      type="number"
                      step="0.1"
                      className={styles.formInput}
                      value={formData.roiMultiplier}
                      onChange={(e) =>
                        setFormData({ ...formData, roiMultiplier: parseFloat(e.target.value) || 1.5 })
                      }
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Manual Price <span>(USD)</span>
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      className={styles.formInput}
                      value={formData.manualPrice}
                      onChange={(e) => setFormData({ ...formData, manualPrice: e.target.value })}
                      placeholder="Leave empty to use oracle"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Oracle Source</label>
                    <select
                      className={styles.formSelect}
                      value={formData.oracleSource}
                      onChange={(e) =>
                        setFormData({ ...formData, oracleSource: e.target.value, useOracle: e.target.value !== "manual" })
                      }
                    >
                      <option value="manual">Manual</option>
                      <option value="coingecko">CoinGecko</option>
                      <option value="dexscreener">DexScreener</option>
                    </select>
                  </div>

                  <div className={styles.formGroupFull}>
                    <label className={styles.formLabel}>Trenches</label>
                    <div className={styles.trenchTags}>
                      {TRENCH_OPTIONS.map((trench) => (
                        <button
                          key={trench.id}
                          type="button"
                          className={`${styles.trenchTag} ${formData.trenchIds.includes(trench.id) ? styles.trenchTagActive : ""}`.trim()}
                          onClick={() => toggleTrench(trench.id)}
                        >
                          {trench.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.formGroupFull}>
                    <label className={styles.formLabel}>Visibility</label>
                    <div className={styles.checkboxGroup}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        />
                        Active (accepting deposits)
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={formData.isHidden}
                          onChange={(e) => setFormData({ ...formData, isHidden: e.target.checked })}
                        />
                        Hidden from homepage
                      </label>
                    </div>
                  </div>

                  <div className={styles.formGroupFull}>
                    <label className={styles.formLabel}>Waitlist Settings</label>
                    <div className={styles.formGrid} style={{ marginTop: "0.5rem" }}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>
                          Campaign Starts At <span>(optional)</span>
                        </label>
                        <input
                          type="datetime-local"
                          className={styles.formInput}
                          value={formData.startsAt}
                          onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                        />
                        <span className={styles.formHint}>Leave empty to start immediately</span>
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Payout Interval (seconds)</label>
                        <input
                          type="number"
                          min={1}
                          className={styles.formInput}
                          value={formData.payoutIntervalSeconds}
                          onChange={(e) =>
                            setFormData({ ...formData, payoutIntervalSeconds: parseInt(e.target.value) || 5 })
                          }
                        />
                      </div>
                    </div>
                    <div className={styles.checkboxGroup} style={{ marginTop: "0.75rem" }}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={formData.acceptDepositsBeforeStart}
                          onChange={(e) =>
                            setFormData({ ...formData, acceptDepositsBeforeStart: e.target.checked })
                          }
                        />
                        Accept deposits before campaign starts (ACCEPTING phase)
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  className={styles.modalClose}
                  style={{ padding: "0.5rem 1rem", width: "auto" }}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  className={styles.modalClose}
                  style={{
                    padding: "0.5rem 1.5rem",
                    width: "auto",
                    background: "var(--accent-primary)",
                    color: "var(--bg-primary)",
                    borderColor: "var(--accent-primary)",
                  }}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving..." : editingCampaign ? "Save Changes" : "Create Campaign"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
