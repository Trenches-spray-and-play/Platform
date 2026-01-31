"use client";

import { useState } from "react";
import styles from "../../admin-v2/campaigns/page.module.css";

interface Campaign {
    id: string;
    name: string;
    tokenSymbol: string;
    chainName: string;
    trenchIds: string[];
    roiMultiplier: number;
}

const TRENCH_OPTIONS = [
    { id: "rapid", name: "RAPID" },
    { id: "mid", name: "MID" },
    { id: "deep", name: "DEEP" },
];

const CHAIN_OPTIONS = [
    { id: 999, name: "HyperEVM" },
    { id: 1, name: "Ethereum" },
    { id: 8453, name: "Base" },
    { id: 42161, name: "Arbitrum" },
    { id: 0, name: "Solana" },
];



interface CampaignFormModalProps {
    editingCampaign: Campaign | null;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
    saving: boolean;
    error: string | null;
}

export default function CampaignFormModal({
    editingCampaign,
    onClose,
    onSave,
    saving,
    error
}: CampaignFormModalProps) {
    const [formData, setFormData] = useState({
        name: editingCampaign?.name || "",
        tokenSymbol: editingCampaign?.tokenSymbol || "",
        tokenAddress: "",
        chainId: 999,
        trenchIds: editingCampaign?.trenchIds || [],
        roiMultiplier: editingCampaign?.roiMultiplier || 1.5,
        manualPrice: "",
        useOracle: false,
        oracleSource: "manual",
        isActive: true,
        isHidden: false,
        startsAt: "",
        acceptDepositsBeforeStart: false,
        payoutIntervalSeconds: 5,
    });

    const toggleTrench = (trenchId: string) => {
        setFormData((prev) => ({
            ...prev,
            trenchIds: prev.trenchIds.includes(trenchId)
                ? prev.trenchIds.filter((id) => id !== trenchId)
                : [...prev.trenchIds, trenchId],
        }));
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>
                        {editingCampaign ? "Edit Campaign" : "Create Campaign"}
                    </h2>
                    <button className={styles.modalClose} onClick={onClose}>×</button>
                </div>

                <div className={styles.modalContent}>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Campaign Name</label>
                            <input
                                type="text"
                                className={styles.formInput}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., BLT Rapid Spray"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Token Symbol</label>
                            <input
                                type="text"
                                className={styles.formInput}
                                value={formData.tokenSymbol}
                                onChange={(e) => setFormData({ ...formData, tokenSymbol: e.target.value })}
                                placeholder="e.g., BLT"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Chain</label>
                            <select
                                className={styles.formSelect}
                                value={formData.chainId}
                                onChange={(e) => setFormData({ ...formData, chainId: parseInt(e.target.value) })}
                            >
                                {CHAIN_OPTIONS.map((chain) => (
                                    <option key={chain.id} value={chain.id}>{chain.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>ROI Multiplier</label>
                            <input
                                type="number"
                                step="0.1"
                                className={styles.formInput}
                                value={formData.roiMultiplier}
                                onChange={(e) => setFormData({ ...formData, roiMultiplier: parseFloat(e.target.value) || 1.5 })}
                            />
                        </div>

                        <div className={styles.formGroupFull}>
                            <label className={styles.formLabel}>Trenches</label>
                            <div className={styles.trenchTags}>
                                {TRENCH_OPTIONS.map((trench) => (
                                    <button
                                        key={trench.id}
                                        type="button"
                                        className={`${styles.trenchTag} ${formData.trenchIds.includes(trench.id) ? styles.trenchTagActive : ""}`}
                                        onClick={() => toggleTrench(trench.id)}
                                    >
                                        {trench.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error display */}
                {error && (
                    <div style={{ 
                        padding: "0.75rem 1.5rem",
                        background: "rgba(239, 68, 68, 0.1)", 
                        borderTop: "1px solid var(--danger)",
                        color: "var(--danger)",
                        fontSize: "0.875rem"
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                <div className={styles.modalFooter}>
                    <button className={styles.modalClose} style={{ width: "auto" }} onClick={onClose}>Cancel</button>
                    <button
                        className={styles.modalClose}
                        style={{ width: "auto", background: "var(--accent-primary)", color: "var(--bg-primary)" }}
                        onClick={() => onSave(formData)}
                        disabled={saving}
                    >
                        {saving ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}
