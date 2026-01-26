"use client";

import { useEffect, useState } from 'react';
import styles from './admin.module.css';
import Link from 'next/link';
import CampaignForm from '@/components/admin/CampaignForm';
import UserDetailModal from '@/components/admin/UserDetailModal';
import CampaignDetailModal from '@/components/admin/CampaignDetailModal';
import RaidsManager from '@/components/admin/RaidsManager';
import ContentCampaignsManager from '@/components/admin/ContentCampaignsManager';
import ContentSubmissionsManager from '@/components/admin/ContentSubmissionsManager';

interface Campaign {
    id: string;
    name: string;
    trenchIds: string[];
    tokenAddress: string;
    tokenSymbol: string;
    tokenDecimals: number;
    chainId: number;
    chainName: string;
    acceptedTokens: string;
    roiMultiplier: number;
    manualPrice: number | null;
    useOracle: boolean;
    oracleSource: string | null;
    reserveRoundingUnit: number;
    reserveCachedBalance: string | null;
    isHidden: boolean;
    isActive: boolean;
    // New fields for payout control and waitlist
    isPaused: boolean;
    payoutIntervalSeconds: number;
    startsAt: string | null;
    acceptDepositsBeforeStart: boolean;
    // Waitlist stats from API
    waitlistStats?: {
        totalInWaitlist: number;
        waitingNoDeposit: number;
        waitingWithDeposit: number;
        totalDepositedUsd: number;
    };
}

interface PayoutStats {
    pending: number;
    executing: number;
    confirmed: number;
    failed: number;
    totalPaidUsd: number;
}

const CHAIN_OPTIONS = [
    { id: 999, name: 'HyperEVM' },
    { id: 1, name: 'Ethereum' },
    { id: 8453, name: 'Base' },
    { id: 42161, name: 'Arbitrum' },
    { id: 0, name: 'Solana' },
];

const TRENCH_OPTIONS = [
    { id: 'rapid', name: 'RAPID' },
    { id: 'mid', name: 'MID' },
    { id: 'deep', name: 'DEEP' },
];

// Preset tokens for quick selection
const PRESET_TOKENS = [
    { symbol: 'BLT', address: '0xFEF20Fd2422a9d47Fe1a8C355A1AE83F04025EDF', chainId: 999, chainName: 'HyperEVM' },
    { symbol: 'HYPE', address: '0x0000000000000000000000000000000000000000', chainId: 999, chainName: 'HyperEVM' },
    { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', chainId: 1, chainName: 'Ethereum' },
    { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', chainId: 8453, chainName: 'Base' },
    { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', chainId: 1, chainName: 'Ethereum' },
    { symbol: 'ETH', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', chainId: 1, chainName: 'Ethereum' },
    { symbol: 'ETH', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', chainId: 8453, chainName: 'Base' },
    { symbol: 'SOL', address: 'So11111111111111111111111111111111111111112', chainId: 0, chainName: 'Solana' },
    { symbol: 'USDC', address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', chainId: 0, chainName: 'Solana' },
];

interface AcceptedToken {
    address: string;
    symbol: string;
    chainId: number;
}

// Rounding options for reserve display
const ROUNDING_OPTIONS = [
    { value: 1000, label: '1K' },
    { value: 100000, label: '100K' },
    { value: 1000000, label: '1M' },
    { value: 10000000, label: '10M' },
    { value: 100000000, label: '100M' },
    { value: 1000000000, label: '1B' },
];

const emptyCampaign = {
    name: '',
    trenchIds: [] as string[],
    tokenAddress: '',
    tokenSymbol: '',
    tokenDecimals: 18,
    chainId: 999,
    chainName: 'HyperEVM',
    acceptedTokens: [] as AcceptedToken[],
    roiMultiplier: 1.5,
    manualPrice: '' as string,
    useOracle: false,
    oracleSource: 'manual',
    reserveRoundingUnit: 1000000, // 1M default
    // Payout and waitlist controls
    isPaused: false,
    payoutIntervalSeconds: 5,
    startsAt: '' as string,
    acceptDepositsBeforeStart: false,
    isActive: true,
    isHidden: false,
};

const emptyAcceptedToken = { address: '', symbol: '', chainId: 999 };

type AdminTab = 'campaigns' | 'tasks' | 'raids' | 'content' | 'reviews' | 'users' | 'trenches' | 'payouts' | 'deposits' | 'settings';

interface PlatformConfig {
    id: string;
    deploymentDate: string | null;
    telegramUrl: string;
    twitterUrl: string;
    twitterHandle: string;
    onboardingTweetText: string;
    platformName: string;
    referralDomain: string;
    docsUrl: string;
    waitlistStatusMessage: string;
    deploymentStatusMessage: string;
    beliefTiers: Array<{ minScore: number; multiplier: number }>;
    updatedAt: string;
    updatedBy: string | null;
}

interface Task {
    id: string;
    title: string;
    description: string | null;
    reward: number;
    link: string | null;
    taskType: 'ONE_TIME' | 'RECURRING';
    isActive: boolean;
    order: number;
    _count?: { completions: number };
}

interface AdminUser {
    id: string;
    handle: string;
    email: string | null;
    beliefScore: number;
    balance: number;
    createdAt: string;
    _count: {
        participants: number;
        deposits: number;
        userTasks: number;
        campaignWaitlists: number;
    };
}

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

interface AdminDeposit {
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

const emptyTask = {
    title: '',
    description: '',
    reward: 100,
    link: '',
    taskType: 'ONE_TIME' as 'ONE_TIME' | 'RECURRING',
    isActive: true,
    order: 0,
};

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<AdminTab>('campaigns');
    const [trenches, setTrenches] = useState<Trench[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [payoutStats, setPayoutStats] = useState<PayoutStats | null>(null);
    const [editCampaign, setEditCampaign] = useState<typeof emptyCampaign>(emptyCampaign);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [newAcceptedToken, setNewAcceptedToken] = useState<AcceptedToken>(emptyAcceptedToken);
    const [refreshingReserve, setRefreshingReserve] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // Task state
    const [tasks, setTasks] = useState<Task[]>([]);
    const [editTask, setEditTask] = useState<typeof emptyTask>(emptyTask);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [savingTask, setSavingTask] = useState(false);

    // User state
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [userPage, setUserPage] = useState(1);
    const [userTotal, setUserTotal] = useState(0);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    // Campaign detail modal state
    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

    // Deposit state
    const [deposits, setDeposits] = useState<AdminDeposit[]>([]);
    const [depositsLoading, setDepositsLoading] = useState(false);

    // Platform balance state
    interface PlatformBalance {
        byChain: Record<string, {
            totalDeposits: number;
            depositCount: number;
            sweptAmount: number;
            unsweptAmount: number;
            unsweptCount: number;
            cachedWalletBalance: number;
        }>;
        totals: {
            totalDepositsUsd: number;
            sweptUsd: number;
            unsweptUsd: number;
            pendingCount: number;
        };
    }
    const [platformBalance, setPlatformBalance] = useState<PlatformBalance | null>(null);
    const [balanceLoading, setBalanceLoading] = useState(false);

    // Platform config state
    const [platformConfig, setPlatformConfig] = useState<PlatformConfig | null>(null);
    const [configLoading, setConfigLoading] = useState(false);
    const [configSaving, setConfigSaving] = useState(false);
    const [editConfig, setEditConfig] = useState({
        deploymentDate: '',
        telegramUrl: '',
        twitterUrl: '',
        twitterHandle: '',
        onboardingTweetText: '',
        platformName: '',
        referralDomain: '',
        docsUrl: '',
        waitlistStatusMessage: '',
        deploymentStatusMessage: '',
    });
    const [beliefTiers, setBeliefTiers] = useState<Array<{ minScore: number; multiplier: number }>>([
        { minScore: 0, multiplier: 0.5 },
        { minScore: 100, multiplier: 0.75 },
        { minScore: 500, multiplier: 0.9 },
        { minScore: 1000, multiplier: 1.0 },
    ]);

    const fetchPlatformBalance = async () => {
        setBalanceLoading(true);
        try {
            const res = await fetch('/api/admin/balance');
            const data = await res.json();
            if (data.success) {
                setPlatformBalance(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch platform balance:', err);
        }
        setBalanceLoading(false);
    };

    const refreshReserve = async (campaignId: string) => {
        setRefreshingReserve(campaignId);
        try {
            const res = await fetch('/api/reserves', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ campaignId }),
            });
            const data = await res.json();
            if (data.success) {
                setMessage(`Reserve refreshed: ${data.data.reserve}`);
                fetchCampaigns(); // Reload to show updated cache
            }
        } catch (err) {
            setMessage('Failed to refresh reserve');
        }
        setRefreshingReserve(null);
    };

    const fetchPlatformConfig = async () => {
        setConfigLoading(true);
        try {
            const res = await fetch('/api/admin/config');
            const data = await res.json();
            if (data.success && data.config) {
                setPlatformConfig(data.config);
                setEditConfig({
                    deploymentDate: data.config.deploymentDate ? data.config.deploymentDate.slice(0, 16) : '',
                    telegramUrl: data.config.telegramUrl || '',
                    twitterUrl: data.config.twitterUrl || '',
                    twitterHandle: data.config.twitterHandle || '',
                    onboardingTweetText: data.config.onboardingTweetText || '',
                    platformName: data.config.platformName || '',
                    referralDomain: data.config.referralDomain || '',
                    docsUrl: data.config.docsUrl || '',
                    waitlistStatusMessage: data.config.waitlistStatusMessage || '',
                    deploymentStatusMessage: data.config.deploymentStatusMessage || '',
                });
                // Load belief tiers
                if (data.config.beliefTiers && Array.isArray(data.config.beliefTiers)) {
                    setBeliefTiers(data.config.beliefTiers);
                }
            }
        } catch (err) {
            console.error('Failed to fetch platform config:', err);
        }
        setConfigLoading(false);
    };

    const savePlatformConfig = async () => {
        setConfigSaving(true);
        try {
            const res = await fetch('/api/admin/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...editConfig,
                    beliefTiers,
                    deploymentDate: editConfig.deploymentDate || null,
                    updatedBy: 'admin',
                }),
            });
            const data = await res.json();
            if (data.success) {
                setPlatformConfig(data.config);
                setMessage('Platform configuration updated!');
            } else {
                setMessage('Error: ' + data.error);
            }
        } catch (err) {
            setMessage('Failed to save platform config');
        }
        setConfigSaving(false);
    };

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    useEffect(() => {
        // Verify admin auth via API
        const verifyAdmin = async () => {
            try {
                const res = await fetch('/api/admin/verify');
                if (!res.ok) {
                    window.location.href = '/admin/login';
                    return;
                }
            } catch (err) {
                console.error('Auth verification failed:', err);
                window.location.href = '/admin/login';
                return;
            }
            // Auth verified - load data
            fetchCampaigns();
            fetchPayoutStats();
            fetchTrenches();
            fetchTasks();
        };

        verifyAdmin();
    }, []);

    const fetchTrenches = async () => {
        try {
            const res = await fetch('/api/admin/trenches');
            const data = await res.json();
            if (data.data) {
                setTrenches(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch trenches:', err);
        }
    };

    const fetchTasks = async () => {
        try {
            const res = await fetch('/api/admin/tasks');
            const data = await res.json();
            if (data.data) {
                setTasks(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch tasks:', err);
        }
    };

    const fetchUsers = async (search = '', page = 1) => {
        try {
            const res = await fetch(`/api/admin/users?search=${search}&page=${page}&limit=20`);
            const data = await res.json();
            if (data.data) {
                setUsers(data.data);
                setUserTotal(data.meta?.total || 0);
            }
        } catch (err) {
            console.error('Failed to fetch users:', err);
        }
    };

    const fetchDeposits = async () => {
        setDepositsLoading(true);
        try {
            const res = await fetch('/api/admin/deposits');
            const data = await res.json();
            if (data.data) {
                setDeposits(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch deposits:', err);
        } finally {
            setDepositsLoading(false);
        }
    };

    const fetchCampaigns = async () => {
        try {
            const res = await fetch('/api/admin/campaigns');
            const data = await res.json();
            if (data.success) {
                setCampaigns(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch campaigns:', err);
        }
    };

    const fetchPayoutStats = async () => {
        try {
            const res = await fetch('/api/payouts?stats=true');
            const data = await res.json();
            if (data.success) {
                setPayoutStats(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch payout stats:', err);
        }
    };

    const handleNewCampaign = () => {
        setEditCampaign(emptyCampaign);
        setEditingId(null);
        setShowForm(true);
    };

    const handleEditCampaign = (campaign: Campaign) => {
        let parsedTokens: AcceptedToken[] = [];
        try {
            parsedTokens = typeof campaign.acceptedTokens === 'string'
                ? JSON.parse(campaign.acceptedTokens)
                : campaign.acceptedTokens;
        } catch { parsedTokens = []; }

        setEditCampaign({
            name: campaign.name,
            trenchIds: campaign.trenchIds,
            tokenAddress: campaign.tokenAddress,
            tokenSymbol: campaign.tokenSymbol,
            tokenDecimals: campaign.tokenDecimals,
            chainId: campaign.chainId,
            chainName: campaign.chainName,
            acceptedTokens: parsedTokens,
            roiMultiplier: Number(campaign.roiMultiplier),
            manualPrice: campaign.manualPrice ? String(campaign.manualPrice) : '',
            useOracle: campaign.useOracle,
            oracleSource: campaign.oracleSource || 'manual',
            reserveRoundingUnit: campaign.reserveRoundingUnit || 1000000,
            isPaused: campaign.isPaused ?? false,
            payoutIntervalSeconds: campaign.payoutIntervalSeconds ?? 5,
            startsAt: campaign.startsAt ? campaign.startsAt.slice(0, 16) : "",
            acceptDepositsBeforeStart: campaign.acceptDepositsBeforeStart ?? false,
            isActive: campaign.isActive ?? true,
            isHidden: campaign.isHidden ?? false,
        });
        setEditingId(campaign.id);
        setShowForm(true);
    };

    const handleDeleteCampaign = async (id: string) => {
        // Just set confirm state, actual deletion happens in confirmDelete
        setDeleteConfirmId(id);
    };

    const confirmDelete = async () => {
        if (!deleteConfirmId) return;
        const id = deleteConfirmId;
        setDeleteConfirmId(null);

        try {
            const res = await fetch(`/api/admin/campaigns?id=${id}`, { method: 'DELETE' });
            const data = await res.json();

            if (!res.ok) {
                setMessage(`Failed to delete: ${data.error || res.statusText}`);
                return;
            }

            fetchCampaigns();
            setMessage('Campaign deleted');
        } catch (err) {
            console.error('Delete error:', err);
            setMessage('Failed to delete campaign');
        }
    };

    const handleToggleHidden = async (id: string, hidden: boolean) => {
        try {
            await fetch('/api/admin/campaigns', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, isHidden: hidden }),
            });
            fetchCampaigns();
            setMessage(hidden ? 'Campaign hidden from homepage' : 'Campaign visible on homepage');
        } catch (err) {
            setMessage('Failed to update campaign visibility');
        }
    };

    const saveCampaign = async (formData?: typeof editCampaign) => {
        setSaving(true);
        setMessage(null);
        try {
            const dataToSave = formData || editCampaign;
            const method = editingId ? 'PUT' : 'POST';
            const body = {
                ...dataToSave,
                id: editingId,
                manualPrice: dataToSave.manualPrice ? parseFloat(dataToSave.manualPrice) : null,
            };
            const res = await fetch('/api/admin/campaigns', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
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

    const toggleTrench = (trenchId: string) => {
        const current = editCampaign.trenchIds;
        if (current.includes(trenchId)) {
            setEditCampaign({ ...editCampaign, trenchIds: current.filter(id => id !== trenchId) });
        } else {
            setEditCampaign({ ...editCampaign, trenchIds: [...current, trenchId] });
        }
    };

    const addAcceptedToken = () => {
        if (!newAcceptedToken.address || !newAcceptedToken.symbol) return;
        setEditCampaign({
            ...editCampaign,
            acceptedTokens: [...editCampaign.acceptedTokens, { ...newAcceptedToken }],
        });
        setNewAcceptedToken(emptyAcceptedToken);
    };

    const removeAcceptedToken = (index: number) => {
        setEditCampaign({
            ...editCampaign,
            acceptedTokens: editCampaign.acceptedTokens.filter((_, i) => i !== index),
        });
    };
    const processPayouts = async () => {
        try {
            const res = await fetch('/api/payouts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'process', limit: 10 }),
            });
            const data = await res.json();
            if (data.success) {
                setMessage(`Processed ${data.data.length} payouts`);
                fetchPayoutStats();
            }
        } catch (err) {
            setMessage('Failed to process payouts');
        }
    };

    // Get campaign for a trench
    const getCampaignForTrench = (trenchId: string) => {
        return campaigns.find(c => c.trenchIds.includes(trenchId.toLowerCase()));
    };

    // Task CRUD handlers
    const handleNewTask = () => {
        setEditTask(emptyTask);
        setEditingTaskId(null);
        setShowTaskForm(true);
    };

    const handleEditTask = (task: Task) => {
        setEditTask({
            title: task.title,
            description: task.description || '',
            reward: task.reward,
            link: task.link || '',
            taskType: task.taskType,
            isActive: task.isActive,
            order: task.order,
        });
        setEditingTaskId(task.id);
        setShowTaskForm(true);
    };

    const handleDeleteTask = async (id: string) => {
        if (!confirm('Delete this task? User completions will also be deleted.')) return;
        try {
            await fetch(`/api/admin/tasks/${id}`, { method: 'DELETE' });
            fetchTasks();
            setMessage('Task deleted');
        } catch (err) {
            setMessage('Failed to delete task');
        }
    };

    const saveTask = async () => {
        setSavingTask(true);
        setMessage(null);
        try {
            const method = editingTaskId ? 'PUT' : 'POST';
            const url = editingTaskId ? `/api/admin/tasks/${editingTaskId}` : '/api/admin/tasks';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editTask),
            });
            const data = await res.json();
            if (data.data) {
                setMessage(editingTaskId ? 'Task updated!' : 'Task created!');
                setShowTaskForm(false);
                fetchTasks();
            } else {
                setMessage('Error: ' + (data.error || 'Unknown error'));
            }
        } catch (err) {
            setMessage('Failed to save task');
        } finally {
            setSavingTask(false);
        }
    };

    // Tab change handler
    const handleTabChange = (tab: AdminTab) => {
        setActiveTab(tab);
        if (tab === 'users') {
            fetchUsers(userSearch, userPage);
        } else if (tab === 'deposits') {
            fetchDeposits();
        } else if (tab === 'settings') {
            fetchPlatformConfig();
        }
    };

    return (
        <main className={styles.container}>
            {message && <div className={styles.message}>{message}</div>}

            {/* User Detail Modal */}
            <UserDetailModal
                userId={selectedUserId}
                onClose={() => setSelectedUserId(null)}
                onUserClick={(id) => setSelectedUserId(id)}
            />

            {/* Campaign Detail Modal */}
            {selectedCampaignId && (
                <CampaignDetailModal
                    campaignId={selectedCampaignId}
                    onClose={() => setSelectedCampaignId(null)}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                }}>
                    <div style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '8px',
                        padding: '2rem',
                        textAlign: 'center',
                        maxWidth: '400px',
                    }}>
                        <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
                            Delete Campaign?
                        </h3>
                        <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
                            This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                style={{
                                    padding: '0.5rem 1.5rem',
                                    background: 'var(--bg-tertiary)',
                                    border: '1px solid var(--border-primary)',
                                    borderRadius: '4px',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                style={{
                                    padding: '0.5rem 1.5rem',
                                    background: '#ff4444',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab Navigation */}
            <nav className={styles.tabs}>
                {(['campaigns', 'tasks', 'raids', 'content', 'reviews', 'users', 'deposits', 'trenches', 'payouts', 'settings'] as AdminTab[]).map(tab => (
                    <button
                        key={tab}
                        className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
                        onClick={() => handleTabChange(tab)}
                    >
                        {tab.toUpperCase()}
                    </button>
                ))}
                <Link
                    href="https://trenches-v2-waitlist.vercel.app/branding"
                    target="_blank"
                    className={styles.tab}
                    style={{ marginLeft: 'auto', border: '1px solid var(--accent-zenith)', color: 'var(--accent-zenith)', opacity: 0.8 }}
                >
                    BRAND_ASSETS ↗
                </Link>
            </nav>

            {/* Tasks Section */}
            {activeTab === 'tasks' && (
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>TASKS</h2>
                        <button className={styles.addBtn} onClick={handleNewTask}>+ NEW TASK</button>
                    </div>

                    {showTaskForm && (
                        <div className={styles.formCard}>
                            <div className={styles.formHeader}>
                                <h3 className={styles.formTitle}>{editingTaskId ? 'RECONFIGURE PROTOCOL TASK' : 'INITIALIZE NEW TASK'}</h3>
                                <p className={styles.formSubtitle}>Define coordination objectives and boost point incentives</p>
                            </div>
                            <div className={styles.configGrid}>
                                <div className={styles.configItem}>
                                    <label className={styles.configLabel}>Task Title</label>
                                    <input
                                        type="text"
                                        className={styles.configInput}
                                        value={editTask.title}
                                        onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
                                        placeholder="e.g., Connect X (Twitter)"
                                    />
                                </div>
                                <div className={styles.configItem}>
                                    <label className={styles.configLabel}>Description (optional)</label>
                                    <input
                                        type="text"
                                        className={styles.configInput}
                                        value={editTask.description}
                                        onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
                                        placeholder="Brief description"
                                    />
                                </div>
                                <div className={styles.configItem}>
                                    <label className={styles.configLabel}>Boost Points Reward</label>
                                    <input
                                        type="number"
                                        className={styles.configInput}
                                        value={editTask.reward}
                                        onChange={(e) => setEditTask({ ...editTask, reward: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className={styles.configItem}>
                                    <label className={styles.configLabel}>External Link (optional)</label>
                                    <input
                                        type="url"
                                        className={styles.configInput}
                                        value={editTask.link}
                                        onChange={(e) => setEditTask({ ...editTask, link: e.target.value })}
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className={styles.configItem}>
                                    <label className={styles.configLabel}>Display Order</label>
                                    <input
                                        type="number"
                                        className={styles.configInput}
                                        value={editTask.order}
                                        onChange={(e) => setEditTask({ ...editTask, order: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className={styles.configItem}>
                                    <label className={styles.configLabel}>Task Type</label>
                                    <select
                                        className={styles.configInput}
                                        value={editTask.taskType}
                                        onChange={(e) => setEditTask({ ...editTask, taskType: e.target.value as 'ONE_TIME' | 'RECURRING' })}
                                    >
                                        <option value="ONE_TIME">One-Time (complete once)</option>
                                        <option value="RECURRING">Recurring (per spray)</option>
                                    </select>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        {editTask.taskType === 'ONE_TIME'
                                            ? 'PERSISTENT COMPLETION PROTOCOL'
                                            : 'RECURRING ACTION ENFORCEMENT'}
                                    </p>
                                </div>
                                <div className={styles.configItem}>
                                    <label className={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={editTask.isActive}
                                            onChange={(e) => setEditTask({ ...editTask, isActive: e.target.checked })}
                                        />
                                        ACTIVE PROTOCOL (VISIBLE TO OPERATIVES)
                                    </label>
                                </div>
                            </div>
                            <div className={styles.formActions}>
                                <button className={styles.cancelBtn} onClick={() => setShowTaskForm(false)}>CANCEL</button>
                                <button className={styles.saveBtn} onClick={saveTask} disabled={savingTask}>
                                    {savingTask ? 'COMMITTING...' : 'SAVE CONFIGURATION'}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>ORDER</th>
                                    <th>TITLE</th>
                                    <th>TYPE</th>
                                    <th>REWARD</th>
                                    <th>COMPLETIONS</th>
                                    <th>STATUS</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.length === 0 ? (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No tasks yet</td></tr>
                                ) : (
                                    tasks.map(task => (
                                        <tr key={task.id}>
                                            <td>{task.order}</td>
                                            <td>{task.title}</td>
                                            <td style={{ color: task.taskType === 'RECURRING' ? 'var(--accent-rapid)' : 'var(--accent-mid)' }}>
                                                {task.taskType === 'RECURRING' ? 'RECURRING' : 'ONE-TIME'}
                                            </td>
                                            <td>{task.reward} BP</td>
                                            <td>{task._count?.completions || 0}</td>
                                            <td style={{ color: task.isActive ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                                                {task.isActive ? 'ACTIVE' : 'INACTIVE'}
                                            </td>
                                            <td>
                                                <button className={styles.actionBtn} onClick={() => handleEditTask(task)}>EDIT</button>
                                                <button className={styles.actionBtn} onClick={() => handleDeleteTask(task.id)}>DEL</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* Raids Section */}
            {activeTab === 'raids' && <RaidsManager />}

            {/* Content Campaigns Section */}
            {activeTab === 'content' && <ContentCampaignsManager />}

            {/* Content Submissions Review Section */}
            {activeTab === 'reviews' && <ContentSubmissionsManager />}

            {/* Users Section */}
            {activeTab === 'users' && (
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>USERS ({userTotal})</h2>
                    <div className={styles.searchRow}>
                        <input
                            type="text"
                            placeholder="Search by handle or email..."
                            className={styles.configInput}
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchUsers(userSearch, 1)}
                        />
                        <button className={styles.actionBtn} onClick={() => fetchUsers(userSearch, 1)}>SEARCH</button>
                    </div>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>HANDLE</th>
                                    <th>EMAIL</th>
                                    <th>BALANCE</th>
                                    <th>BELIEF</th>
                                    <th>POSITIONS</th>
                                    <th>TASKS</th>
                                    <th>JOINED</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No users found</td></tr>
                                ) : (
                                    users.map(user => (
                                        <tr key={user.id}>
                                            <td>
                                                <button
                                                    onClick={() => setSelectedUserId(user.id)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#00FF66',
                                                        cursor: 'pointer',
                                                        fontWeight: 700,
                                                        padding: 0,
                                                    }}
                                                >
                                                    {user.handle}
                                                </button>
                                            </td>
                                            <td>{user.email || '-'}</td>
                                            <td style={{ color: 'var(--accent-blt)' }}>${Number(user.balance || 0).toFixed(2)}</td>
                                            <td>{user.beliefScore}</td>
                                            <td>{user._count.participants} / {user._count.campaignWaitlists}</td>
                                            <td>{user._count.userTasks}</td>
                                            <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {userTotal > 20 && (
                        <div className={styles.pagination}>
                            <button
                                className={styles.actionBtn}
                                disabled={userPage <= 1}
                                onClick={() => { setUserPage(p => p - 1); fetchUsers(userSearch, userPage - 1); }}
                            >
                                PREV
                            </button>
                            <span>Page {userPage} of {Math.ceil(userTotal / 20)}</span>
                            <button
                                className={styles.actionBtn}
                                disabled={userPage >= Math.ceil(userTotal / 20)}
                                onClick={() => { setUserPage(p => p + 1); fetchUsers(userSearch, userPage + 1); }}
                            >
                                NEXT
                            </button>
                        </div>
                    )}
                </section>
            )}

            {/* Campaigns Section */}
            {activeTab === 'campaigns' && (
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>CAMPAIGNS</h2>
                        <button className={styles.addBtn} onClick={handleNewCampaign}>+ NEW CAMPAIGN</button>
                    </div>

                    {showForm && (
                        <CampaignForm
                            campaign={editCampaign}
                            campaignId={editingId || undefined}
                            isEditing={!!editingId}
                            onSave={(updated) => {
                                setEditCampaign(updated);
                                saveCampaign(updated);
                            }}
                            onCancel={() => setShowForm(false)}
                            saving={saving}
                        />
                    )}

                    {/* Campaign List */}
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>NAME</th>
                                    <th>TRENCHES</th>
                                    <th>TOKEN</th>
                                    <th>RESERVES</th>
                                    <th>ROI</th>
                                    <th>PRICE</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {campaigns.length === 0 ? (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No campaigns yet</td></tr>
                                ) : (
                                    campaigns.map(c => (
                                        <tr key={c.id}>
                                            <td>
                                                <button
                                                    className={`${styles.linkBtn} ${c.isPaused ? styles.pausedName : ''}`}
                                                    onClick={() => setSelectedCampaignId(c.id)}
                                                >
                                                    {c.name}
                                                    {c.isPaused && <span className={styles.pausedBadge}>PAUSED</span>}
                                                </button>
                                            </td>
                                            <td>{c.trenchIds.map(t => t.toUpperCase()).join(', ') || '-'}</td>
                                            <td>{c.tokenSymbol} ({c.chainName})</td>
                                            <td>
                                                <span style={{ marginRight: 8 }}>{c.reserveCachedBalance || '-'}</span>
                                                <button
                                                    className={styles.refreshBtn}
                                                    onClick={() => refreshReserve(c.id)}
                                                    disabled={refreshingReserve === c.id}
                                                >
                                                    {refreshingReserve === c.id ? '...' : '↻'}
                                                </button>
                                            </td>
                                            <td>{Number(c.roiMultiplier)}x</td>
                                            <td>{c.manualPrice ? `$${Number(c.manualPrice).toFixed(4)}` : (c.useOracle ? c.oracleSource : '-')}</td>
                                            <td style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                <button
                                                    className={styles.actionBtn}
                                                    onClick={() => handleToggleHidden(c.id, !c.isHidden)}
                                                    style={{ background: c.isHidden ? 'var(--accent-primary)' : 'var(--bg-tertiary)' }}
                                                >
                                                    {c.isHidden ? 'SHOW' : 'HIDE'}
                                                </button>
                                                <button className={styles.actionBtn} onClick={() => handleEditCampaign(c)}>EDIT</button>
                                                <button className={styles.actionBtn} onClick={() => handleDeleteCampaign(c.id)}>DEL</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* Payout Stats Section */}
            {activeTab === 'payouts' && (
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>PAYOUT STATUS</h2>
                    {payoutStats && (
                        <div className={styles.statsRow}>
                            <div className={styles.kpiCard}>
                                <span className={styles.kpiValue}>{payoutStats.pending}</span>
                                <span className={styles.kpiLabel}>PENDING</span>
                            </div>
                            <div className={styles.kpiCard}>
                                <span className={styles.kpiValue}>{payoutStats.confirmed}</span>
                                <span className={styles.kpiLabel}>CONFIRMED</span>
                            </div>
                            <div className={styles.kpiCard}>
                                <span className={styles.kpiValue}>{payoutStats.failed}</span>
                                <span className={styles.kpiLabel}>FAILED</span>
                            </div>
                            <div className={styles.kpiCard}>
                                <span className={styles.kpiValue}>${Number(payoutStats.totalPaidUsd).toLocaleString()}</span>
                                <span className={styles.kpiLabel}>TOTAL PAID</span>
                            </div>
                        </div>
                    )}
                    <button className={styles.actionBtn} onClick={processPayouts}>PROCESS PENDING PAYOUTS</button>
                </section>
            )}

            {/* Deposits Section */}
            {activeTab === 'deposits' && (
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>DEPOSITS</h2>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className={styles.actionBtn} onClick={fetchPlatformBalance} disabled={balanceLoading}>
                                {balanceLoading ? 'LOADING...' : 'REFRESH BALANCES'}
                            </button>
                            <button className={styles.actionBtn} onClick={fetchDeposits} disabled={depositsLoading}>
                                {depositsLoading ? 'LOADING...' : 'REFRESH LIST'}
                            </button>
                        </div>
                    </div>

                    {/* Platform Balance Summary */}
                    <div className={styles.statsGrid} style={{ marginBottom: '2.5rem' }}>
                        <div className={styles.statCard}>
                            <span className={styles.statValue} style={{ color: 'var(--status-success)' }}>
                                ${platformBalance?.totals?.totalDepositsUsd?.toFixed(2) || '0.00'}
                            </span>
                            <span className={styles.statLabel}>TOTAL DEPOSITED (USD)</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statValue} style={{ color: 'var(--status-warning)' }}>
                                ${platformBalance?.totals?.unsweptUsd?.toFixed(2) || '0.00'}
                            </span>
                            <span className={styles.statLabel}>UNSWEPT ({platformBalance?.totals?.pendingCount || 0})</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statValue}>
                                ${platformBalance?.totals?.sweptUsd?.toFixed(2) || '0.00'}
                            </span>
                            <span className={styles.statLabel}>SWEPT</span>
                        </div>
                        {platformBalance?.byChain && Object.entries(platformBalance.byChain).map(([chain, data]) => (
                            <div key={chain} className={styles.statCard}>
                                <span className={styles.statValue}>${data.totalDeposits.toFixed(2)}</span>
                                <span className={styles.statLabel}>{chain.toUpperCase()} ({data.depositCount})</span>
                                {data.cachedWalletBalance > 0 && (
                                    <span style={{ fontSize: '0.7rem', color: 'var(--accent-mid)' }}>
                                        Wallet: {data.cachedWalletBalance.toFixed(4)}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>USER</th>
                                    <th>CHAIN</th>
                                    <th>TOKEN</th>
                                    <th>AMOUNT</th>
                                    <th>USD VALUE</th>
                                    <th>STATUS</th>
                                    <th>TX HASH</th>
                                    <th>DATE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deposits.length === 0 ? (
                                    <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                        {depositsLoading ? 'Loading...' : 'No deposits yet'}
                                    </td></tr>
                                ) : (
                                    deposits.map(deposit => (
                                        <tr key={deposit.id}>
                                            <td>{deposit.user?.handle || '-'}</td>
                                            <td>{deposit.chain}</td>
                                            <td>{deposit.token}</td>
                                            <td>{deposit.amount}</td>
                                            <td style={{ color: 'var(--accent-blt)' }}>${Number(deposit.usdValue).toFixed(2)}</td>
                                            <td style={{
                                                color: deposit.status === 'confirmed' ? 'var(--status-success)' :
                                                    deposit.status === 'pending' ? 'var(--status-warning)' : 'var(--text-muted)'
                                            }}>
                                                {deposit.status.toUpperCase()}
                                            </td>
                                            <td>{deposit.txHash ? `${deposit.txHash.slice(0, 8)}...` : '-'}</td>
                                            <td>{new Date(deposit.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* Trench Control Section */}
            {activeTab === 'trenches' && (
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>TRENCH CONTROL</h2>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>LEVEL</th>
                                    <th>USD CAP</th>
                                    <th>ENTRY RANGE</th>
                                    <th>TOKEN</th>
                                    <th>CAMPAIGN</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trenches.map(trench => {
                                    const campaign = getCampaignForTrench(trench.level);
                                    const tokenSymbol = campaign?.tokenSymbol || 'BLT';
                                    const tokenPrice = campaign?.manualPrice ? Number(campaign.manualPrice) : null;

                                    // USD caps per trench level
                                    const usdCaps: Record<string, { min: number; max: number }> = {
                                        'RAPID': { min: 5, max: 1000 },
                                        'MID': { min: 100, max: 10000 },
                                        'DEEP': { min: 1000, max: 100000 },
                                    };

                                    const caps = usdCaps[trench.level.toUpperCase()] || { min: 5, max: 1000 };

                                    // Calculate token amounts based on price
                                    const minTokens = tokenPrice ? Math.round(caps.min / tokenPrice) : null;
                                    const maxTokens = tokenPrice ? Math.round(caps.max / tokenPrice) : null;

                                    return (
                                        <tr key={trench.id}>
                                            <td style={{ color: `var(--accent-${trench.level.toLowerCase()})` }}>
                                                {trench.level}
                                            </td>
                                            <td>${caps.min.toLocaleString()} - ${caps.max.toLocaleString()}</td>
                                            <td>
                                                {tokenPrice && minTokens && maxTokens ? (
                                                    <span>
                                                        {minTokens.toLocaleString()} - {maxTokens.toLocaleString()} ${tokenSymbol}
                                                        <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: '0.8rem' }}>
                                                            @ ${tokenPrice.toFixed(4)}
                                                        </span>
                                                    </span>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)' }}>Set token price</span>
                                                )}
                                            </td>
                                            <td>{tokenSymbol}</td>
                                            <td>{campaign?.name || 'Default'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* Settings Section */}
            {activeTab === 'settings' && (
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>PLATFORM SETTINGS</h2>
                    </div>

                    {configLoading ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            Loading configuration...
                        </div>
                    ) : (
                        <div className={styles.formCard}>
                            <div className={styles.formHeader}>
                                <h3 className={styles.formTitle}>GLOBAL CONFIGURATION</h3>
                                <p className={styles.formSubtitle}>Settings apply to both Waitlist and Main Dapp</p>
                            </div>

                            <div className={styles.configGrid}>
                                {/* Deployment Timer */}
                                <div className={styles.configItem}>
                                    <label className={styles.configLabel}>Deployment Date (Countdown Target)</label>
                                    <input
                                        type="datetime-local"
                                        className={styles.configInput}
                                        value={editConfig.deploymentDate}
                                        onChange={(e) => setEditConfig({ ...editConfig, deploymentDate: e.target.value })}
                                    />
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                        Universal countdown timer for all waitlist users
                                    </p>
                                </div>

                                {/* Platform Name */}
                                <div className={styles.configItem}>
                                    <label className={styles.configLabel}>Platform Name</label>
                                    <input
                                        type="text"
                                        className={styles.configInput}
                                        value={editConfig.platformName}
                                        onChange={(e) => setEditConfig({ ...editConfig, platformName: e.target.value })}
                                        placeholder="Trenches"
                                    />
                                </div>

                                {/* Referral Domain */}
                                <div className={styles.configItem}>
                                    <label className={styles.configLabel}>Referral Domain</label>
                                    <input
                                        type="text"
                                        className={styles.configInput}
                                        value={editConfig.referralDomain}
                                        onChange={(e) => setEditConfig({ ...editConfig, referralDomain: e.target.value })}
                                        placeholder="playtrenches.xyz"
                                    />
                                </div>

                                {/* Telegram URL */}
                                <div className={styles.configItem}>
                                    <label className={styles.configLabel}>Telegram URL</label>
                                    <input
                                        type="url"
                                        className={styles.configInput}
                                        value={editConfig.telegramUrl}
                                        onChange={(e) => setEditConfig({ ...editConfig, telegramUrl: e.target.value })}
                                        placeholder={platformConfig?.telegramUrl || "https://t.me/trenchesprotocol"}
                                    />
                                </div>

                                {/* Twitter URL */}
                                <div className={styles.configItem}>
                                    <label className={styles.configLabel}>Twitter/X URL</label>
                                    <input
                                        type="url"
                                        className={styles.configInput}
                                        value={editConfig.twitterUrl}
                                        onChange={(e) => setEditConfig({ ...editConfig, twitterUrl: e.target.value })}
                                        placeholder={platformConfig?.twitterUrl || "https://x.com/traboraofficial"}
                                    />
                                </div>

                                {/* Twitter Handle */}
                                <div className={styles.configItem}>
                                    <label className={styles.configLabel}>Twitter Handle (for mentions)</label>
                                    <input
                                        type="text"
                                        className={styles.configInput}
                                        value={editConfig.twitterHandle}
                                        onChange={(e) => setEditConfig({ ...editConfig, twitterHandle: e.target.value })}
                                        placeholder={platformConfig?.twitterHandle || "@traboraofficial"}
                                    />
                                </div>

                                {/* Onboarding Tweet Text */}
                                <div className={styles.configItem} style={{ gridColumn: 'span 2' }}>
                                    <label className={styles.configLabel}>Onboarding Tweet Text</label>
                                    <textarea
                                        className={styles.configInput}
                                        style={{ minHeight: '80px', resize: 'vertical' }}
                                        value={editConfig.onboardingTweetText}
                                        onChange={(e) => setEditConfig({ ...editConfig, onboardingTweetText: e.target.value })}
                                        placeholder={platformConfig?.onboardingTweetText || "Just enlisted in the @traboraofficial deployment queue. Spray and Pray! 🔫"}
                                    />
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                        Default tweet text for onboarding verification
                                    </p>
                                </div>

                                {/* Documentation URL */}
                                <div className={styles.configItem}>
                                    <label className={styles.configLabel}>Documentation URL</label>
                                    <input
                                        type="url"
                                        className={styles.configInput}
                                        value={editConfig.docsUrl}
                                        onChange={(e) => setEditConfig({ ...editConfig, docsUrl: e.target.value })}
                                        placeholder={platformConfig?.docsUrl || "https://docs.playtrenches.xyz"}
                                    />
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                        Link to documentation/help center
                                    </p>
                                </div>

                                {/* Waitlist Status Message */}
                                <div className={styles.configItem}>
                                    <label className={styles.configLabel}>Waitlist Status Message</label>
                                    <input
                                        type="text"
                                        className={styles.configInput}
                                        value={editConfig.waitlistStatusMessage}
                                        onChange={(e) => setEditConfig({ ...editConfig, waitlistStatusMessage: e.target.value })}
                                        placeholder={platformConfig?.waitlistStatusMessage || "WAITLIST PROTOCOL ACTIVE"}
                                    />
                                </div>

                                {/* Deployment Status Message */}
                                <div className={styles.configItem}>
                                    <label className={styles.configLabel}>Deployment Status Message</label>
                                    <input
                                        type="text"
                                        className={styles.configInput}
                                        value={editConfig.deploymentStatusMessage}
                                        onChange={(e) => setEditConfig({ ...editConfig, deploymentStatusMessage: e.target.value })}
                                        placeholder={platformConfig?.deploymentStatusMessage || "DEPLOYMENT WINDOW OPEN"}
                                    />
                                </div>
                            </div>

                            {/* Belief Score Tiers Section */}
                            <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-primary)', paddingTop: '1.5rem' }}>
                                <h4 style={{ fontSize: '0.75rem', letterSpacing: '0.1em', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>BELIEF SCORE TIERS</h4>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                    Configure entry cap multipliers based on user belief score. Higher tiers unlock larger entry amounts.
                                </p>

                                <div style={{ display: 'grid', gap: '0.5rem' }}>
                                    {/* Header Row */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 40px', gap: '0.5rem', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        <span>Min Score</span>
                                        <span>Entry Multiplier</span>
                                        <span></span>
                                    </div>

                                    {/* Tier Rows */}
                                    {beliefTiers.sort((a, b) => a.minScore - b.minScore).map((tier, idx) => (
                                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 40px', gap: '0.5rem', alignItems: 'center' }}>
                                            <input
                                                type="number"
                                                className={styles.configInput}
                                                value={tier.minScore}
                                                onChange={(e) => {
                                                    const updated = [...beliefTiers];
                                                    updated[idx] = { ...tier, minScore: parseInt(e.target.value) || 0 };
                                                    setBeliefTiers(updated);
                                                }}
                                                style={{ padding: '0.5rem' }}
                                            />
                                            <input
                                                type="number"
                                                step="0.05"
                                                className={styles.configInput}
                                                value={tier.multiplier}
                                                onChange={(e) => {
                                                    const updated = [...beliefTiers];
                                                    updated[idx] = { ...tier, multiplier: parseFloat(e.target.value) || 0 };
                                                    setBeliefTiers(updated);
                                                }}
                                                style={{ padding: '0.5rem' }}
                                            />
                                            <button
                                                onClick={() => setBeliefTiers(beliefTiers.filter((_, i) => i !== idx))}
                                                style={{
                                                    background: 'var(--bg-tertiary)',
                                                    border: '1px solid var(--border-primary)',
                                                    borderRadius: '4px',
                                                    color: '#ff4444',
                                                    cursor: 'pointer',
                                                    padding: '0.5rem',
                                                    fontSize: '0.8rem',
                                                }}
                                                disabled={beliefTiers.length <= 1}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}

                                    {/* Add Tier Button */}
                                    <button
                                        onClick={() => {
                                            const maxScore = Math.max(...beliefTiers.map(t => t.minScore));
                                            setBeliefTiers([...beliefTiers, { minScore: maxScore + 500, multiplier: 1.0 }]);
                                        }}
                                        style={{
                                            background: 'var(--bg-secondary)',
                                            border: '1px dashed var(--border-primary)',
                                            borderRadius: '4px',
                                            color: 'var(--text-muted)',
                                            cursor: 'pointer',
                                            padding: '0.5rem',
                                            fontSize: '0.7rem',
                                            marginTop: '0.5rem',
                                        }}
                                    >
                                        + ADD TIER
                                    </button>
                                </div>

                                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                                    Example: Score 500 with multiplier 0.9 means users with 500+ belief can access 90% of trench max entry.
                                </p>
                            </div>

                            <div className={styles.formActions}>
                                <button
                                    className={styles.cancelBtn}
                                    onClick={fetchPlatformConfig}
                                    disabled={configSaving}
                                >
                                    RESET
                                </button>
                                <button
                                    className={styles.saveBtn}
                                    onClick={savePlatformConfig}
                                    disabled={configSaving}
                                >
                                    {configSaving ? 'SAVING...' : 'SAVE CONFIGURATION'}
                                </button>
                            </div>

                            {platformConfig?.updatedAt && (
                                <div style={{ marginTop: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                                    Last updated: {new Date(platformConfig.updatedAt).toLocaleString()}
                                    {platformConfig.updatedBy && ` by ${platformConfig.updatedBy}`}
                                </div>
                            )}
                        </div>
                    )}
                </section>
            )}
        </main>
    );
}
