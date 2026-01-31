"use client";

import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";
import styles from "./page.module.css";
import { parseApiError } from "../lib/errors";

interface Deposit {
  id: string;
  chain: string;
  amount: string;
  token: string;
  usdValue: number;
  txHash: string | null;
  status: string;
  createdAt: string;
  user: {
    id: string;
    handle: string;
  };
}

interface PlatformBalance {
  byChain: Record<
    string,
    {
      totalDeposits: number;
      depositCount: number;
      sweptAmount: number;
      unsweptAmount: number;
      unsweptCount: number;
      cachedWalletBalance: number;
    }
  >;
  totals: {
    totalDepositsUsd: number;
    sweptUsd: number;
    unsweptUsd: number;
    pendingCount: number;
  };
}

const ITEMS_PER_PAGE = 50;

export default function DepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [balance, setBalance] = useState<PlatformBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [page]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [depositsRes, balanceRes] = await Promise.all([
        fetch(`/api/admin/deposits?page=${page}&limit=${ITEMS_PER_PAGE}`),
        fetch("/api/admin/balance"),
      ]);

      if (!depositsRes.ok) {
        const errorMsg = await parseApiError(depositsRes);
        throw new Error(errorMsg);
      }

      const depositsData = await depositsRes.json();
      const balanceData = await balanceRes.json();

      // Handle different API response formats
      const deposits = depositsData.data || depositsData || [];
      if (Array.isArray(deposits)) {
        setDeposits(deposits);
        setTotal(depositsData.meta?.total || deposits.length);
      }
      
      const balance = balanceData.data || balanceData;
      if (balance && (balance.totals || balance.byChain)) {
        setBalance(balance);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load deposits";
      setError(message);
      setDeposits([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateTxHash = (hash: string | null) => {
    if (!hash) return "-";
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  const columns = [
    {
      key: "user",
      header: "User",
      render: (d: Deposit) => `@${d.user?.handle || "Unknown"}`,
    },
    {
      key: "chain",
      header: "Chain",
      render: (d: Deposit) => d.chain.toUpperCase(),
    },
    {
      key: "token",
      header: "Token",
      render: (d: Deposit) => d.token,
    },
    {
      key: "amount",
      header: "Amount",
      render: (d: Deposit) => d.amount,
    },
    {
      key: "usd",
      header: "USD Value",
      render: (d: Deposit) => `$${Number(d.usdValue).toFixed(2)}`,
    },
    {
      key: "status",
      header: "Status",
      render: (d: Deposit) => (
        <span
          className={`${styles.statusBadge} ${
            d.status === "confirmed"
              ? styles.statusConfirmed
              : d.status === "pending"
              ? styles.statusPending
              : styles.statusFailed
          }`}
        >
          {d.status}
        </span>
      ),
    },
    {
      key: "tx",
      header: "Transaction",
      render: (d: Deposit) => truncateTxHash(d.txHash),
    },
    {
      key: "date",
      header: "Date",
      render: (d: Deposit) => formatDate(d.createdAt),
    },
  ];

  return (
    <AdminLayout pageTitle="Deposits">
      <div className={styles.page}>
        <PageHeader
          title="Deposit Management"
          subtitle={`${total.toLocaleString()} total deposits`}
          actions={[
            {
              label: refreshing ? "Refreshing..." : "Refresh",
              variant: "secondary",
              onClick: handleRefresh,
              icon: "↻",
              loading: refreshing,
            },
          ]}
        />

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
              onClick={fetchData}
              style={{ marginLeft: "1rem", textDecoration: "underline", cursor: "pointer" }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Balance Stats */}
        <div className={styles.statsGrid}>
          <StatCard
            label="Total Deposits (USD)"
            value={`$${Number(balance?.totals?.totalDepositsUsd || 0).toFixed(2)}`}
            icon="💰"
            variant="accent"
            size="compact"
          />
          <StatCard
            label="Unswept Funds"
            value={`$${Number(balance?.totals?.unsweptUsd || 0).toFixed(2)}`}
            icon="⏳"
            variant="warning"
            size="compact"
            subValue={`${balance?.totals?.pendingCount || 0} pending`}
          />
          <StatCard
            label="Swept Funds"
            value={`$${Number(balance?.totals?.sweptUsd || 0).toFixed(2)}`}
            icon="✓"
            variant="info"
            size="compact"
          />
          {balance?.byChain && typeof balance.byChain === 'object' &&
            Object.entries(balance.byChain).map(([chain, data]: [string, any]) => (
              <StatCard
                key={chain}
                label={`${chain.toUpperCase()} Deposits`}
                value={`$${Number(data?.totalDeposits || 0).toFixed(2)}`}
                icon="🔗"
                variant="default"
                size="compact"
                subValue={`${data?.depositCount || 0} deposits`}
              />
            ))}
        </div>

        <DataTable
          columns={columns}
          data={deposits}
          keyExtractor={(d) => d.id}
          loading={loading}
          emptyMessage="No deposits yet"
          emptySubtitle="Deposits will appear here when users make deposits"
          pagination={{
            currentPage: page,
            totalPages: Math.ceil(total / ITEMS_PER_PAGE),
            onPageChange: setPage,
            totalItems: total,
            itemsPerPage: ITEMS_PER_PAGE,
          }}
        />
      </div>
    </AdminLayout>
  );
}
