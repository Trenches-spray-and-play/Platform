"use client";

import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import CampaignDetailModal from "../components/modals/CampaignDetailModal";
import styles from "./page.module.css";
import dynamic from "next/dynamic";
import { parseApiError } from "../lib/errors";

const CampaignFormModal = dynamic(() => import("../components/modals/CampaignFormModal"), { ssr: false });

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
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
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
    setError(null);
    try {
      const res = await fetch("/api/admin/campaigns");
      if (!res.ok) {
        const errorMsg = await parseApiError(res);
        throw new Error(errorMsg);
      }
      const data = await res.json();
      // Handle both { success: true, data: [] } and { data: [] } formats
      const campaigns = data.data || data;
      if (Array.isArray(campaigns)) {
        setCampaigns(campaigns);
      } else {
        setCampaigns([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load campaigns";
      setError(message);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setEditingCampaign(null);
    setFormError(null);
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
    setFormError(null);
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

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setFormError("Campaign name is required");
      return false;
    }
    if (!formData.tokenSymbol.trim()) {
      setFormError("Token symbol is required");
      return false;
    }
    if (formData.trenchIds.length === 0) {
      setFormError("At least one trench must be selected");
      return false;
    }
    if (formData.roiMultiplier < 1) {
      setFormError("ROI multiplier must be at least 1.0");
      return false;
    }
    setFormError(null);
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    setFormError(null);
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

      if (!res.ok) {
        const errorMsg = await parseApiError(res);
        throw new Error(errorMsg);
      }

      const data = await res.json();
      if (data.success || data.data) {
        setShowModal(false);
        fetchCampaigns();
      } else {
        throw new Error(data.error || "Failed to save campaign");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save campaign";
      setFormError(message);
    } finally {
      setSaving(false);
    }
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

        {/* Error display for main page */}
        {error && (
          <div style={{ 
            padding: "1rem", 
            background: "rgba(239, 68, 68, 0.1)", 
            border: "1px solid var(--danger)",
            borderRadius: "var(--radius-md)",
            color: "var(--danger)",
            marginBottom: "1rem"
          }}>
            ⚠️ {error}
            <button 
              onClick={fetchCampaigns}
              style={{ marginLeft: "1rem", textDecoration: "underline", cursor: "pointer" }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <CampaignFormModal
            editingCampaign={editingCampaign}
            onClose={() => setShowModal(false)}
            onSave={handleSave}
            saving={saving}
            error={formError}
          />
        )}
      </div>
    </AdminLayout>
  );
}
