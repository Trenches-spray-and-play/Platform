"use client";

import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";
import styles from "../deposits/page.module.css";

interface PayoutStats {
  pending: number;
  executing: number;
  confirmed: number;
  failed: number;
  totalPaidUsd: number;
}

export default function PayoutsPage() {
  const [stats, setStats] = useState<PayoutStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payouts?stats=true");
      const data = await res.json();
      // Handle { success: true, data: {} } format
      if (data.success && data.data) {
        setStats(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch payout stats:", err);
    }
    setLoading(false);
  };

  const handleProcessPayouts = async () => {
    if (!confirm("Process pending payouts?")) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "process", limit: 10 }),
      });
      const data = await res.json();
      if (data.success) {
        fetchStats();
        alert(`Processed ${data.data?.length || 0} payouts`);
      } else {
        alert(data.message || data.error || "Failed to process payouts");
      }
    } catch (err) {
      console.error("Failed to process payouts:", err);
      alert("Failed to process payouts");
    }
    setProcessing(false);
  };

  return (
    <AdminLayout pageTitle="Payouts">
      <div className={styles.page}>
        <PageHeader
          title="Payout Management"
          subtitle="Monitor and process user payouts"
          actions={[
            {
              label: processing ? "Processing..." : "Process Payouts",
              variant: "primary",
              onClick: handleProcessPayouts,
              loading: processing,
              icon: "▶",
            },
          ]}
        />

        <div className={styles.statsGrid}>
          <StatCard
            label="Pending"
            value={stats?.pending || 0}
            icon="⏳"
            variant={stats && stats.pending > 0 ? "warning" : "default"}
            size="compact"
          />
          <StatCard
            label="Executing"
            value={stats?.executing || 0}
            icon="🔄"
            variant="info"
            size="compact"
          />
          <StatCard
            label="Confirmed"
            value={stats?.confirmed || 0}
            icon="✓"
            variant="accent"
            size="compact"
          />
          <StatCard
            label="Failed"
            value={stats?.failed || 0}
            icon="✕"
            variant={stats && stats.failed > 0 ? "danger" : "default"}
            size="compact"
          />
          <StatCard
            label="Total Paid (USD)"
            value={`$${stats?.totalPaidUsd?.toLocaleString() || "0"}`}
            icon="💸"
            variant="accent"
            size="compact"
          />
        </div>

        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-primary)",
            borderRadius: "var(--radius-lg)",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>💸</div>
          <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Detailed Payout History
          </h3>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            Full payout transaction history and logs are available via the API.
          </p>
          <button
            onClick={fetchStats}
            style={{
              padding: "0.625rem 1.25rem",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-primary)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-primary)",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Refresh Stats
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
