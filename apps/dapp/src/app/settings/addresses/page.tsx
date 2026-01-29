"use client";

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    ShieldCheck,
    MapPin,
    Plus,
    Trash2,
    Check,
    Clock,
    Mail,
    AlertTriangle,
    ArrowRight,
    ExternalLink,
    ChevronRight
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import Logo from '@/components/Logo';
import styles from './settings.module.css';

interface Address {
    id: string;
    address: string;
    chain: 'EVM' | 'SOLANA';
    label: string | null;
    status: string;
    isPrimary: boolean;
    displayStatus: 'AWAITING_EMAIL' | 'ACTIVATING' | 'ACTIVE' | 'PRIMARY';
    activatesAt: string | null;
    createdAt: string;
}

// Component that uses useSearchParams - wrapped in Suspense
function AddressSettingsContent() {
    const { user, isLoading: authLoading } = useAuth();
    const searchParams = useSearchParams();

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form state
    const [newAddress, setNewAddress] = useState('');
    const [newChain, setNewChain] = useState<'EVM' | 'SOLANA'>('EVM');
    const [newLabel, setNewLabel] = useState('');

    const fetchAddresses = useCallback(async () => {
        try {
            const res = await fetch('/api/user/addresses');
            const data = await res.json();
            if (data.success) {
                setAddresses(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch addresses:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!authLoading && user) {
            fetchAddresses();
        }

        // Check for query params
        const confirmed = searchParams.get('confirmed');
        const urlError = searchParams.get('error');

        if (confirmed) {
            setSuccess('Email confirmed! Your 24-hour security hold has started.');
        }
        if (urlError) {
            setError(urlError);
        }
    }, [authLoading, user, fetchAddresses, searchParams]);

    const handleAddAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch('/api/user/addresses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address: newAddress,
                    chain: newChain,
                    label: newLabel
                })
            });

            const data = await res.json();

            if (data.success) {
                setSuccess('Address added! Please check your email to confirm.');
                setNewAddress('');
                setNewLabel('');
                fetchAddresses();
            } else {
                setError(data.error || 'Failed to add address');
            }
        } catch (err) {
            setError('A network error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSetPrimary = async (id: string) => {
        setError(null);
        setSuccess(null);
        try {
            const res = await fetch(`/api/user/addresses/${id}/primary`, {
                method: 'PUT'
            });
            const data = await res.json();
            if (data.success) {
                setSuccess('Primary address updated');
                fetchAddresses();
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to update primary address');
        }
    };

    const handleRemove = async (id: string, label: string | null, address: string) => {
        if (!confirm(`Are you sure you want to remove ${label || address}?`)) return;

        setError(null);
        setSuccess(null);
        try {
            const res = await fetch(`/api/user/addresses/${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                setSuccess('Address removed');
                fetchAddresses();
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to remove address');
        }
    };

    // Helper for countdown display
    const getActivatesIn = (activatesAt: string | null) => {
        if (!activatesAt) return '';
        const diff = new Date(activatesAt).getTime() - Date.now();
        if (diff <= 0) return 'Ready';

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    if (authLoading || (loading && !addresses.length)) {
        return (
            <main className={styles.container}>
                <div className={styles.loading}>SYNCING_VAULT...</div>
            </main>
        );
    }

    if (!user) {
        return (
            <main className={styles.container}>
                <div className={styles.empty}>Authorized access only. Please login.</div>
            </main>
        );
    }

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <Logo variant="horizontal" width={150} />
                    <h1 className={styles.title}>ADDRESS_BOOK</h1>
                </div>
                <div className="status-indicator">SECURED</div>
            </header>

            {error && (
                <div className={`${styles.alert} ${styles.alertError}`}>
                    <AlertTriangle size={18} />
                    <span>{error}</span>
                    <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>×</button>
                </div>
            )}

            {success && (
                <div className={`${styles.alert} ${styles.alertSuccess}`}>
                    <ShieldCheck size={18} />
                    <span>{success}</span>
                    <button onClick={() => setSuccess(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>×</button>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                {/* Left Column: Address List */}
                <section>
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <MapPin size={16} />
                            Verified Payout Destinations
                        </h2>

                        {addresses.length === 0 ? (
                            <div className={styles.empty}>
                                No addresses found. Add your first wallet destination to receive payouts.
                            </div>
                        ) : (
                            <div className={styles.addressGrid}>
                                {addresses.map((addr) => (
                                    <div
                                        key={addr.id}
                                        className={`${styles.addressCard} ${addr.isPrimary ? styles.addressCardPrimary : ''}`}
                                    >
                                        <div className={styles.cardHeader}>
                                            <div>
                                                <div className={styles.label}>{addr.label || 'Unnamed Wallet'}</div>
                                                <span className={`${styles.chainBadge} ${addr.chain === 'EVM' ? styles.chainEvm : styles.chainSolana}`}>
                                                    {addr.chain}
                                                </span>
                                            </div>
                                            {addr.isPrimary && (
                                                <div className={styles.statusBadge} style={{ background: 'rgba(0, 255, 102, 0.2)', color: '#00FF66' }}>
                                                    <ShieldCheck size={12} />
                                                    PRIMARY
                                                </div>
                                            )}
                                        </div>

                                        <div className={styles.address}>{addr.address}</div>

                                        <div className={styles.statusContainer}>
                                            <div className={styles.statusRow}>
                                                <div className={`${styles.statusBadge} ${addr.status === 'ACTIVE' ? styles.statusActive :
                                                        addr.displayStatus === 'AWAITING_EMAIL' ? styles.statusAwaiting : styles.statusPending
                                                    }`}>
                                                    {addr.status === 'ACTIVE' ? <Check size={12} /> : <Clock size={12} />}
                                                    {addr.displayStatus.replace('_', ' ')}
                                                </div>

                                                {addr.displayStatus === 'ACTIVATING' && (
                                                    <div className={`${styles.timer} ${styles.pulse}`}>
                                                        <Clock size={12} />
                                                        {getActivatesIn(addr.activatesAt)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className={styles.actions}>
                                            {!addr.isPrimary && addr.status === 'ACTIVE' && (
                                                <button
                                                    className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                                                    onClick={() => handleSetPrimary(addr.id)}
                                                >
                                                    SET PRIMARY
                                                </button>
                                            )}

                                            {!addr.isPrimary && (
                                                <button
                                                    className={`${styles.actionBtn} ${styles.actionBtnRemove}`}
                                                    onClick={() => handleRemove(addr.id, addr.label, addr.address)}
                                                >
                                                    <Trash2 size={12} />
                                                    REMOVE
                                                </button>
                                            )}

                                            {addr.displayStatus === 'AWAITING_EMAIL' && (
                                                <button className={styles.actionBtn} style={{ borderColor: '#666', color: '#999' }} disabled>
                                                    <Mail size={12} />
                                                    CHECK EMAIL
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className={styles.section} style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                        <h3 style={{ fontSize: '0.8rem', color: '#999', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ShieldCheck size={14} color="#00FF66" />
                            PROTOCOL_SECURITY_NOTICE
                        </h3>
                        <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: '#777', lineHeight: '1.6' }}>
                            <li>All new addresses require <strong>email verification</strong> to activate.</li>
                            <li>A mandatory <strong>24-hour security hold</strong> applies after email confirmation.</li>
                            <li>You can store up to <strong>5 total addresses</strong> in your book.</li>
                            <li>Payouts are always sent to the <strong>PRIMARY</strong> address of the respective chain.</li>
                        </ul>
                    </div>
                </section>

                {/* Right Column: Add Form */}
                <aside>
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <Plus size={16} />
                            Register Destination
                        </h2>

                        <form className={styles.addForm} onSubmit={handleAddAddress}>
                            <div className={styles.inputGroup}>
                                <label>NETWORK_CHAIN</label>
                                <select
                                    className={styles.select}
                                    value={newChain}
                                    onChange={(e) => setNewChain(e.target.value as 'EVM' | 'SOLANA')}
                                >
                                    <option value="EVM">Ethereum / Base / Arbitrum / HyperEVM</option>
                                    <option value="SOLANA">Solana</option>
                                </select>
                            </div>

                            <div className={styles.inputGroup}>
                                <label>WALLET_ADDRESS</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder={newChain === 'EVM' ? "0x..." : "Base58 address..."}
                                    value={newAddress}
                                    onChange={(e) => setNewAddress(e.target.value)}
                                    required
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label>LABEL (OPTIONAL)</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="e.g. Ledger / MetaMask / Phantom"
                                    value={newLabel}
                                    onChange={(e) => setNewLabel(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                className={styles.submitBtn}
                                disabled={submitting || !newAddress}
                            >
                                {submitting ? 'RECOGNIZING...' : 'INITIATE REGISTRATION'}
                            </button>

                            <div className={styles.hint}>
                                Registration triggers a verification link sent to your profile email.
                            </div>
                        </form>
                    </div>

                    <div className={styles.section} style={{ border: '1px dashed rgba(255, 255, 255, 0.1)', background: 'none' }}>
                        <h3 style={{ fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>SYSTEM_TELEMETRY</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                                <span style={{ color: '#555' }}>REGISTRATION_STATUS</span>
                                <span style={{ color: '#00FF66' }}>ACTIVE</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                                <span style={{ color: '#555' }}>HOLD_PERIOD</span>
                                <span style={{ color: '#aaa' }}>24H_CLOCK_SYC</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                                <span style={{ color: '#555' }}>VAULT_LIMIT</span>
                                <span style={{ color: '#aaa' }}>{addresses.length}/5_SLOTS</span>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </main>
    );
}

// Default export wrapped in Suspense for useSearchParams
export default function AddressSettingsPage() {
    return (
        <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: '#666', fontFamily: 'monospace' }}>INITIALIZING_ADDRESS_VAULT...</div>
        </div>}>
            <AddressSettingsContent />
        </Suspense>
    );
}
