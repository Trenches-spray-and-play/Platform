"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "../components/Layout";
import styles from "./spray.module.css";
import { ComplianceDisclaimer } from "@trenches/ui";

interface Trench {
  id: string;
  name: string;
  level: "RAPID" | "MID" | "DEEP";
  entrySize: number;
  usdEntry: number;
  active: boolean;
}

interface UserProfile {
  balance: string;
  beliefScore: number;
}

const TRENCH_CONFIG = {
  RAPID: { min: 5, max: 1000, duration: "24h", color: "#22c55e" },
  MID: { min: 100, max: 10000, duration: "48h", color: "#3b82f6" },
  DEEP: { min: 1000, max: 100000, duration: "72h", color: "#8b5cf6" },
};

export default function SprayPage() {
  const router = useRouter();
  const [trenches, setTrenches] = useState<Trench[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [selectedTrench, setSelectedTrench] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [step, setStep] = useState<"select" | "review">("select");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [trenchesRes, userRes] = await Promise.all([
        fetch("/api/trenches"),
        fetch("/api/user"),
      ]);

      if (!trenchesRes.ok || !userRes.ok) {
        throw new Error("Failed to load data");
      }

      const trenchesData = await trenchesRes.json();
      const userData = await userRes.json();

      setTrenches(trenchesData.data || []);
      setUser(userData.data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const selectedTrenchData = trenches.find((t) => t.id === selectedTrench);
  const trenchConfig = selectedTrenchData 
    ? TRENCH_CONFIG[selectedTrenchData.level] 
    : null;

  const validateAmount = (): string | null => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return "Please enter a valid amount";
    }
    if (!trenchConfig) return "Select a trench first";
    if (numAmount < trenchConfig.min) {
      return `Minimum entry is $${trenchConfig.min}`;
    }
    if (numAmount > trenchConfig.max) {
      return `Maximum entry is $${trenchConfig.max}`;
    }
    const balance = parseFloat(user?.balance || "0");
    if (numAmount > balance) {
      return `Insufficient balance. You have $${balance.toFixed(2)}`;
    }
    return null;
  };

  const handleContinue = () => {
    const validationError = validateAmount();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep("review");
  };

  const handleSubmit = async () => {
    if (!selectedTrenchData) return;
    
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/spray", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trenchId: selectedTrenchData.id,
          amount: parseFloat(amount),
          level: selectedTrenchData.level,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create spray entry");
      }

      // Redirect to finalize page
      router.push(`/sample-v2/spray/finalize?entryId=${data.data.sprayEntryId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
      setSubmitting(false);
    }
  };

  const formatBalance = (balance: string) => {
    return `$${parseFloat(balance || "0").toFixed(2)}`;
  };

  if (loading) {
    return (
      <Layout>
        <div className={styles.container}>
          <div className={styles.loading}>Loading...</div>
        </div>
        <ComplianceDisclaimer variant="footer" />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>New Spray</h1>
          <p className={styles.subtitle}>Enter a campaign and coordinate with the community</p>
        </div>

        {error && (
          <div className={styles.errorBanner}>
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} className={styles.errorClose}>×</button>
          </div>
        )}

        {step === "select" ? (
          <div className={styles.card}>
            {/* Balance Display */}
            <div className={styles.balanceRow}>
              <span className={styles.balanceLabel}>Available Balance</span>
              <span className={styles.balanceValue}>
                {user ? formatBalance(user.balance) : "$0.00"}
              </span>
            </div>

            {/* Trench Selection */}
            <div className={styles.section}>
              <label className={styles.sectionLabel}>Select Campaign</label>
              <div className={styles.trenchGrid}>
                {trenches
                  .filter((t) => t.active)
                  .map((trench) => {
                    const config = TRENCH_CONFIG[trench.level];
                    const isSelected = selectedTrench === trench.id;
                    return (
                      <button
                        key={trench.id}
                        className={`${styles.trenchCard} ${isSelected ? styles.selected : ""}`}
                        onClick={() => {
                          setSelectedTrench(trench.id);
                          setError(null);
                        }}
                        style={{ borderColor: isSelected ? config.color : undefined }}
                      >
                        <div 
                          className={styles.trenchLevel}
                          style={{ color: config.color }}
                        >
                          {trench.level}
                        </div>
                        <div className={styles.trenchRange}>
                          ${config.min.toLocaleString()} - ${config.max.toLocaleString()}
                        </div>
                        <div className={styles.trenchDuration}>{config.duration}</div>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Amount Input */}
            <div className={styles.section}>
              <label className={styles.sectionLabel}>Entry Amount (USD)</label>
              <div className={styles.amountInputWrapper}>
                <span className={styles.currency}>$</span>
                <input
                  type="number"
                  className={styles.amountInput}
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setError(null);
                  }}
                  min={trenchConfig?.min}
                  max={trenchConfig?.max}
                />
              </div>
              {trenchConfig && (
                <div className={styles.amountHint}>
                  Min: ${trenchConfig.min.toLocaleString()} | Max: ${trenchConfig.max.toLocaleString()}
                </div>
              )}
            </div>

            {/* Continue Button */}
            <button
              className={styles.continueBtn}
              onClick={handleContinue}
              disabled={!selectedTrench || !amount}
            >
              Review Entry →
            </button>
          </div>
        ) : (
          <div className={styles.card}>
            {/* Review Step */}
            <div className={styles.reviewHeader}>
              <button className={styles.backBtn} onClick={() => setStep("select")}>
                ← Back
              </button>
              <h2 className={styles.reviewTitle}>Review Entry</h2>
            </div>

            <div className={styles.reviewSection}>
              <div className={styles.reviewRow}>
                <span>Campaign</span>
                <span className={styles.reviewValue}>
                  {selectedTrenchData?.level}
                </span>
              </div>
              <div className={styles.reviewRow}>
                <span>Entry Amount</span>
                <span className={styles.reviewValue}>
                  ${parseFloat(amount || "0").toFixed(2)}
                </span>
              </div>
              <div className={styles.reviewRow}>
                <span>Expected Return</span>
                <span className={`${styles.reviewValue} ${styles.positive}`}>
                  ${(parseFloat(amount || "0") * 1.5).toFixed(2)}
                </span>
              </div>
              <div className={styles.reviewRow}>
                <span>Net Profit</span>
                <span className={`${styles.reviewValue} ${styles.positive}`}>
                  +${(parseFloat(amount || "0") * 0.5).toFixed(2)}
                </span>
              </div>
            </div>

            <div className={styles.notice}>
              <p>⚡ You&apos;ll need to complete tasks before your entry is finalized.</p>
              <p>Your balance will be deducted immediately.</p>
            </div>

            <button
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Creating Entry..." : "Confirm Entry"}
            </button>
          </div>
        )}
      </div>
      <ComplianceDisclaimer variant="footer" />
    </Layout>
  );
}
