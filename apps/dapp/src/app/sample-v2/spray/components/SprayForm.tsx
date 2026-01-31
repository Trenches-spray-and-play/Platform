"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import ChainSelector, { ChainId, CHAINS } from "./ChainSelector";
import styles from "./SprayForm.module.css";
import { useUIStore } from "@/store/uiStore";
import { SprayRequestSchema } from "@/lib/schemas";
import { validateOrToast } from "@/lib/validation";

interface Campaign {
    id: string;
    name: string;
    level: "RAPID" | "MID" | "DEEP";
    tokenSymbol: string;
    roiMultiplier: string;
    entryRange: { min: number; max: number };
}

interface UserProfile {
    id: string;
    balance: string;
}

interface SprayFormProps {
    campaigns: Campaign[];
    user: UserProfile | null;
}

export default function SprayForm({ campaigns, user }: SprayFormProps) {
    const addToast = useUIStore((state) => state.addToast);
    const router = useRouter();
    const [selectedCampaignId, setSelectedCampaignId] = useState<string>(
        campaigns[0]?.id || ""
    );
    const [amount, setAmount] = useState<string>("");
    const [selectedChain, setSelectedChain] = useState<ChainId>("hyperevm");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [depositAddress, setDepositAddress] = useState<string | null>(null);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [isGeneratingAddress, setIsGeneratingAddress] = useState(false);

    const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);
    const userBalance = parseFloat(user?.balance || "0");
    const amountNum = parseFloat(amount) || 0;
    const isInsufficientBalance = amountNum > userBalance;

    useEffect(() => {
        if (isInsufficientBalance && selectedChain && user?.id) {
            fetchDepositAddress();
        } else {
            setDepositAddress(null);
            setQrCode(null);
        }
    }, [isInsufficientBalance, selectedChain, user?.id]);

    const fetchDepositAddress = async () => {
        if (!user?.id || !selectedChain) return;
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

        const payload = validateOrToast(SprayRequestSchema, {
            trenchId: selectedCampaignId,
            amount: amountNum,
            level: selectedCampaign?.level,
        });

        if (!payload) return;
        if (isInsufficientBalance) return;

        setIsSubmitting(true);

        try {
            const res = await fetch("/api/spray", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (res.ok && (data.success || data.data)) {
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

    return (
        <form onSubmit={handleSpray} className={styles.form}>
            <div className={styles.section}>
                <label className={styles.label}>1. Select Target Trench</label>
                <div className={styles.campaignGrid}>
                    {campaigns.map((c) => (
                        <button
                            key={c.id}
                            type="button"
                            className={`${styles.campaignBtn} ${selectedCampaignId === c.id ? styles.active : ""}`}
                            onClick={() => setSelectedCampaignId(c.id)}
                        >
                            <span className={styles.levelBadge}>{c.level}</span>
                            <span className={styles.campaignName}>{c.name}</span>
                            <span className={styles.roi}>ROI: {parseFloat(c.roiMultiplier).toFixed(1)}x</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.section}>
                <div className={styles.labelRow}>
                    <label className={styles.label}>2. Entry Amount (USDC)</label>
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
                        placeholder={`${selectedCampaign?.entryRange.min} - ${selectedCampaign?.entryRange.max}`}
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
                        Limit: ${selectedCampaign.entryRange.min.toLocaleString()} - ${selectedCampaign.entryRange.max.toLocaleString()}
                    </p>
                )}
            </div>

            <div className={styles.section}>
                <ChainSelector
                    selectedChain={selectedChain}
                    onSelect={setSelectedChain}
                    disabled={isSubmitting}
                />
            </div>

            {isInsufficientBalance && amountNum > 0 && (
                <div className={styles.depositSection}>
                    <div className={styles.depositHeader}>
                        <span className={styles.warningIcon}>⚠️</span>
                        <div className={styles.depositHeaderText}>
                            <h4>Insufficient Balance</h4>
                            <p>Top up your account to proceed with this spray</p>
                        </div>
                    </div>

                    <div className={styles.qrContainer}>
                        {isGeneratingAddress ? (
                            <div className={styles.qrPlaceholder}>
                                <div className={styles.spinner} />
                                <span>Generating Address...</span>
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
                                        onClick={() => navigator.clipboard.writeText(depositAddress || "")}
                                    >
                                        Copy
                                    </button>
                                </div>
                                <p className={styles.depositHint}>
                                    Send at least <strong>${(amountNum - userBalance).toFixed(2)}</strong> to this address on {CHAINS.find(c => c.id === selectedChain)?.name}.
                                </p>
                            </>
                        ) : (
                            <p className={styles.errorText}>Could not generate deposit address.</p>
                        )}
                    </div>
                </div>
            )}

            {!isInsufficientBalance && amountNum > 0 && (
                <div className={styles.projection}>
                    <div className={styles.projRow}>
                        <span>You Deploy</span>
                        <span>${amountNum.toFixed(2)}</span>
                    </div>
                    <div className={styles.projRow}>
                        <span>Expected Return</span>
                        <span className={styles.returnAmount}>
                            ${(amountNum * (parseFloat(selectedCampaign?.roiMultiplier || "1.5"))).toFixed(2)}
                        </span>
                    </div>
                </div>
            )}

            <button
                type="submit"
                className={styles.submitBtn}
                disabled={isSubmitting || !isValidAmount || isInsufficientBalance}
            >
                {isSubmitting ? "Processing..." : isInsufficientBalance ? "Waiting for Funds..." : "Confirm & Spray"}
            </button>

            <p className={styles.footerNote}>
                ◈ Funds will be time-locked based on trench level.
            </p>
        </form>
    );
}
