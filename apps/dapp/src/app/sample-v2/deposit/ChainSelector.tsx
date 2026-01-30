"use client";

import React from 'react';
import styles from './page.module.css';

export type Chain = 'ethereum' | 'base' | 'arbitrum' | 'hyperevm' | 'bsc' | 'solana';

interface ChainSelectorProps {
    chains: Chain[];
    existingAddresses: string[]; // List of chains that already have addresses
    onSelect: (chain: Chain) => void;
    selectedChain: Chain | null;
}

const CHAIN_ICONS: Record<string, string> = {
    ethereum: "◈",
    base: "◆",
    arbitrum: "△",
    hyperevm: "◉",
    bsc: "⬡",
    solana: "◎",
};

const CHAIN_NAMES: Record<string, string> = {
    ethereum: "Ethereum",
    base: "Base",
    arbitrum: "Arbitrum",
    hyperevm: "HyperEVM",
    bsc: "BSC (BEP20)",
    solana: "Solana",
};

export function ChainSelector({ chains, existingAddresses, onSelect, selectedChain }: ChainSelectorProps) {
    return (
        <div className={styles.chainGrid}>
            {chains.map((chain) => {
                const isExisting = existingAddresses.includes(chain);
                const isSelected = selectedChain === chain;

                return (
                    <div
                        key={chain}
                        className={`${styles.chainOption} ${isSelected ? styles.selectedChain : ''} ${isExisting ? styles.hasAddress : ''}`}
                        onClick={() => onSelect(chain)}
                    >
                        <span className={styles.chainIcon} data-chain={chain}>{CHAIN_ICONS[chain]}</span>
                        <div className={styles.chainDetails}>
                            <span className={styles.chainName}>{CHAIN_NAMES[chain]}</span>
                            <span className={styles.chainSubtext}>
                                {isExisting ? 'Connected' : 'Not Generated'}
                            </span>
                        </div>
                        {isExisting && (
                            <span className={styles.checkmark}>✓</span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
