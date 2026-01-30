"use client";

import React from 'react';
import styles from './page.module.css';
import { Chain } from './ChainSelector';

interface GenerateButtonProps {
    chain: Chain;
    onClick: () => void;
    isLoading: boolean;
}

const CHAIN_NAMES: Record<string, string> = {
    ethereum: "Ethereum",
    base: "Base",
    arbitrum: "Arbitrum",
    hyperevm: "HyperEVM",
    solana: "Solana",
};

export function GenerateButton({ chain, onClick, isLoading }: GenerateButtonProps) {
    return (
        <div className={styles.generateContainer}>
            <div className={styles.generateInfo}>
                <h3>Generate {CHAIN_NAMES[chain]} Address</h3>
                <p>This will create a unique, platform-monitored deposit address for your account on {CHAIN_NAMES[chain]}.</p>
            </div>
            <button
                className={styles.generateBtn}
                onClick={onClick}
                disabled={isLoading}
            >
                {isLoading ? (
                    <>
                        <span className={styles.spinner}></span>
                        Generating...
                    </>
                ) : (
                    `Generate ${CHAIN_NAMES[chain]} Address`
                )}
            </button>
            <div className={styles.generateSafety}>
                <span className={styles.safetyIcon}>🛡</span>
                <span>Secured by deterministic HD wallet derivation</span>
            </div>
        </div>
    );
}
