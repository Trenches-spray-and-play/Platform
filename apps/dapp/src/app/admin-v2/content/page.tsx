"use client";

import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import styles from "../campaigns/page.module.css";

interface ContentCampaign {
  id: string;
  brand: string;
  name: string;
  description: string | null;
  platforms: string[];
  beliefPointsPer1k: number;
  usdPer1k: number | null;
  budgetUsd: number | null;
  spentUsd: number;
  icon: string | null;
  isActive: boolean;
  submissions: number;
}

const PLATFORM_OPTIONS = ["X", "TT", "IG", "YT"];

export default function ContentPage() {
  const [campaigns, setCampaigns] = useState<ContentCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<ContentCampaign | null>(null);
  const [formData, setFormData] = useState({
    brand: "",
    name: "",
    description: "",
    platforms: [] as string[],
    beliefPointsPer1k: 1.5,
    usdPer1k: "",
    budgetUsd: "",
    icon: "",
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/content-campaigns");
      const data = await res.json();
      if (data.success) setCampaigns(data.data);
    } catch (err) {
      console.error("Failed to fetch content campaigns:", err);
    }
    setLoading(false);
  };

  const togglePlatform = (platform: string) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const handleSave = async () => {
    try {
      const method = editingCampaign ? "PUT" : "POST";
      const body = {
        ...(editingCampaign ? { id: editingCampaign.id } : {}),
        brand: formData.brand,
        name: formData.name,
        description: formData.description || null,
        platforms: formData.platforms,
        beliefPointsPer1k: formData.beliefPointsPer1k,
        usdPer1k: formData.usdPer1k ? parseFloat(formData.usdPer1k) : null,
        budgetUsd: formData.budgetUsd ? parseFloat(formData.budgetUsd) : null,
        icon: formData.icon || null,
      };
      const res = await fetch("/api/admin/content-campaigns", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowModal(false);
        fetchCampaigns();
      }
    } catch (err) {
      console.error("Failed to save content campaign:", err);
    }
  };

  const handleDelete = async (c: ContentCampaign) => {
    if (!confirm("Deactivate this campaign?")) return;
    try {
      await fetch(`/api/admin/content-campaigns?id=${c.id}`, { method: "DELETE" });
      fetchCampaigns();
    } catch (err) {
      console.error("Failed to delete campaign:", err);
    }
  };

  const columns = [
    {
      key: "brand",
      header: "Brand",
      render: (c: ContentCampaign) => (
        <span>
          {c.icon && <span style={{ marginRight: "0.5rem" }}>{c.icon}</span>}
          {c.brand}
        </span>
      ),
    },
    { key: "name", header: "Campaign", render: (c: ContentCampaign) => c.name },
    {
      key: "platforms",
      header: "Platforms",
      render: (c: ContentCampaign) => c.platforms.join(", "),
    },
    {
      key: "reward",
      header: "Belief/1k",
      render: (c: ContentCampaign) => `+${c.beliefPointsPer1k}`,
    },
    {
      key: "submissions",
      header: "Submissions",
      render: (c: ContentCampaign) => c.submissions,
    },
    {
      key: "status",
      header: "Status",
      render: (c: ContentCampaign) => (
        <span className={`${styles.statusBadge} ${c.isActive ? styles.statusActive : styles.statusHidden}`}>
          {c.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  const actions = [
    {
      label: "Edit",
      variant: "primary" as const,
      onClick: (c: ContentCampaign) => {
        setEditingCampaign(c);
        setFormData({
          brand: c.brand,
          name: c.name,
          description: c.description || "",
          platforms: c.platforms,
          beliefPointsPer1k: c.beliefPointsPer1k,
          usdPer1k: c.usdPer1k?.toString() || "",
          budgetUsd: c.budgetUsd?.toString() || "",
          icon: c.icon || "",
        });
        setShowModal(true);
      },
    },
    { label: "Deactivate", variant: "danger" as const, onClick: handleDelete, condition: (c: ContentCampaign) => c.isActive },
  ];

  return (
    <AdminLayout pageTitle="Content">
      <div className={styles.page}>
        <PageHeader
          title="Content Campaigns"
          subtitle="Manage brand content syndication campaigns"
          actions={[
            {
              label: "+ New Campaign",
              variant: "primary",
              onClick: () => {
                setEditingCampaign(null);
                setFormData({ brand: "", name: "", description: "", platforms: [], beliefPointsPer1k: 1.5, usdPer1k: "", budgetUsd: "", icon: "" });
                setShowModal(true);
              },
            },
          ]}
        />

        <DataTable
          columns={columns}
          data={campaigns}
          keyExtractor={(c) => c.id}
          actions={actions}
          loading={loading}
          emptyMessage="No content campaigns"
          emptySubtitle="Create campaigns for users to create branded content"
        />

        {showModal && (
          <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>{editingCampaign ? "Edit Campaign" : "New Content Campaign"}</h2>
                <button className={styles.modalClose} onClick={() => setShowModal(false)}>×</button>
              </div>
              <div className={styles.modalContent}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Brand</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="e.g., MetaWin"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Campaign Name</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Elite Clipping"
                    />
                  </div>
                  <div className={styles.formGroupFull}>
                    <label className={styles.formLabel}>Platforms</label>
                    <div className={styles.checkboxGroup}>
                      {PLATFORM_OPTIONS.map((p) => (
                        <label key={p} className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={formData.platforms.includes(p)}
                            onChange={() => togglePlatform(p)}
                          />
                          {p}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Belief Points / 1k Views</label>
                    <input
                      type="number"
                      step="0.1"
                      className={styles.formInput}
                      value={formData.beliefPointsPer1k}
                      onChange={(e) => setFormData({ ...formData, beliefPointsPer1k: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Icon (Emoji)</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="🎮"
                    />
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button className={styles.modalClose} style={{ padding: "0.5rem 1rem", width: "auto" }} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button
                  className={styles.modalClose}
                  style={{ padding: "0.5rem 1.5rem", width: "auto", background: "var(--accent-primary)", color: "var(--bg-primary)", borderColor: "var(--accent-primary)" }}
                  onClick={handleSave}
                >
                  {editingCampaign ? "Save Changes" : "Create Campaign"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
