"use client";

import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import styles from "../deposits/page.module.css";

interface Submission {
  id: string;
  contentUrl: string;
  platform: string;
  viewCount: number | null;
  status: string;
  createdAt: string;
  user: {
    handle: string;
  };
  campaign: {
    brand: string;
    name: string;
  };
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      // This endpoint might not exist yet, so handle gracefully
      const res = await fetch("/api/admin/content-submissions");
      if (res.ok) {
        const data = await res.json();
        if (data.data) setSubmissions(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch submissions:", err);
    }
    setLoading(false);
  };

  const handleApprove = async (submission: Submission) => {
    try {
      await fetch(`/api/admin/content-submissions/${submission.id}/approve`, { method: "POST" });
      fetchSubmissions();
    } catch (err) {
      console.error("Failed to approve submission:", err);
    }
  };

  const handleReject = async (submission: Submission) => {
    try {
      await fetch(`/api/admin/content-submissions/${submission.id}/reject`, { method: "POST" });
      fetchSubmissions();
    } catch (err) {
      console.error("Failed to reject submission:", err);
    }
  };

  const columns = [
    {
      key: "user",
      header: "User",
      render: (s: Submission) => `@${s.user?.handle || "Unknown"}`,
    },
    {
      key: "campaign",
      header: "Campaign",
      render: (s: Submission) => `${s.campaign?.brand} - ${s.campaign?.name}`,
    },
    { key: "platform", header: "Platform", render: (s: Submission) => s.platform },
    {
      key: "url",
      header: "URL",
      render: (s: Submission) => (
        <a href={s.contentUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-primary)" }}>
          View Content
        </a>
      ),
    },
    {
      key: "views",
      header: "Views",
      render: (s: Submission) => s.viewCount?.toLocaleString() || "-",
    },
    {
      key: "status",
      header: "Status",
      render: (s: Submission) => (
        <span
          className={`${styles.statusBadge} ${
            s.status === "approved"
              ? styles.statusConfirmed
              : s.status === "rejected"
              ? styles.statusFailed
              : styles.statusPending
          }`}
        >
          {s.status}
        </span>
      ),
    },
  ];

  const actions = [
    {
      label: "Approve",
      variant: "primary" as const,
      onClick: handleApprove,
      condition: (s: Submission) => s.status === "pending",
    },
    {
      label: "Reject",
      variant: "danger" as const,
      onClick: handleReject,
      condition: (s: Submission) => s.status === "pending",
    },
  ];

  return (
    <AdminLayout pageTitle="Submissions">
      <div className={styles.page}>
        <PageHeader
          title="Content Submissions"
          subtitle="Review and approve user content submissions"
          actions={[
            {
              label: "↻ Refresh",
              variant: "secondary",
              onClick: fetchSubmissions,
              icon: "↻",
            },
          ]}
        />

        <DataTable
          columns={columns}
          data={submissions}
          keyExtractor={(s) => s.id}
          actions={actions}
          loading={loading}
          emptyMessage="No submissions to review"
          emptySubtitle="User content submissions will appear here for approval"
        />

        {!loading && submissions.length === 0 && (
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-primary)",
              borderRadius: "var(--radius-lg)",
              padding: "2rem",
              textAlign: "center",
              marginTop: "1rem",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📝</div>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>
              Review Queue
            </h3>
            <p style={{ color: "var(--text-secondary)" }}>
              When users submit content for brand campaigns, they will appear here for your review.
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
