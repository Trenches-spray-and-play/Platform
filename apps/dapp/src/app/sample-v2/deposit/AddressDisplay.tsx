"use client";

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import styles from './page.module.css';
import { Chain } from './ChainSelector';

interface AddressDisplayProps {
    chain: Chain;
    address: string;
    onBack: () => void;
    copiedAddress: string | null;
    onCopy: (address: string) => void;
}

const CHAIN_NAMES: Record<string, string> = {
    ethereum: "Ethereum",
    base: "Base",
    arbitrum: "Arbitrum",
    hyperevm: "HyperEVM",
    bsc: process.env.NEXT_PUBLIC_USE_TESTNET === 'true' ? "BSC Testnet (BEP20)" : "BSC (BEP20)",
    solana: "Solana",
};

const EXPLORER_URLS: Record<Chain, string> = {
    ethereum: 'https://etherscan.io/address/',
    base: 'https://basescan.org/address/',
    arbitrum: 'https://arbiscan.io/address/',
    hyperevm: 'https://hyperevmscan.io/address/',
    bsc: process.env.NEXT_PUBLIC_USE_TESTNET === 'true'
        ? 'https://testnet.bscscan.com/address/'
        : 'https://bscscan.com/address/',
    solana: 'https://solscan.io/account/',
};

export function AddressDisplay({ chain, address, onBack, copiedAddress, onCopy }: AddressDisplayProps) {
    const [qrDataUrl, setQrDataUrl] = useState<string>('');

    useEffect(() => {
        QRCode.toDataURL(address, {
            width: 200,
            margin: 2,
            color: {
                dark: '#000000',   // Black QR
                light: '#00FF66',  // Green background
            },
        })
            .then(setQrDataUrl)
            .catch(err => console.error('QR Generation Error:', err));
    }, [address]);

    const explorerUrl = EXPLORER_URLS[chain] + address;

    return (
        <div className={styles.addressDisplay}>
            <div className={styles.displayHeader}>
                <button onClick={onBack} className={styles.backLink}>
                    ← Change Network
                </button>
                <div className={styles.chainBadge}>
                    Network: <strong>{CHAIN_NAMES[chain]}</strong>
                </div>
            </div>

            <div className={styles.qrSection}>
                <div className={styles.qrWrapper}>
                    {qrDataUrl ? (
                        <img src={qrDataUrl} alt="Deposit QR Code" className={styles.qrImage} />
                    ) : (
                        <div className={styles.qrPlaceholder}>Generating QR...</div>
                    )}
                </div>
                <p className={styles.qrHint}>Scan with your mobile wallet</p>
            </div>

            <div className={styles.addressSection}>
                <label>Your {CHAIN_NAMES[chain]} Deposit Address</label>
                <div className={styles.addressInputGroup}>
                    <code className={styles.addressText}>{address}</code>
                    <button
                        className={styles.copyIconButton}
                        onClick={() => onCopy(address)}
                    >
                        {copiedAddress === address ? "Copied!" : "Copy"}
                    </button>
                </div>
            </div>

            <div className={styles.actionSection}>
                <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.explorerBtn}
                >
                    View on Explorer ↗
                </a>
            </div>

            <div className={styles.warningBox}>
                <span className={styles.warningIcon}>⚠️</span>
                <div className={styles.warningContent}>
                    <strong>Important Warning</strong>
                    <p>Send only {CHAIN_NAMES[chain]} assets to this address. Sending assets from other networks may result in permanent loss of funds.</p>
                </div>
            </div>
        </div>
    );
}
