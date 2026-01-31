"use client";

import styles from "./ChainSelector.module.css";

export type ChainId = "ethereum" | "base" | "arbitrum" | "hyperevm" | "bsc" | "solana";

export interface Chain {
    id: ChainId;
    name: string;
    icon: string;
    color: string;
}

export const CHAINS: Chain[] = [
    { id: "ethereum", name: "Ethereum", icon: "◈", color: "#627EEA" },
    { id: "base", name: "Base", icon: "◆", color: "#0052FF" },
    { id: "arbitrum", name: "Arbitrum", icon: "△", color: "#28A0F0" },
    { id: "hyperevm", name: "HyperEVM", icon: "◉", color: "#00FF66" },
    { id: "bsc", name: "BSC", icon: "⬡", color: "#F3BA2F" },
    { id: "solana", name: "Solana", icon: "◎", color: "#14F195" },
];

interface ChainSelectorProps {
    selectedChain: ChainId | null;
    onSelect: (chainId: ChainId) => void;
    disabled?: boolean;
}

export default function ChainSelector({
    selectedChain,
    onSelect,
    disabled = false,
}: ChainSelectorProps) {
    return (
        <div className={styles.container}>
            <label className={styles.label}>Select Network</label>
            <div className={styles.grid}>
                {CHAINS.map((chain) => (
                    <button
                        key={chain.id}
                        type="button"
                        className={`${styles.chainBtn} ${selectedChain === chain.id ? styles.active : ""} ${disabled ? styles.disabled : ""
                            }`}
                        onClick={() => !disabled && onSelect(chain.id)}
                        disabled={disabled}
                    >
                        <span
                            className={styles.icon}
                            style={{ color: chain.color, background: `${chain.color}15` }}
                        >
                            {chain.icon}
                        </span>
                        <span className={styles.name}>{chain.name}</span>
                        {selectedChain === chain.id && <span className={styles.checkmark}>✓</span>}
                    </button>
                ))}
            </div>
        </div>
    );
}
