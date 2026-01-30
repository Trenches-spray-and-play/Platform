"use client";

import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import styles from "../campaigns/page.module.css";

interface Task {
  id: string;
  title: string;
  description: string | null;
  reward: number;
  link: string | null;
  taskType: "ONE_TIME" | "RECURRING";
  isActive: boolean;
  order: number;
  _count?: { completions: number };
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    reward: 100,
    link: "",
    taskType: "ONE_TIME" as "ONE_TIME" | "RECURRING",
    isActive: true,
    order: 0,
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tasks");
      const data = await res.json();
      // Handle both { data: [] } and direct array formats
      const tasks = data.data || data;
      if (Array.isArray(tasks)) setTasks(tasks);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    }
    setLoading(false);
  };

  const handleNew = () => {
    setEditingTask(null);
    setFormData({
      title: "",
      description: "",
      reward: 100,
      link: "",
      taskType: "ONE_TIME",
      isActive: true,
      order: tasks.length,
    });
    setShowModal(true);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      reward: task.reward,
      link: task.link || "",
      taskType: task.taskType,
      isActive: task.isActive,
      order: task.order,
    });
    setShowModal(true);
  };

  const handleDelete = async (task: Task) => {
    if (!confirm(`Delete task "${task.title}"? User completions will also be deleted.`)) return;
    try {
      const res = await fetch(`/api/admin/tasks/${task.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success || res.ok) {
        fetchTasks();
      } else {
        alert(data.error || "Failed to delete task");
      }
    } catch (err) {
      console.error("Failed to delete task:", err);
      alert("Failed to delete task");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const method = editingTask ? "PUT" : "POST";
      const url = editingTask ? `/api/admin/tasks/${editingTask.id}` : "/api/admin/tasks";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowModal(false);
        fetchTasks();
      }
    } catch (err) {
      console.error("Failed to save task:", err);
    }
    setSaving(false);
  };

  const columns = [
    { key: "order", header: "Order", render: (t: Task) => t.order },
    { key: "title", header: "Title", render: (t: Task) => t.title },
    {
      key: "type",
      header: "Type",
      render: (t: Task) => (
        <span style={{ color: t.taskType === "RECURRING" ? "var(--warning)" : "var(--info)" }}>
          {t.taskType === "RECURRING" ? "Recurring" : "One-Time"}
        </span>
      ),
    },
    { key: "reward", header: "Reward", render: (t: Task) => `${t.reward} BP` },
    { key: "completions", header: "Completions", render: (t: Task) => t._count?.completions || 0 },
    {
      key: "status",
      header: "Status",
      render: (t: Task) => (
        <span className={`${styles.statusBadge} ${t.isActive ? styles.statusActive : styles.statusHidden}`}>
          {t.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  const actions = [
    { label: "Edit", variant: "primary" as const, onClick: handleEdit },
    { label: "Delete", variant: "danger" as const, onClick: handleDelete },
  ];

  return (
    <AdminLayout pageTitle="Tasks">
      <div className={styles.page}>
        <PageHeader
          title="Task Management"
          subtitle="Create tasks for users to earn Boost Points"
          actions={[{ label: "+ New Task", variant: "primary", onClick: handleNew }]}
        />

        <DataTable
          columns={columns}
          data={tasks}
          keyExtractor={(t) => t.id}
          actions={actions}
          loading={loading}
          emptyMessage="No tasks yet"
          emptySubtitle="Create tasks for users to complete"
        />

        {showModal && (
          <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>{editingTask ? "Edit Task" : "Create Task"}</h2>
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
                      placeholder="e.g., Connect X (Twitter)"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Reward (BP)</label>
                    <input
                      type="number"
                      className={styles.formInput}
                      value={formData.reward}
                      onChange={(e) => setFormData({ ...formData, reward: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Type</label>
                    <select
                      className={styles.formSelect}
                      value={formData.taskType}
                      onChange={(e) => setFormData({ ...formData, taskType: e.target.value as "ONE_TIME" | "RECURRING" })}
                    >
                      <option value="ONE_TIME">One-Time</option>
                      <option value="RECURRING">Recurring</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Order</label>
                    <input
                      type="number"
                      className={styles.formInput}
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className={styles.formGroupFull}>
                    <label className={styles.formLabel}>Description</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description"
                    />
                  </div>
                  <div className={styles.formGroupFull}>
                    <label className={styles.formLabel}>External Link</label>
                    <input
                      type="url"
                      className={styles.formInput}
                      value={formData.link}
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className={styles.formGroupFull}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      />
                      Active (visible to users)
                    </label>
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
                  disabled={saving}
                >
                  {saving ? "Saving..." : editingTask ? "Save Changes" : "Create Task"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
