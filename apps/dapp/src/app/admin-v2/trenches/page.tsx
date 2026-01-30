"use client";

import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import styles from "../deposits/page.module.css";

interface Trench {
  id: string;
  name: string;
  level: string;
  entrySize: number;
  usdEntry: number;
  cadence: string;
  reserves: string;
  active: boolean;
  _count?: { participants: number };
}

const USD_CAPS: Record<string, { min: number; max: number }> = {
  RAPID: { min: 5, max: 1000 },
  MID: { min: 100, max: 10000 },
  DEEP: { min: 1000, max: 100000 },
};

export default function TrenchesPage() {
  const [trenches, setTrenches] = useState<Trench[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrenches();
  }, []);

  const fetchTrenches = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/trenches");
      const data = await res.json();
      // Handle { data: [] } format
      const trenches = data.data || [];
      if (Array.isArray(trenches)) setTrenches(trenches);
    } catch (err) {
      console.error("Failed to fetch trenches:", err);
    }
    setLoading(false);
  };

  const columns = [
    {
      key: "level",
      header: "Level",
      render: (t: Trench) => (
        <span style={{ fontWeight: 600, textTransform: "uppercase" }}>{t.level}</span>
      ),
    },
    {
      key: "usdCap",
      header: "USD Cap",
      render: (t: Trench) => {
        const caps = USD_CAPS[t.level.toUpperCase()] || { min: 5, max: 1000 };
        return `$${caps.min.toLocaleString()} - $${caps.max.toLocaleString()}`;
      },
    },
    {
      key: "cadence",
      header: "Cadence",
      render: (t: Trench) => t.cadence,
    },
    {
      key: "participants",
      header: "Participants",
      render: (t: Trench) => t._count?.participants || 0,
    },
    {
      key: "status",
      header: "Status",
      render: (t: Trench) => (
        <span className={`${styles.statusBadge} ${t.active ? styles.statusConfirmed : styles.statusFailed}`}>
          {t.active ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout pageTitle="Trenches">
      <div className={styles.page}>
        <PageHeader
          title="Trench Control"
          subtitle="View and monitor trench configurations"
        />

        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-primary)",
            borderRadius: "var(--radius-lg)",
            padding: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <h3
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: "0.5rem",
            }}
          >
            About Trenches
          </h3>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Trenches define entry ranges and cadences for spray campaigns. Each level (Rapid, Mid, Deep) 
            has different USD caps and participant limits. Configure campaigns to target specific trenches.
          </p>
        </div>

        <DataTable
          columns={columns}
          data={trenches}
          keyExtractor={(t) => t.id}
          loading={loading}
          emptyMessage="No trenches configured"
        />
      </div>
    </AdminLayout>
  );
}
