"use client";

import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import UserDetailModal from "../components/modals/UserDetailModal";
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
      // Handle { data: [], meta: {} } format
      const users = data.data || [];
      if (Array.isArray(users)) {
        setUsers(users);
        setTotal(data.meta?.total || users.length);
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
        <UserDetailModal
          userId={selectedUser?.id || null}
          onClose={() => setSelectedUser(null)}
        />
      </div>
    </AdminLayout>
  );
}
