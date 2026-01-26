"use client";

import { useState, useEffect } from 'react';
import styles from '../../app/admin/admin.module.css';

interface Raid {
    id: string;
    title: string;
    platform: string;
    url: string;
    reward: number;
    isActive: boolean;
    completions: number;
    createdAt: string;
    expiresAt: string | null;
}

const PLATFORM_OPTIONS = ['X', 'TT', 'IG', 'YT'];

const emptyRaid = {
    title: '',
    platform: 'X',
    url: '',
    reward: 50,
    expiresAt: ''
};

export default function RaidsManager() {
    const [raids, setRaids] = useState<Raid[]>([]);
    const [editRaid, setEditRaid] = useState<typeof emptyRaid>(emptyRaid);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        fetchRaids();
    }, []);

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const fetchRaids = async () => {
        try {
            const res = await fetch('/api/admin/raids');
            const data = await res.json();
            if (data.success) {
                setRaids(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch raids:', err);
        }
    };

    const handleNew = () => {
        setEditRaid(emptyRaid);
        setEditingId(null);
        setShowForm(true);
    };

    const handleEdit = (raid: Raid) => {
        setEditRaid({
            title: raid.title,
            platform: raid.platform,
            url: raid.url,
            reward: raid.reward,
            expiresAt: raid.expiresAt ? raid.expiresAt.slice(0, 16) : ''
        });
        setEditingId(raid.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deactivate this raid?')) return;
        try {
            await fetch(`/api/admin/raids?id=${id}`, { method: 'DELETE' });
            fetchRaids();
            setMessage('Raid deactivated');
        } catch (err) {
            setMessage('Failed to delete raid');
        }
    };

    const saveRaid = async () => {
        setSaving(true);
        try {
            const method = editingId ? 'PUT' : 'POST';
            const body = editingId
                ? { id: editingId, ...editRaid }
                : editRaid;

            const res = await fetch('/api/admin/raids', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.success) {
                setMessage(editingId ? 'Raid updated!' : 'Raid created!');
                setShowForm(false);
                fetchRaids();
            } else {
                setMessage('Error: ' + data.error);
            }
        } catch (err) {
            setMessage('Failed to save raid');
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className={styles.section}>
            {message && <div className={styles.message}>{message}</div>}

            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>RAID CAMPAIGNS</h2>
                <button className={styles.addBtn} onClick={handleNew}>+ NEW RAID</button>
            </div>

            {showForm && (
                <div className={styles.formCard}>
                    <div className={styles.formHeader}>
                        <h3 className={styles.formTitle}>{editingId ? 'EDIT RAID' : 'BLAST NEW RAID'}</h3>
                        <p className={styles.formSubtitle}>Define social target and BP reward</p>
                    </div>
                    <div className={styles.configGrid}>
                        <div className={styles.configItem}>
                            <label className={styles.configLabel}>Raid Title</label>
                            <input
                                type="text"
                                className={styles.configInput}
                                value={editRaid.title}
                                onChange={(e) => setEditRaid({ ...editRaid, title: e.target.value })}
                                placeholder="e.g., MetaWin Round 3 Announcement"
                            />
                        </div>
                        <div className={styles.configItem}>
                            <label className={styles.configLabel}>Platform</label>
                            <select
                                className={styles.configSelect}
                                value={editRaid.platform}
                                onChange={(e) => setEditRaid({ ...editRaid, platform: e.target.value })}
                            >
                                {PLATFORM_OPTIONS.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.configItem} style={{ gridColumn: 'span 2' }}>
                            <label className={styles.configLabel}>Target URL</label>
                            <input
                                type="url"
                                className={styles.configInput}
                                value={editRaid.url}
                                onChange={(e) => setEditRaid({ ...editRaid, url: e.target.value })}
                                placeholder="https://x.com/..."
                            />
                        </div>
                        <div className={styles.configItem}>
                            <label className={styles.configLabel}>BP Reward</label>
                            <input
                                type="number"
                                className={styles.configInput}
                                value={editRaid.reward}
                                onChange={(e) => setEditRaid({ ...editRaid, reward: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className={styles.configItem}>
                            <label className={styles.configLabel}>Expires At (Optional)</label>
                            <input
                                type="datetime-local"
                                className={styles.configInput}
                                value={editRaid.expiresAt}
                                onChange={(e) => setEditRaid({ ...editRaid, expiresAt: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className={styles.formActions}>
                        <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>CANCEL</button>
                        <button className={styles.saveBtn} onClick={saveRaid} disabled={saving}>
                            {saving ? 'SAVING...' : editingId ? 'UPDATE' : 'BLAST RAID'}
                        </button>
                    </div>
                </div>
            )}

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Platform</th>
                            <th>Reward</th>
                            <th>Completions</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {raids.map(raid => (
                            <tr key={raid.id} style={{ opacity: raid.isActive ? 1 : 0.5 }}>
                                <td>
                                    <a href={raid.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-rapid)' }}>
                                        {raid.title}
                                    </a>
                                </td>
                                <td>{raid.platform}</td>
                                <td style={{ color: 'var(--accent-rapid)' }}>+{raid.reward} BP</td>
                                <td>{raid.completions}</td>
                                <td>
                                    <span style={{ color: raid.isActive ? '#00ff66' : '#ff4444' }}>
                                        {raid.isActive ? 'ACTIVE' : 'INACTIVE'}
                                    </span>
                                </td>
                                <td>
                                    <button className={styles.editBtn} onClick={() => handleEdit(raid)}>EDIT</button>
                                    {raid.isActive && (
                                        <button className={styles.deleteBtn} onClick={() => handleDelete(raid.id)}>DEACTIVATE</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {raids.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', opacity: 0.5 }}>No raids yet</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
