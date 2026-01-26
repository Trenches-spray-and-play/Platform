"use client";

import { useState, useEffect } from 'react';
import styles from './DepositPortal.module.css';
import { useAuth } from '@/components/AuthProvider';

type Token = 'BLT' | 'ETH' | 'USDT' | 'USDC' | 'SOL';
type Chain = 'ethereum' | 'base' | 'arbitrum' | 'hyperevm' | 'solana';

const TOKEN_CHAINS: Record<Token, Chain[]> = {
    BLT: ['hyperevm'],
    ETH: ['ethereum', 'base', 'arbitrum'],
    USDT: ['ethereum', 'base', 'arbitrum', 'hyperevm', 'solana'],
    USDC: ['ethereum', 'base', 'arbitrum', 'hyperevm', 'solana'],
    SOL: ['solana'],
};

const CHAIN_LABELS: Record<Chain, string> = {
    ethereum: 'Ethereum',
    base: 'Base',
    arbitrum: 'Arbitrum',
    hyperevm: 'HyperEVM',
    solana: 'Solana',
};

interface DepositPortalProps {
    userId: string;
    currentBalance: number;
}

export default function DepositPortal({ userId, currentBalance }: DepositPortalProps) {
    const [selectedToken, setSelectedToken] = useState<Token | null>(null);
    const [selectedChain, setSelectedChain] = useState<Chain | null>(null);
    const [depositAddress, setDepositAddress] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    // Reset chain when token changes
    useEffect(() => {
        setSelectedChain(null);
        setDepositAddress(null);
    }, [selectedToken]);

    // Fetch deposit address when chain selected
    useEffect(() => {
        if (selectedChain && userId) {
            fetchDepositAddress();
        }
    }, [selectedChain, userId]);

    const fetchDepositAddress = async () => {
        if (!selectedChain || !userId) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/deposit-address?chain=${selectedChain}&userId=${userId}`);
            const data = await res.json();
            if (data.address) {
                setDepositAddress(data.address);
            } else if (data.error) {
                console.error('Deposit address error:', data.error);
            }
        } catch (error) {
            console.error('Failed to fetch deposit address:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyAddress = () => {
        if (depositAddress) {
            navigator.clipboard.writeText(depositAddress);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const availableChains = selectedToken ? TOKEN_CHAINS[selectedToken] : [];

    return (
        <div className={styles.portal}>
            <div className={styles.header}>
                <h3 className={styles.title}>DEPOSIT</h3>
                <div className={styles.balance}>
                    <span className={styles.balanceLabel}>BALANCE</span>
                    <span className={styles.balanceValue}>${currentBalance.toFixed(2)}</span>
                </div>
            </div>

            {/* Token Selection */}
            <div className={styles.section}>
                <label className={styles.label}>SELECT TOKEN</label>
                <div className={styles.tokenGrid}>
                    {(Object.keys(TOKEN_CHAINS) as Token[]).map(token => (
                        <button
                            key={token}
                            className={`${styles.tokenBtn} ${selectedToken === token ? styles.selected : ''}`}
                            onClick={() => setSelectedToken(token)}
                        >
                            {token}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chain Selection */}
            {selectedToken && (
                <div className={styles.section}>
                    <label className={styles.label}>SELECT CHAIN</label>
                    <div className={styles.chainGrid}>
                        {availableChains.map(chain => (
                            <button
                                key={chain}
                                className={`${styles.chainBtn} ${selectedChain === chain ? styles.selected : ''}`}
                                onClick={() => setSelectedChain(chain)}
                            >
                                {CHAIN_LABELS[chain]}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Deposit Address */}
            {selectedChain && (
                <div className={styles.section}>
                    <label className={styles.label}>
                        SEND {selectedToken} ON {CHAIN_LABELS[selectedChain].toUpperCase()}
                    </label>

                    {loading ? (
                        <div className={styles.loading}>Loading address...</div>
                    ) : depositAddress ? (
                        <div className={styles.addressBox}>
                            <div className={styles.chainBadge}>{CHAIN_LABELS[selectedChain]}</div>
                            <div className={styles.address}>{depositAddress}</div>
                            <button className={styles.copyBtn} onClick={copyAddress}>
                                {copied ? '✓ COPIED' : 'COPY'}
                            </button>
                        </div>
                    ) : (
                        <div className={styles.error}>Unable to generate address</div>
                    )}
                </div>
            )}

            <p className={styles.note}>
                Deposits are automatically converted to USD balance.
            </p>
        </div>
    );
}
