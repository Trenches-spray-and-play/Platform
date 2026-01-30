"use client";

import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
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

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [saving, setSaving] = useState(false);

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
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/campaigns");
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.data);
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
      if (res.ok) {
        fetchCampaigns();
      }
    } catch (err) {
      console.error("Failed to delete campaign:", err);
    }
  };

  const handleToggleVisibility = async (campaign: Campaign) => {
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: campaign.id, isHidden: !campaign.isHidden }),
      });
      if (res.ok) {
        fetchCampaigns();
      }
    } catch (err) {
      console.error("Failed to toggle visibility:", err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const method = editingCampaign ? "PUT" : "POST";
      const body = {
        ...formData,
        id: editingCampaign?.id,
        manualPrice: formData.manualPrice ? parseFloat(formData.manualPrice) : null,
      };

      const res = await fetch("/api/admin/campaigns", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowModal(false);
        fetchCampaigns();
      }
    } catch (err) {
      console.error("Failed to save campaign:", err);
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
      render: (c: Campaign) => c.trenchIds.map((t) => t.toUpperCase()).join(", ") || "-",
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
      render: (c: Campaign) => c.reserveCachedBalance || "-",
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
        c.manualPrice ? `$${c.manualPrice.toFixed(4)}` : c.useOracle ? c.oracleSource : "-",
    },
    {
      key: "status",
      header: "Status",
      render: (c: Campaign) => (
        <span className={`${styles.statusBadge} ${c.isHidden ? styles.statusHidden : styles.statusActive}`}>
          {c.isHidden ? "Hidden" : "Visible"}
        </span>
      ),
    },
  ];

  const actions = [
    {
      label: (c: Campaign) => c.isHidden ? "Show" : "Hide",
      variant: "default" as const,
      onClick: handleToggleVisibility,
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

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Token Symbol</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={formData.tokenSymbol}
                      onChange={(e) => setFormData({ ...formData, tokenSymbol: e.target.value })}
                      placeholder="e.g., BLT"
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
                          className={`${styles.trenchTag} ${formData.trenchIds.includes(trench.id) ? styles.trenchTagActive : ""
                            }`}
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
