"use client";

import React, { useState } from 'react';
import styles from './CampaignForm.module.css';
import PayoutPauseBanner from './PayoutPauseBanner';

interface AcceptedToken {
    address: string;
    symbol: string;
    chainId: number;
}

interface Campaign {
    name: string;
    trenchIds: string[];
    tokenAddress: string;
    tokenSymbol: string;
    tokenDecimals: number;
    chainId: number;
    chainName: string;
    acceptedTokens: AcceptedToken[];
    roiMultiplier: number;
    manualPrice: string;
    useOracle: boolean;
    oracleSource: string;
    reserveRoundingUnit: number;
    isPaused: boolean;
    payoutIntervalSeconds: number;
    startsAt: string;
    acceptDepositsBeforeStart: boolean;
    isActive: boolean;
    isHidden: boolean;
}

interface CampaignFormProps {
    campaign: Campaign;
    campaignId?: string; // For fetching queue stats
    isEditing: boolean;
    onSave: (campaign: Campaign) => void;
    onCancel: () => void;
    saving: boolean;
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

const ROUNDING_OPTIONS = [
    { value: 1000, label: '1K' },
    { value: 100000, label: '100K' },
    { value: 1000000, label: '1M' },
    { value: 10000000, label: '10M' },
    { value: 100000000, label: '100M' },
    { value: 1000000000, label: '1B' },
];

export default function CampaignForm({ campaign, campaignId, isEditing, onSave, onCancel, saving }: CampaignFormProps) {
    const [formData, setFormData] = useState<Campaign>(campaign);
    const [walletTokens, setWalletTokens] = useState<{ chainId: number; chainName: string; tokens: { address: string; symbol: string; balance: string; decimals: number }[] }[]>([]);
    const [scanning, setScanning] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);

    const handleResumePayout = () => {
        setFormData(prev => ({ ...prev, isPaused: false }));
    };

    const scanWallet = async () => {
        setScanning(true);
        setScanError(null);
        try {
            const res = await fetch('/api/admin/wallet-tokens');
            const data = await res.json();
            if (data.success) {
                setWalletTokens(data.data);
                if (data.data.length === 0) {
                    setScanError('No tokens found in settlement wallet');
                }
            } else {
                setScanError(data.error || 'Failed to scan wallet');
            }
        } catch {
            setScanError('Failed to connect to wallet scanner');
        } finally {
            setScanning(false);
        }
    };

    const selectToken = (chainId: number, chainName: string, token: { address: string; symbol: string; decimals: number }) => {
        setFormData(prev => ({
            ...prev,
            tokenAddress: token.address,
            tokenSymbol: token.symbol,
            tokenDecimals: token.decimals,
            chainId,
            chainName,
        }));
    };

    const handleChange = (field: keyof Campaign, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleTrench = (trenchId: string) => {
        const current = formData.trenchIds;
        const next = current.includes(trenchId)
            ? current.filter(id => id !== trenchId)
            : [...current, trenchId];
        handleChange('trenchIds', next);
    };

    const addAcceptedToken = (token: AcceptedToken) => {
        if (formData.acceptedTokens.some(t => t.address === token.address && t.chainId === token.chainId)) return;
        handleChange('acceptedTokens', [...formData.acceptedTokens, token]);
    };

    const removeAcceptedToken = (index: number) => {
        handleChange('acceptedTokens', formData.acceptedTokens.filter((_, i) => i !== index));
    };

    return (
        <div className={styles.formCard}>
            <div className={styles.formHeader}>
                <h3 className={styles.formTitle}>{isEditing ? 'RECONFIGURE CAMPAIGN' : 'INITIALIZE NEW CAMPAIGN'}</h3>
                <p className={styles.formSubtitle}>Deploy protocol parameters and coordination incentives</p>
            </div>

            <div className={styles.formLayout}>
                {/* Left Column: Core Identity */}
                <div className={styles.column}>
                    <section className={styles.section}>
                        <h4 className={styles.sectionTitle}>CORE IDENTITY</h4>
                        <div className={styles.field}>
                            <label className={styles.label}>CAMPAIGN NAME</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                placeholder="e.g. BLT ALPHA STREAK"
                            />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>ASSIGNED TRENCHES</label>
                            <div className={styles.trenchGrid}>
                                {TRENCH_OPTIONS.map(t => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        className={`${styles.trenchBtn} ${formData.trenchIds.includes(t.id) ? styles.active : ''}`}
                                        onClick={() => toggleTrench(t.id)}
                                    >
                                        {t.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className={styles.section}>
                        <h4 className={styles.sectionTitle}>SETTLEMENT TOKEN</h4>
                        <p className={styles.hint}>Token used for payouts to participants</p>

                        {/* Wallet Scanner */}
                        <div className={styles.field}>
                            <button
                                type="button"
                                className={styles.scanBtn}
                                onClick={scanWallet}
                                disabled={scanning}
                            >
                                {scanning ? 'SCANNING WALLET...' : 'SCAN SETTLEMENT WALLET'}
                            </button>
                            {scanError && <p className={styles.errorHint}>{scanError}</p>}
                        </div>

                        {/* Scanned Tokens */}
                        {walletTokens.length > 0 && (
                            <div className={styles.walletTokensGrid}>
                                {walletTokens.map(chain => (
                                    <div key={chain.chainId} className={styles.chainGroup}>
                                        <h5 className={styles.chainLabel}>{chain.chainName}</h5>
                                        <div className={styles.tokenGrid}>
                                            {chain.tokens.map(token => (
                                                <button
                                                    key={token.address}
                                                    type="button"
                                                    className={`${styles.tokenBtn} ${formData.tokenAddress === token.address && formData.chainId === chain.chainId ? styles.selected : ''}`}
                                                    onClick={() => selectToken(chain.chainId, chain.chainName, token)}
                                                >
                                                    <span className={styles.tokenSymbol}>{token.symbol}</span>
                                                    <span className={styles.tokenBalance}>{parseFloat(token.balance).toLocaleString()}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className={styles.fieldGroup}>
                            <div className={styles.field}>
                                <label className={styles.label}>TOKEN SYMBOL</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={formData.tokenSymbol}
                                    onChange={(e) => handleChange('tokenSymbol', e.target.value)}
                                    placeholder="BLT"
                                />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>DECIMALS</label>
                                <input
                                    type="number"
                                    className={styles.input}
                                    value={formData.tokenDecimals}
                                    onChange={(e) => handleChange('tokenDecimals', parseInt(e.target.value) || 18)}
                                />
                            </div>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>SETTLEMENT CHAIN</label>
                            <select
                                className={styles.input}
                                value={formData.chainId}
                                onChange={(e) => {
                                    const chainId = parseInt(e.target.value);
                                    const chain = CHAIN_OPTIONS.find(c => c.id === chainId);
                                    setFormData(prev => ({
                                        ...prev,
                                        chainId,
                                        chainName: chain?.name || 'Unknown'
                                    }));
                                }}
                            >
                                {CHAIN_OPTIONS.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>CONTRACT ADDRESS</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={formData.tokenAddress}
                                onChange={(e) => handleChange('tokenAddress', e.target.value)}
                                placeholder="0x..."
                            />
                        </div>
                    </section>
                </div>

                {/* Middle Column: Economic Parameters */}
                <div className={styles.column}>
                    <section className={styles.section}>
                        <h4 className={styles.sectionTitle}>ECONOMIC PARAMETERS</h4>
                        <div className={styles.field}>
                            <label className={styles.label}>ROI MULTIPLIER (x)</label>
                            <input
                                type="number"
                                step="0.1"
                                className={styles.input}
                                value={formData.roiMultiplier}
                                onChange={(e) => handleChange('roiMultiplier', parseFloat(e.target.value) || 1.5)}
                            />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>RESERVE ROUNDING UNIT</label>
                            <select
                                className={styles.input}
                                value={formData.reserveRoundingUnit}
                                onChange={(e) => handleChange('reserveRoundingUnit', parseInt(e.target.value))}
                            >
                                {ROUNDING_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>VALUATION SOURCE</label>
                            <div className={styles.toggleRow}>
                                <button
                                    type="button"
                                    className={`${styles.toggleBtn} ${!formData.useOracle ? styles.active : ''}`}
                                    onClick={() => handleChange('useOracle', false)}
                                >
                                    MANUAL
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.toggleBtn} ${formData.useOracle ? styles.active : ''}`}
                                    onClick={() => handleChange('useOracle', true)}
                                >
                                    ORACLE
                                </button>
                            </div>
                        </div>
                        {!formData.useOracle ? (
                            <div className={styles.field}>
                                <label className={styles.label}>MANUAL PRICE (USD)</label>
                                <input
                                    type="number"
                                    step="0.00000001"
                                    className={styles.input}
                                    value={formData.manualPrice}
                                    onChange={(e) => handleChange('manualPrice', e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                        ) : (
                            <div className={styles.field}>
                                <label className={styles.label}>ORACLE PROVIDER</label>
                                <select
                                    className={styles.input}
                                    value={formData.oracleSource}
                                    onChange={(e) => handleChange('oracleSource', e.target.value)}
                                >
                                    <option value="coingecko">Coingecko</option>
                                    <option value="chainlink">Chainlink</option>
                                    <option value="pyth">Pyth Network</option>
                                </select>
                            </div>
                        )}
                    </section>

                    <section className={styles.section}>
                        <h4 className={styles.sectionTitle}>PROTOCOL STATE</h4>
                        <div className={styles.field}>
                            <label className={styles.label}>CAMPAIGN VISIBILITY</label>
                            <div className={styles.toggleRow}>
                                <button
                                    type="button"
                                    className={`${styles.toggleBtn} ${formData.isActive ? styles.active : ''}`}
                                    onClick={() => handleChange('isActive', true)}
                                >
                                    ACTIVE
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.toggleBtn} ${!formData.isActive ? styles.danger : ''}`}
                                    onClick={() => handleChange('isActive', false)}
                                >
                                    INACTIVE
                                </button>
                            </div>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>HOMEPAGE DISPLAY</label>
                            <div className={styles.toggleRow}>
                                <button
                                    type="button"
                                    className={`${styles.toggleBtn} ${!formData.isHidden ? styles.active : ''}`}
                                    onClick={() => handleChange('isHidden', false)}
                                >
                                    VISIBLE
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.toggleBtn} ${formData.isHidden ? styles.danger : ''}`}
                                    onClick={() => handleChange('isHidden', true)}
                                >
                                    HIDDEN
                                </button>
                            </div>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>PAYOUT COORDINATION</label>
                            <div className={styles.toggleRow}>
                                <button
                                    type="button"
                                    className={`${styles.toggleBtn} ${!formData.isPaused ? styles.active : ''}`}
                                    onClick={() => handleChange('isPaused', false)}
                                >
                                    RUNNING
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.toggleBtn} ${formData.isPaused ? styles.danger : ''}`}
                                    onClick={() => handleChange('isPaused', true)}
                                >
                                    PAUSED
                                </button>
                            </div>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>PAYOUT INTERVAL: {formData.payoutIntervalSeconds}s</label>
                            <input
                                type="range"
                                min="1"
                                max="60"
                                className={styles.range}
                                value={formData.payoutIntervalSeconds}
                                onChange={(e) => handleChange('payoutIntervalSeconds', parseInt(e.target.value))}
                            />
                        </div>
                    </section>
                </div>

                {/* Right Column: Scheduling & Tokens */}
                <div className={styles.column}>
                    <section className={styles.section}>
                        <h4 className={styles.sectionTitle}>SCHEDULING</h4>
                        <div className={styles.field}>
                            <label className={styles.label}>START TIMESTAMP</label>
                            <input
                                type="datetime-local"
                                className={styles.input}
                                value={formData.startsAt}
                                onChange={(e) => handleChange('startsAt', e.target.value)}
                            />
                            <p className={styles.hint}>Null for immediate activation</p>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>WAITLIST DEPOSITS</label>
                            <div className={styles.toggleRow}>
                                <button
                                    type="button"
                                    className={`${styles.toggleBtn} ${formData.acceptDepositsBeforeStart ? styles.active : ''}`}
                                    onClick={() => handleChange('acceptDepositsBeforeStart', true)}
                                >
                                    ENABLED
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.toggleBtn} ${!formData.acceptDepositsBeforeStart ? styles.active : ''}`}
                                    onClick={() => handleChange('acceptDepositsBeforeStart', false)}
                                >
                                    DISABLED
                                </button>
                            </div>
                        </div>
                    </section>

                    <section className={styles.section}>
                        <h4 className={styles.sectionTitle}>ENTRY WHITELIST</h4>
                        <div className={styles.tokenList}>
                            {formData.acceptedTokens.map((token, idx) => (
                                <div key={idx} className={styles.tokenItem}>
                                    <div>
                                        <div className={styles.tokenPrimary}>{token.symbol}</div>
                                        <div className={styles.tokenSecondary}>{CHAIN_OPTIONS.find(c => c.id === token.chainId)?.name}</div>
                                    </div>
                                    <button
                                        type="button"
                                        className={styles.removeBtn}
                                        onClick={() => removeAcceptedToken(idx)}
                                    >
                                        REMOVE
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className={styles.presetGrid}>
                            {PRESET_TOKENS.map((token, idx) => {
                                const isAdded = formData.acceptedTokens.some(
                                    t => t.address === token.address && t.chainId === token.chainId
                                );
                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        className={`${styles.presetBtn} ${isAdded ? styles.added : ''}`}
                                        onClick={() => !isAdded && addAcceptedToken({
                                            address: token.address,
                                            symbol: token.symbol,
                                            chainId: token.chainId
                                        })}
                                        disabled={isAdded}
                                    >
                                        + {token.symbol}
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                </div>
            </div>

            {/* Payout Pause Banner - shows at bottom when paused or has failures */}
            {campaignId && isEditing && (
                <PayoutPauseBanner
                    campaignId={campaignId}
                    isPaused={formData.isPaused}
                    onResume={handleResumePayout}
                />
            )}

            <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={onCancel}>CANCEL</button>
                <button
                    type="button"
                    className={styles.saveBtn}
                    onClick={() => onSave(formData)}
                    disabled={saving}
                >
                    {saving ? 'COMMITTING...' : 'SAVE CONFIGURATION'}
                </button>
            </div>
        </div>
    );
}
