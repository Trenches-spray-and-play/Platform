"use client";

import { useState, useEffect } from 'react';
import styles from '../../app/admin/admin.module.css';

interface ContentCampaign {
    id: string;
    brand: string;
    name: string;
    description: string | null;
    platforms: string[];
    beliefPointsPer1k: number;
    usdPer1k: number | null;
    budgetUsd: number | null;
    spentUsd: number;
    icon: string | null;
    isActive: boolean;
    submissions: number;
    createdAt: string;
}

const PLATFORM_OPTIONS = ['X', 'TT', 'IG', 'YT'];

const emptyCampaign = {
    brand: '',
    name: '',
    description: '',
    platforms: [] as string[],
    beliefPointsPer1k: 1.5,
    usdPer1k: '',
    budgetUsd: '',
    icon: ''
};

export default function ContentCampaignsManager() {
    const [campaigns, setCampaigns] = useState<ContentCampaign[]>([]);
    const [editCampaign, setEditCampaign] = useState<typeof emptyCampaign>(emptyCampaign);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        fetchCampaigns();
    }, []);

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const fetchCampaigns = async () => {
        try {
            const res = await fetch('/api/admin/content-campaigns');
            const data = await res.json();
            if (data.success) {
                setCampaigns(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch content campaigns:', err);
        }
    };

    const handleNew = () => {
        setEditCampaign(emptyCampaign);
        setEditingId(null);
        setShowForm(true);
    };

    const handleEdit = (campaign: ContentCampaign) => {
        setEditCampaign({
            brand: campaign.brand,
            name: campaign.name,
            description: campaign.description || '',
            platforms: campaign.platforms,
            beliefPointsPer1k: campaign.beliefPointsPer1k,
            usdPer1k: campaign.usdPer1k ? String(campaign.usdPer1k) : '',
            budgetUsd: campaign.budgetUsd ? String(campaign.budgetUsd) : '',
            icon: campaign.icon || ''
        });
        setEditingId(campaign.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deactivate this campaign?')) return;
        try {
            await fetch(`/api/admin/content-campaigns?id=${id}`, { method: 'DELETE' });
            fetchCampaigns();
            setMessage('Campaign deactivated');
        } catch (err) {
            setMessage('Failed to delete campaign');
        }
    };

    const togglePlatform = (platform: string) => {
        const current = editCampaign.platforms;
        if (current.includes(platform)) {
            setEditCampaign({ ...editCampaign, platforms: current.filter(p => p !== platform) });
        } else {
            setEditCampaign({ ...editCampaign, platforms: [...current, platform] });
        }
    };

    const saveCampaign = async () => {
        setSaving(true);
        try {
            const method = editingId ? 'PUT' : 'POST';
            const body = {
                ...(editingId ? { id: editingId } : {}),
                brand: editCampaign.brand,
                name: editCampaign.name,
                description: editCampaign.description || null,
                platforms: editCampaign.platforms,
                beliefPointsPer1k: editCampaign.beliefPointsPer1k,
                usdPer1k: editCampaign.usdPer1k ? parseFloat(editCampaign.usdPer1k) : null,
                budgetUsd: editCampaign.budgetUsd ? parseFloat(editCampaign.budgetUsd) : null,
                icon: editCampaign.icon || null
            };

            const res = await fetch('/api/admin/content-campaigns', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.success) {
                setMessage(editingId ? 'Campaign updated!' : 'Campaign created!');
                setShowForm(false);
                fetchCampaigns();
            } else {
                setMessage('Error: ' + data.error);
            }
        } catch (err) {
            setMessage('Failed to save campaign');
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className={styles.section}>
            {message && <div className={styles.message}>{message}</div>}

            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>CONTENT CAMPAIGNS</h2>
                <button className={styles.addBtn} onClick={handleNew}>+ NEW CAMPAIGN</button>
            </div>

            {showForm && (
                <div className={styles.formCard}>
                    <div className={styles.formHeader}>
                        <h3 className={styles.formTitle}>{editingId ? 'EDIT CAMPAIGN' : 'CREATE CONTENT CAMPAIGN'}</h3>
                        <p className={styles.formSubtitle}>Define brand syndication terms and Belief Point rewards</p>
                    </div>
                    <div className={styles.configGrid}>
                        <div className={styles.configItem}>
                            <label className={styles.configLabel}>Brand Name</label>
                            <input
                                type="text"
                                className={styles.configInput}
                                value={editCampaign.brand}
                                onChange={(e) => setEditCampaign({ ...editCampaign, brand: e.target.value })}
                                placeholder="e.g., MetaWin"
                            />
                        </div>
                        <div className={styles.configItem}>
                            <label className={styles.configLabel}>Campaign Name</label>
                            <input
                                type="text"
                                className={styles.configInput}
                                value={editCampaign.name}
                                onChange={(e) => setEditCampaign({ ...editCampaign, name: e.target.value })}
                                placeholder="e.g., Elite Clipping"
                            />
                        </div>
                        <div className={styles.configItem} style={{ gridColumn: 'span 2' }}>
                            <label className={styles.configLabel}>Description (Optional)</label>
                            <textarea
                                className={styles.configInput}
                                value={editCampaign.description}
                                onChange={(e) => setEditCampaign({ ...editCampaign, description: e.target.value })}
                                placeholder="Campaign instructions..."
                                rows={2}
                            />
                        </div>
                        <div className={styles.configItem} style={{ gridColumn: 'span 2' }}>
                            <label className={styles.configLabel}>Allowed Platforms</label>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                {PLATFORM_OPTIONS.map(p => (
                                    <label key={p} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={editCampaign.platforms.includes(p)}
                                            onChange={() => togglePlatform(p)}
                                        />
                                        {p}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className={styles.configItem}>
                            <label className={styles.configLabel}>Belief Points / 1k Views</label>
                            <input
                                type="number"
                                step="0.1"
                                className={styles.configInput}
                                value={editCampaign.beliefPointsPer1k}
                                onChange={(e) => setEditCampaign({ ...editCampaign, beliefPointsPer1k: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div className={styles.configItem}>
                            <label className={styles.configLabel}>USD / 1k Views (Optional)</label>
                            <input
                                type="number"
                                step="0.01"
                                className={styles.configInput}
                                value={editCampaign.usdPer1k}
                                onChange={(e) => setEditCampaign({ ...editCampaign, usdPer1k: e.target.value })}
                                placeholder="0.00"
                            />
                        </div>
                        <div className={styles.configItem}>
                            <label className={styles.configLabel}>Total Budget USD (Optional)</label>
                            <input
                                type="number"
                                className={styles.configInput}
                                value={editCampaign.budgetUsd}
                                onChange={(e) => setEditCampaign({ ...editCampaign, budgetUsd: e.target.value })}
                                placeholder="10000"
                            />
                        </div>
                        <div className={styles.configItem}>
                            <label className={styles.configLabel}>Icon (Emoji)</label>
                            <input
                                type="text"
                                className={styles.configInput}
                                value={editCampaign.icon}
                                onChange={(e) => setEditCampaign({ ...editCampaign, icon: e.target.value })}
                                placeholder="🎮"
                            />
                        </div>
                    </div>
                    <div className={styles.formActions}>
                        <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>CANCEL</button>
                        <button className={styles.saveBtn} onClick={saveCampaign} disabled={saving}>
                            {saving ? 'SAVING...' : editingId ? 'UPDATE' : 'CREATE CAMPAIGN'}
                        </button>
                    </div>
                </div>
            )}

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Brand</th>
                            <th>Campaign</th>
                            <th>Platforms</th>
                            <th>Belief/1k</th>
                            <th>Submissions</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {campaigns.map(c => (
                            <tr key={c.id} style={{ opacity: c.isActive ? 1 : 0.5 }}>
                                <td>
                                    <span style={{ marginRight: '0.5rem' }}>{c.icon}</span>
                                    {c.brand}
                                </td>
                                <td>{c.name}</td>
                                <td>{c.platforms.join(', ')}</td>
                                <td style={{ color: 'var(--accent-deep)' }}>+{c.beliefPointsPer1k}</td>
                                <td>{c.submissions}</td>
                                <td>
                                    <span style={{ color: c.isActive ? '#00ff66' : '#ff4444' }}>
                                        {c.isActive ? 'ACTIVE' : 'INACTIVE'}
                                    </span>
                                </td>
                                <td>
                                    <button className={styles.editBtn} onClick={() => handleEdit(c)}>EDIT</button>
                                    {c.isActive && (
                                        <button className={styles.deleteBtn} onClick={() => handleDelete(c.id)}>DEACTIVATE</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {campaigns.length === 0 && (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', opacity: 0.5 }}>No campaigns yet</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
