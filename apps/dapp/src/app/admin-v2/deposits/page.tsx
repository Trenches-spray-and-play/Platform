"use client";

import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";
import styles from "./page.module.css";

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

export default function DepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [balance, setBalance] = useState<PlatformBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [depositsRes, balanceRes] = await Promise.all([
        fetch("/api/admin/deposits"),
        fetch("/api/admin/balance"),
      ]);

      const depositsData = await depositsRes.json();
      const balanceData = await balanceRes.json();

      // Handle different API response formats
      const deposits = depositsData.data || depositsData || [];
      if (Array.isArray(deposits)) setDeposits(deposits);
      
      const balance = balanceData.data || balanceData;
      if (balance && (balance.totals || balance.byChain)) {
        setBalance(balance);
      }
    } catch (err) {
      console.error("Failed to fetch deposits:", err);
    }
    setLoading(false);
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
          subtitle="Track and monitor platform deposits"
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

        {/* Balance Stats */}
        <div className={styles.statsGrid}>
          <StatCard
            label="Total Deposits (USD)"
            value={`$${(balance?.totals?.totalDepositsUsd || 0).toFixed(2)}`}
            icon="💰"
            variant="accent"
            size="compact"
          />
          <StatCard
            label="Unswept Funds"
            value={`$${(balance?.totals?.unsweptUsd || 0).toFixed(2)}`}
            icon="⏳"
            variant="warning"
            size="compact"
            subValue={`${balance?.totals?.pendingCount || 0} pending`}
          />
          <StatCard
            label="Swept Funds"
            value={`$${(balance?.totals?.sweptUsd || 0).toFixed(2)}`}
            icon="✓"
            variant="info"
            size="compact"
          />
          {balance?.byChain && typeof balance.byChain === 'object' &&
            Object.entries(balance.byChain).map(([chain, data]: [string, any]) => (
              <StatCard
                key={chain}
                label={`${chain.toUpperCase()} Deposits`}
                value={`$${(data?.totalDeposits || 0).toFixed(2)}`}
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
        />
      </div>
    </AdminLayout>
  );
}
