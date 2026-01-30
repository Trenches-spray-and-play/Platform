"use client";

import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import styles from "../campaigns/page.module.css";

interface Raid {
  id: string;
  title: string;
  platform: string;
  url: string;
  reward: number;
  isActive: boolean;
  completions: number;
  createdAt: string;
}

const PLATFORM_OPTIONS = ["X", "TT", "IG", "YT"];

export default function RaidsPage() {
  const [raids, setRaids] = useState<Raid[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRaid, setEditingRaid] = useState<Raid | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    platform: "X",
    url: "",
    reward: 50,
    expiresAt: "",
  });

  useEffect(() => {
    fetchRaids();
  }, []);

  const fetchRaids = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/raids");
      const data = await res.json();
      if (data.success) setRaids(data.data);
    } catch (err) {
      console.error("Failed to fetch raids:", err);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    try {
      const method = editingRaid ? "PUT" : "POST";
      const body = editingRaid ? { id: editingRaid.id, ...formData } : formData;
      const res = await fetch("/api/admin/raids", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowModal(false);
        fetchRaids();
      }
    } catch (err) {
      console.error("Failed to save raid:", err);
    }
  };

  const handleDelete = async (raid: Raid) => {
    if (!confirm("Deactivate this raid?")) return;
    try {
      await fetch(`/api/admin/raids?id=${raid.id}`, { method: "DELETE" });
      fetchRaids();
    } catch (err) {
      console.error("Failed to delete raid:", err);
    }
  };

  const columns = [
    { key: "title", header: "Title", render: (r: Raid) => r.title },
    { key: "platform", header: "Platform", render: (r: Raid) => r.platform },
    { key: "reward", header: "Reward", render: (r: Raid) => `${r.reward} BP` },
    { key: "completions", header: "Completions", render: (r: Raid) => r.completions },
    {
      key: "status",
      header: "Status",
      render: (r: Raid) => (
        <span className={`${styles.statusBadge} ${r.isActive ? styles.statusActive : styles.statusHidden}`}>
          {r.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  const actions = [
    {
      label: "Edit",
      variant: "primary" as const,
      onClick: (r: Raid) => {
        setEditingRaid(r);
        setFormData({
          title: r.title,
          platform: r.platform,
          url: r.url,
          reward: r.reward,
          expiresAt: "",
        });
        setShowModal(true);
      },
    },
    { label: "Deactivate", variant: "danger" as const, onClick: handleDelete, condition: (r: Raid) => r.isActive },
  ];

  return (
    <AdminLayout pageTitle="Raids">
      <div className={styles.page}>
        <PageHeader
          title="Raid Campaigns"
          subtitle="Manage social media raid campaigns"
          actions={[
            {
              label: "+ New Raid",
              variant: "primary",
              onClick: () => {
                setEditingRaid(null);
                setFormData({ title: "", platform: "X", url: "", reward: 50, expiresAt: "" });
                setShowModal(true);
              },
            },
          ]}
        />

        <DataTable
          columns={columns}
          data={raids}
          keyExtractor={(r) => r.id}
          actions={actions}
          loading={loading}
          emptyMessage="No raids yet"
          emptySubtitle="Create social media raids for users to complete"
        />

        {showModal && (
          <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>{editingRaid ? "Edit Raid" : "New Raid"}</h2>
                <button className={styles.modalClose} onClick={() => setShowModal(false)}>×</button>
              </div>
              <div className={styles.modalContent}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Title</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Platform</label>
                    <select
                      className={styles.formSelect}
                      value={formData.platform}
                      onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    >
                      {PLATFORM_OPTIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroupFull}>
                    <label className={styles.formLabel}>Target URL</label>
                    <input
                      type="url"
                      className={styles.formInput}
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="https://x.com/..."
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>BP Reward</label>
                    <input
                      type="number"
                      className={styles.formInput}
                      value={formData.reward}
                      onChange={(e) => setFormData({ ...formData, reward: parseInt(e.target.value) || 0 })}
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
                  {editingRaid ? "Save Changes" : "Create Raid"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
