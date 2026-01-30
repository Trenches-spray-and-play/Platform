"use client";

import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import styles from "./page.module.css";

interface User {
  id: string;
  handle: string;
  email: string | null;
  beliefScore: number;
  balance: number;
  boostPoints: number;
  createdAt: string;
  walletEvm?: string;
  walletSol?: string;
  referralCode?: string;
  _count: {
    participants: number;
    deposits: number;
    userTasks: number;
    campaignWaitlists: number;
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/users?search=${encodeURIComponent(search)}&page=${page}&limit=${ITEMS_PER_PAGE}`
      );
      const data = await res.json();
      if (data.data) {
        setUsers(data.data);
        setTotal(data.meta?.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
    setLoading(false);
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const truncateWallet = (address?: string) => {
    if (!address) return "Not set";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const columns = [
    {
      key: "handle",
      header: "Handle",
      render: (u: User) => (
        <button className={styles.handleLink} onClick={() => setSelectedUser(u)}>
          @{u.handle}
        </button>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (u: User) => u.email || "-",
    },
    {
      key: "balance",
      header: "Balance",
      render: (u: User) => `$${Number(u.balance || 0).toFixed(2)}`,
    },
    {
      key: "belief",
      header: "Belief",
      render: (u: User) => u.beliefScore.toLocaleString(),
    },
    {
      key: "positions",
      header: "Positions",
      render: (u: User) => `${u._count.participants} / ${u._count.campaignWaitlists}`,
    },
    {
      key: "tasks",
      header: "Tasks",
      render: (u: User) => u._count.userTasks,
    },
    {
      key: "joined",
      header: "Joined",
      render: (u: User) => formatDate(u.createdAt),
    },
  ];

  return (
    <AdminLayout pageTitle="Users">
      <div className={styles.page}>
        <PageHeader
          title="User Management"
          subtitle={`${total.toLocaleString()} total users`}
        />

        <form className={styles.searchBar} onSubmit={handleSearch}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by handle or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <PageHeader
            title=""
            actions={[
              {
                label: "Search",
                variant: "secondary",
                onClick: handleSearch,
              },
            ]}
          />
        </form>

        <DataTable
          columns={columns}
          data={users}
          keyExtractor={(u) => u.id}
          loading={loading}
          emptyMessage="No users found"
          emptySubtitle={search ? "Try a different search term" : "Users will appear here"}
          pagination={{
            currentPage: page,
            totalPages: Math.ceil(total / ITEMS_PER_PAGE),
            onPageChange: setPage,
            totalItems: total,
            itemsPerPage: ITEMS_PER_PAGE,
          }}
        />

        {/* User Detail Modal */}
        {selectedUser && (
          <div className={styles.modalOverlay} onClick={() => setSelectedUser(null)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>User Details</h2>
                <button className={styles.modalClose} onClick={() => setSelectedUser(null)}>
                  ×
                </button>
              </div>

              <div className={styles.modalContent}>
                <div className={styles.profileHeader}>
                  <div className={styles.avatar}>
                    {selectedUser.handle.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.profileInfo}>
                    <div className={styles.profileName}>@{selectedUser.handle}</div>
                    <div className={styles.profileMeta}>
                      Joined {formatDate(selectedUser.createdAt)}
                    </div>
                  </div>
                </div>

                <div className={styles.statsGrid}>
                  <div className={styles.statItem}>
                    <div className={styles.statValue}>
                      ${Number(selectedUser.balance || 0).toFixed(2)}
                    </div>
                    <div className={styles.statLabel}>Balance</div>
                  </div>
                  <div className={styles.statItem}>
                    <div className={styles.statValue}>{selectedUser.beliefScore.toLocaleString()}</div>
                    <div className={styles.statLabel}>Belief Score</div>
                  </div>
                  <div className={styles.statItem}>
                    <div className={styles.statValue}>{selectedUser.boostPoints || 0}</div>
                    <div className={styles.statLabel}>Boost Points</div>
                  </div>
                </div>

                <div className={styles.detailsSection}>
                  <h3 className={styles.detailsTitle}>Account Information</h3>
                  <div className={styles.detailsList}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Email</span>
                      <span className={styles.detailValue}>
                        {selectedUser.email || "Not provided"}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Referral Code</span>
                      <span className={styles.detailValue}>
                        {selectedUser.referralCode || "-"}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Campaign Positions</span>
                      <span className={styles.detailValue}>
                        {selectedUser._count.participants}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Waitlist Entries</span>
                      <span className={styles.detailValue}>
                        {selectedUser._count.campaignWaitlists}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Completed Tasks</span>
                      <span className={styles.detailValue}>{selectedUser._count.userTasks}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.detailsSection}>
                  <h3 className={styles.detailsTitle}>Wallet Addresses</h3>
                  <div className={styles.detailsList}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>EVM Wallet</span>
                      <span className={styles.detailValue}>
                        {truncateWallet(selectedUser.walletEvm)}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Solana Wallet</span>
                      <span className={styles.detailValue}>
                        {truncateWallet(selectedUser.walletSol)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
