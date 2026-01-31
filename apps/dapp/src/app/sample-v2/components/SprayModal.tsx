"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { useUIStore } from "@/store/uiStore";
import styles from "./SprayModal.module.css";
import { SprayRequestSchema } from "@/lib/schemas";
import FirstSprayTour, { useFirstSprayTour } from "./FirstSprayTour";

interface Campaign {
    id: string;
    name: string;
    level: "RAPID" | "MID" | "DEEP";
    tokenSymbol: string;
    roiMultiplier: string;
    entryRange: { min: number; max: number };
}

// Coin and Chain configurations matching deposit page
interface Token {
    id: string;
    symbol: string;
    name: string;
    icon: string;
    color: string;
    chains: string[];
    isSpecial?: boolean; // For BLT which needs special rendering
}

interface Chain {
    id: string;
    name: string;
    icon: string;
    color: string;
    nativeAsset: string;
}

// All supported coins from deposit page
const TOKENS: Token[] = [
    { 
        id: "usdc", 
        symbol: "USDC", 
        name: "USD Coin", 
        icon: "$", 
        color: "#2775CA",
        chains: ["ethereum", "base", "arbitrum", "bsc"] 
    },
    { 
        id: "usdt", 
        symbol: "USDT", 
        name: "Tether USD", 
        icon: "₮", 
        color: "#26A17B",
        chains: ["ethereum", "base", "arbitrum", "bsc"] 
    },
    { 
        id: "eth", 
        symbol: "ETH", 
        name: "Ethereum", 
        icon: "◈", 
        color: "#627EEA",
        chains: ["ethereum", "base", "arbitrum", "hyperevm"] 
    },
    { 
        id: "bnb", 
        symbol: "BNB", 
        name: "BNB", 
        icon: "⬡", 
        color: "#F3BA2F",
        chains: ["bsc"] 
    },
    { 
        id: "sol", 
        symbol: "SOL", 
        name: "Solana", 
        icon: "◎", 
        color: "#14F195",
        chains: ["solana"] 
    },
    { 
        id: "blt", 
        symbol: "BLT", 
        name: "Believe Trust", 
        icon: "B", 
        color: "#14F195",
        chains: ["hyperevm"],
        isSpecial: true
    },
    { 
        id: "hype", 
        symbol: "HYPE", 
        name: "Hyperliquid", 
        icon: "H", 
        color: "#00D4AA",
        chains: ["hyperevm"] 
    },
];

// All supported chains from deposit page
const CHAINS: Chain[] = [
    { id: "ethereum", name: "Ethereum", icon: "◈", color: "#627EEA", nativeAsset: "ETH" },
    { id: "base", name: "Base", icon: "◆", color: "#0052FF", nativeAsset: "ETH" },
    { id: "arbitrum", name: "Arbitrum", icon: "△", color: "#28A0F0", nativeAsset: "ETH" },
    { id: "hyperevm", name: "HyperEVM", icon: "◉", color: "#00FF66", nativeAsset: "ETH" },
    { id: "bsc", name: "BSC", icon: "⬡", color: "#F3BA2F", nativeAsset: "BNB" },
    { id: "solana", name: "Solana", icon: "◎", color: "#14F195", nativeAsset: "SOL" },
];

interface SprayModalProps {
    campaigns: Campaign[];
    user: { id: string; balance: string } | null;
}

export default function SprayModal({ campaigns, user }: SprayModalProps) {
    const router = useRouter();
    const closeModal = useUIStore((state) => state.closeModal);
    const addToast = useUIStore((state) => state.addToast);
    const { shouldShowTour, markTourCompleted } = useFirstSprayTour();

    const [selectedCampaignId, setSelectedCampaignId] = useState<string>(
        campaigns[0]?.id || ""
    );
    const [amount, setAmount] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [depositAddress, setDepositAddress] = useState<string | null>(null);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [isGeneratingAddress, setIsGeneratingAddress] = useState(false);
    const [showDepositOptions, setShowDepositOptions] = useState(false);
    const [selectedToken, setSelectedToken] = useState<string>("usdc");
    const [selectedChain, setSelectedChain] = useState<string>("base");
    const [showTour, setShowTour] = useState(false);

    // Show tour on first spray
    useEffect(() => {
        if (shouldShowTour) {
            setShowTour(true);
        }
    }, [shouldShowTour]);

    const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);
    const userBalance = parseFloat(user?.balance || "0");
    const amountNum = parseFloat(amount) || 0;
    const isInsufficientBalance = amountNum > userBalance;
    const hasZeroBalance = userBalance === 0;

    // Get available chains for selected token
    const availableChains = useMemo(() => {
        const token = TOKENS.find(t => t.id === selectedToken);
        return CHAINS.filter(c => token?.chains.includes(c.id));
    }, [selectedToken]);

    // Update selected chain if not available for new token
    useEffect(() => {
        if (!availableChains.find(c => c.id === selectedChain)) {
            setSelectedChain(availableChains[0]?.id || "base");
            setDepositAddress(null);
            setQrCode(null);
        }
    }, [selectedToken, availableChains, selectedChain]);

    useEffect(() => {
        // Generate deposit address when showing deposit options and selections change
        if (showDepositOptions && user?.id && !isGeneratingAddress) {
            fetchDepositAddress();
        }
    }, [showDepositOptions, selectedToken, selectedChain, user?.id]);

    const fetchDepositAddress = async () => {
        if (!user?.id) return;
        setIsGeneratingAddress(true);
        try {
            const res = await fetch(`/api/deposit-address?userId=${user.id}&chain=${selectedChain}`);
            let data = await res.json();
            let address = data.addresses?.find((a: any) => a.chain === selectedChain)?.address;

            if (!address) {
                const genRes = await fetch("/api/deposit-address", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: user.id, chain: selectedChain }),
                });
                const genData = await genRes.json();
                address = genData.address;
            }

            if (address) {
                setDepositAddress(address);
                const qr = await QRCode.toDataURL(address, { width: 200, margin: 2 });
                setQrCode(qr);
            }
        } catch (err) {
            console.error("Failed to fetch deposit address:", err);
            addToast("Failed to fetch deposit address", "error");
        } finally {
            setIsGeneratingAddress(false);
        }
    };

    const handleSpray = async (e: React.FormEvent) => {
        e.preventDefault();

        const result = SprayRequestSchema.safeParse({
            trenchId: selectedCampaignId,
            amount: amountNum,
            level: selectedCampaign?.level,
        });

        if (!result.success) {
            addToast(result.error.issues[0]?.message || "Invalid input", "error");
            return;
        }

        if (isInsufficientBalance) return;

        setIsSubmitting(true);

        try {
            const res = await fetch("/api/spray", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(result.data),
            });

            const data = await res.json();

            if (res.ok && (data.success || data.data)) {
                closeModal();
                router.push(`/sample-v2/spray/finalize?id=${data.data.sprayEntryId}`);
            } else {
                throw new Error(data.error || "Failed to initiate spray");
            }
        } catch (err: any) {
            addToast(err.message, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isValidAmount =
        amountNum >= (selectedCampaign?.entryRange.min || 0) &&
        amountNum <= (selectedCampaign?.entryRange.max || 1000000);

    const getTrenchColor = (level: string) => {
        switch (level) {
            case "RAPID":
                return styles.rapid;
            case "MID":
                return styles.mid;
            case "DEEP":
                return styles.deep;
            default:
                return "";
        }
    };

    const getTrenchDuration = (level: string) => {
        switch (level) {
            case "RAPID":
                return "1 day";
            case "MID":
                return "7 days";
            case "DEEP":
                return "30 days";
            default:
                return "";
        }
    };

    return (
        <div className={styles.overlay} onClick={closeModal}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <div className={styles.statusBadge}>
                            <span className={styles.statusDot} />
                            Deploy Liquidity
                        </div>
                        <h2 className={styles.title}>Spray Portal</h2>
                        <p className={styles.subtitle}>
                            Select a campaign trench and deploy funds to start earning
                        </p>
                    </div>
                    <button className={styles.closeBtn} onClick={closeModal} aria-label="Close modal">
                        ×
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSpray} className={styles.form}>
                    {/* Step 1: Campaign Selection */}
                    <div className={styles.section} data-tour="trench-select">
                        <label className={styles.sectionLabel}>
                            <span className={styles.stepNumber}>1</span>
                            Select Target Trench
                        </label>
                        <div className={styles.campaignGrid}>
                            {campaigns.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    className={`${styles.campaignCard} ${
                                        selectedCampaignId === c.id ? styles.active : ""
                                    } ${getTrenchColor(c.level)}`}
                                    onClick={() => setSelectedCampaignId(c.id)}
                                >
                                    <div className={styles.campaignHeader}>
                                        <span className={`${styles.levelBadge} ${getTrenchColor(c.level)}`}>
                                            {c.level}
                                        </span>
                                        <span className={styles.roiBadge}>
                                            {parseFloat(c.roiMultiplier).toFixed(1)}x ROI
                                        </span>
                                    </div>
                                    <span className={styles.campaignName}>{c.name}</span>
                                    <div className={styles.campaignMeta}>
                                        <span className={styles.durationBadge}>
                                            ⏱ {getTrenchDuration(c.level)}
                                        </span>
                                        <span className={styles.tokenSymbol}>{c.tokenSymbol}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Step 2: Amount */}
                    <div className={styles.section} data-tour="amount-input">
                        <div className={styles.labelRow}>
                            <label className={styles.sectionLabel}>
                                <span className={styles.stepNumber}>2</span>
                                Entry Amount
                            </label>
                            <span className={styles.balance}>
                                Balance: <strong>${userBalance.toFixed(2)}</strong>
                            </span>
                        </div>
                        <div className={styles.inputWrapper}>
                            <span className={styles.currency}>$</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder={`Min $${selectedCampaign?.entryRange.min || 0}`}
                                className={styles.input}
                                min={selectedCampaign?.entryRange.min}
                                max={selectedCampaign?.entryRange.max}
                                step="0.01"
                                required
                            />
                            <button
                                type="button"
                                className={styles.maxBtn}
                                onClick={() => setAmount(userBalance.toString())}
                            >
                                MAX
                            </button>
                        </div>
                        {selectedCampaign && (
                            <p className={styles.limitHint}>
                                Entry range: ${selectedCampaign.entryRange.min.toLocaleString()} - ${" "}
                                {selectedCampaign.entryRange.max.toLocaleString()} USDC
                            </p>
                        )}
                    </div>

                    {/* Zero Balance State */}
                    {hasZeroBalance && (
                        <div className={styles.zeroBalanceSection}>
                            <div className={styles.zeroBalanceHeader}>
                                <span className={styles.zeroBalanceIcon}>💰</span>
                                <div>
                                    <h4>Fund Your Account</h4>
                                    <p>You need USDC in your platform balance to spray</p>
                                </div>
                            </div>

                            {!showDepositOptions ? (
                                <button
                                    type="button"
                                    className={styles.showDepositBtn}
                                    onClick={() => setShowDepositOptions(true)}
                                >
                                    Show Deposit Options
                                </button>
                            ) : (
                                <div className={styles.depositOptions}>
                                    {/* Compact Token + Chain Selector */}
                                    <div className={styles.depositSelectorRow}>
                                        <div className={styles.selectorGroup}>
                                            <label className={styles.selectorLabel}>Token ({TOKENS.length} options)</label>
                                            <div className={styles.tokenGrid}>
                                                {TOKENS.map((token) => (
                                                    <button
                                                        key={token.id}
                                                        type="button"
                                                        className={`${styles.tokenChip} ${
                                                            selectedToken === token.id ? styles.active : ""
                                                        }`}
                                                        onClick={() => setSelectedToken(token.id)}
                                                        title={`${token.name} - Available on: ${token.chains.map(c => CHAINS.find(ch => ch.id === c)?.name).join(', ')}`}
                                                    >
                                                        <span 
                                                            className={styles.tokenIcon}
                                                            style={{ 
                                                                color: token.color,
                                                                background: `${token.color}15`
                                                            }}
                                                        >
                                                            {token.icon}
                                                        </span>
                                                        <span className={styles.tokenSymbol}>{token.symbol}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className={styles.selectorGroup}>
                                            <label className={styles.selectorLabel}>
                                                Network 
                                                {availableChains.length > 0 && (
                                                    <span className={styles.chainCount}>({availableChains.length})</span>
                                                )}
                                            </label>
                                            <div className={styles.chainGrid}>
                                                {availableChains.map((chain) => (
                                                    <button
                                                        key={chain.id}
                                                        type="button"
                                                        className={`${styles.chainChip} ${
                                                            selectedChain === chain.id ? styles.active : ""
                                                        }`}
                                                        onClick={() => {
                                                            setSelectedChain(chain.id);
                                                            setDepositAddress(null);
                                                        }}
                                                    >
                                                        <span 
                                                            className={styles.chainIconSmall}
                                                            style={{ color: chain.color }}
                                                        >
                                                            {chain.icon}
                                                        </span>
                                                        <span>{chain.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                            {availableChains.length === 0 && selectedToken && (
                                                <p className={styles.noChainsMessage}>
                                                    Select a token to see available networks
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* QR Code Deposit */}
                                    <div className={styles.qrSection}>
                                        <p className={styles.qrLabel}>
                                            Send {TOKENS.find(t => t.id === selectedToken)?.symbol} on {CHAINS.find(c => c.id === selectedChain)?.name}
                                        </p>
                                        {isGeneratingAddress ? (
                                            <div className={styles.qrPlaceholder}>
                                                <div className={styles.spinner} />
                                                <span>Generating address...</span>
                                            </div>
                                        ) : qrCode ? (
                                            <>
                                                <div className={styles.qrWrapper}>
                                                    <img src={qrCode} alt="Deposit QR" className={styles.qrImage} />
                                                </div>
                                                <div className={styles.addressBox}>
                                                    <code className={styles.address}>{depositAddress}</code>
                                                    <button
                                                        type="button"
                                                        className={styles.copyBtn}
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(depositAddress || "");
                                                            addToast("Address copied", "success");
                                                        }}
                                                    >
                                                        Copy
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <p className={styles.errorText}>Could not generate deposit address</p>
                                        )}
                                    </div>

                                    <div className={styles.depositDivider}>
                                        <span>or</span>
                                    </div>

                                    {/* Direct Deposit Link */}
                                    <Link
                                        href="/sample-v2/deposit"
                                        className={styles.depositLink}
                                        onClick={closeModal}
                                    >
                                        <span>Go to Deposit Page</span>
                                        <span>→</span>
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Insufficient Balance (but has some) */}
                    {isInsufficientBalance && !hasZeroBalance && amountNum > 0 && (
                        <div className={styles.depositSection}>
                            <div className={styles.depositHeader}>
                                <span className={styles.warningIcon}>⚠️</span>
                                <div className={styles.depositHeaderText}>
                                    <h4>Insufficient Balance</h4>
                                    <p>You need ${(amountNum - userBalance).toFixed(2)} more</p>
                                </div>
                            </div>

                            <Link
                                href="/sample-v2/deposit"
                                className={styles.addFundsBtn}
                                onClick={closeModal}
                            >
                                Add Funds →
                            </Link>
                        </div>
                    )}

                    {/* Projection */}
                    {!isInsufficientBalance && amountNum > 0 && (
                        <div className={styles.projection}>
                            <div className={styles.projRow}>
                                <span>You Deploy</span>
                                <span className={styles.projValue}>${amountNum.toFixed(2)}</span>
                            </div>
                            <div className={styles.projDivider} />
                            <div className={styles.projRow}>
                                <span>Expected Return</span>
                                <span className={styles.returnValue}>
                                    ${(amountNum * (parseFloat(selectedCampaign?.roiMultiplier || "1.5"))).toFixed(2)}
                                </span>
                            </div>
                            <div className={styles.projRow}>
                                <span>Net Profit</span>
                                <span className={styles.profitValue}>
                                    +${(amountNum * (parseFloat(selectedCampaign?.roiMultiplier || "1.5") - 1)).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Submit */}
                    <div data-tour="review-section">
                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={isSubmitting || !isValidAmount || isInsufficientBalance}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className={styles.btnSpinner} />
                                    Processing...
                                </>
                            ) : isInsufficientBalance ? (
                                "Waiting for Funds..."
                            ) : (
                                "Confirm & Spray"
                            )}
                        </button>
                    </div>

                    <p className={styles.footerNote}>
                        Funds will be time-locked based on trench level.{" "}
                        <a href="/sample-v2/spray" className={styles.fullPageLink} onClick={closeModal}>
                            Open full page →
                        </a>
                    </p>
                </form>
            </div>

            {/* First Spray Tour */}
            <FirstSprayTour
                isOpen={showTour}
                onClose={() => {
                    setShowTour(false);
                    markTourCompleted();
                }}
            />
        </div>
    );
}
