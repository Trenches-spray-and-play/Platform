"use client";

import { useEffect, useState, useCallback } from "react";
import AdminLayout from "../components/AdminLayout";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import UserDetailModal from "../components/modals/UserDetailModal";
import styles from "./page.module.css";
import { parseApiError, debounce } from "../lib/errors";

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
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const ITEMS_PER_PAGE = 20;

  // Debounced search function
  const debouncedFetchUsers = useCallback(
    debounce((searchTerm: string, currentPage: number) => {
      fetchUsers(searchTerm, currentPage);
    }, 300),
    []
  );

  useEffect(() => {
    debouncedFetchUsers(search, page);
  }, [page, search, debouncedFetchUsers]);

  const fetchUsers = async (searchTerm = search, currentPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/users?search=${encodeURIComponent(searchTerm)}&page=${currentPage}&limit=${ITEMS_PER_PAGE}`
      );
      if (!res.ok) {
        const errorMsg = await parseApiError(res);
        throw new Error(errorMsg);
      }
      const data = await res.json();
      // Handle { data: [], meta: {} } format
      const users = data.data || [];
      if (Array.isArray(users)) {
        setUsers(users);
        setTotal(data.meta?.total || users.length);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load users";
      setError(message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setPage(1);
    fetchUsers(search, 1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Bulk selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === users.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(users.map((u) => u.id)));
    }
  };

  const toggleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkBan = async () => {
    if (selectedIds.size === 0) return;
    const reason = prompt(`Enter ban reason for ${selectedIds.size} users:`);
    if (!reason) return;

    setBulkActionLoading(true);
    try {
      const res = await fetch("/api/admin/users/bulk-ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: Array.from(selectedIds), reason }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`${selectedIds.size} users banned successfully`);
        setSelectedIds(new Set());
        fetchUsers();
      } else {
        alert(data.error || "Failed to ban users");
      }
    } catch (err) {
      alert("Failed to ban users");
    }
    setBulkActionLoading(false);
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Handle", "Email", "Balance", "Belief Score", "Positions", "Waitlists", "Joined"];
    const rows = users.map((u) => [
      u.id,
      u.handle,
      u.email || "",
      u.balance,
      u.beliefScore,
      u._count.participants,
      u._count.campaignWaitlists,
      new Date(u.createdAt).toISOString(),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const columns = [
    {
      key: "select",
      header: (
        <input
          type="checkbox"
          checked={users.length > 0 && selectedIds.size === users.length}
          onChange={toggleSelectAll}
        />
      ),
      width: "40px",
      render: (u: User) => (
        <input
          type="checkbox"
          checked={selectedIds.has(u.id)}
          onChange={() => toggleSelectUser(u.id)}
        />
      ),
    },
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
          actions={[
            {
              label: "📥 Export CSV",
              variant: "secondary",
              onClick: handleExportCSV,
            },
          ]}
        />

        {/* Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <div className={styles.bulkActionsBar}>
            <span className={styles.bulkCount}>{selectedIds.size} selected</span>
            <div className={styles.bulkButtons}>
              <button
                className={styles.bulkBtn}
                onClick={() => setSelectedIds(new Set())}
                disabled={bulkActionLoading}
              >
                Clear
              </button>
              <button
                className={`${styles.bulkBtn} ${styles.bulkBtnDanger}`}
                onClick={handleBulkBan}
                disabled={bulkActionLoading}
              >
                {bulkActionLoading ? "..." : "Ban Selected"}
              </button>
            </div>
          </div>
        )}

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
              onClick={() => fetchUsers()}
              style={{ marginLeft: "1rem", textDecoration: "underline", cursor: "pointer" }}
            >
              Retry
            </button>
          </div>
        )}

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
        <UserDetailModal
          userId={selectedUser?.id || null}
          onClose={() => setSelectedUser(null)}
        />
      </div>
    </AdminLayout>
  );
}
