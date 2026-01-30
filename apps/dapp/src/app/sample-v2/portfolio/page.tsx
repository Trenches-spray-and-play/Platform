"use client";

import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import styles from "./page.module.css";

interface UserWallets {
  wallet: string | null;
  walletEvm: string | null;
  walletSol: string | null;
}

export default function WalletPage() {
  const [wallets, setWallets] = useState<UserWallets>({
    wallet: null,
    walletEvm: null,
    walletSol: null,
  });
  const [evmInput, setEvmInput] = useState("");
  const [solInput, setSolInput] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    try {
      const res = await fetch("/api/user");
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setWallets({
            wallet: data.data.wallet,
            walletEvm: data.data.walletEvm,
            walletSol: data.data.walletSol,
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch wallets:", error);
    }
  };

  const saveWallets = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const updateData: Partial<UserWallets> = {};
      
      if (evmInput.trim()) {
        if (!evmInput.startsWith("0x") || evmInput.length !== 42) {
          setMessage({ type: "error", text: "Invalid EVM address format (must be 0x + 40 hex chars)" });
          setSaving(false);
          return;
        }
        updateData.walletEvm = evmInput.toLowerCase();
        updateData.wallet = evmInput.toLowerCase();
      }

      if (solInput.trim()) {
        if (solInput.length < 32 || solInput.length > 44 || solInput.startsWith("0x")) {
          setMessage({ type: "error", text: "Invalid Solana address format" });
          setSaving(false);
          return;
        }
        updateData.walletSol = solInput;
      }

      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setWallets(data.data);
          setEvmInput("");
          setSolInput("");
          setMessage({ type: "success", text: "Wallets updated successfully!" });
        }
      } else {
        setMessage({ type: "error", text: "Failed to update wallets" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred" });
    } finally {
      setSaving(false);
    }
  };

  const shortenAddress = (addr: string | null) => {
    if (!addr) return "Not set";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.container}>
          {/* Header */}
          <div className={styles.header}>
            <h1>Withdrawal Wallets</h1>
            <p>Set your personal wallet addresses where payouts will be sent</p>
          </div>

          {/* Info Alert */}
          <div className={styles.alert}>
            <div className={styles.alertIcon}>⚠</div>
            <div className={styles.alertContent}>
              <strong>Important</strong>
              <p>
                These are YOUR personal wallets where campaign payouts will be sent. 
                Make sure you control these addresses. Payouts cannot be reversed once sent.
              </p>
            </div>
          </div>

          {/* Current Wallets */}
          <section className={styles.section}>
            <h2>Current Withdrawal Addresses</h2>
            <div className={styles.walletCards}>
              <div className={styles.walletCard}>
                <div className={styles.walletHeader}>
                  <span className={styles.walletIcon}>◈</span>
                  <span className={styles.walletType}>EVM Address</span>
                </div>
                <div className={styles.walletAddress}>
                  {shortenAddress(wallets.walletEvm || wallets.wallet)}
                </div>
                <div className={styles.walletNote}>
                  For Ethereum, Base, Arbitrum, HyperEVM payouts
                </div>
                {(wallets.walletEvm || wallets.wallet) && (
                  <div className={styles.walletFull}>
                    {wallets.walletEvm || wallets.wallet}
                  </div>
                )}
              </div>

              <div className={styles.walletCard}>
                <div className={styles.walletHeader}>
                  <span className={styles.walletIcon}>◎</span>
                  <span className={styles.walletType}>Solana Address</span>
                </div>
                <div className={styles.walletAddress}>
                  {shortenAddress(wallets.walletSol)}
                </div>
                <div className={styles.walletNote}>
                  For Solana payouts
                </div>
                {wallets.walletSol && (
                  <div className={styles.walletFull}>
                    {wallets.walletSol}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Update Form */}
          <section className={styles.section}>
            <h2>Update Withdrawal Addresses</h2>
            
            {message && (
              <div className={`${styles.message} ${styles[message.type]}`}>
                {message.text}
              </div>
            )}

            <div className={styles.form}>
              <div className={styles.inputGroup}>
                <label>EVM Withdrawal Address (Ethereum, Base, Arbitrum, HyperEVM)</label>
                <input
                  type="text"
                  value={evmInput}
                  onChange={(e) => setEvmInput(e.target.value)}
                  placeholder="0x..."
                  className={styles.input}
                />
                <span className={styles.inputHelp}>
                  Leave empty to keep current: {shortenAddress(wallets.walletEvm || wallets.wallet)}
                </span>
              </div>

              <div className={styles.inputGroup}>
                <label>Solana Withdrawal Address</label>
                <input
                  type="text"
                  value={solInput}
                  onChange={(e) => setSolInput(e.target.value)}
                  placeholder="Enter Solana address..."
                  className={styles.input}
                />
                <span className={styles.inputHelp}>
                  Leave empty to keep current: {shortenAddress(wallets.walletSol)}
                </span>
              </div>

              <button
                className={styles.saveBtn}
                onClick={saveWallets}
                disabled={saving || (!evmInput.trim() && !solInput.trim())}
              >
                {saving ? "Saving..." : "Save Withdrawal Addresses"}
              </button>
            </div>
          </section>

          {/* Security Notes */}
          <section className={styles.section}>
            <h2>Security Information</h2>
            <div className={styles.securityList}>
              <div className={styles.securityItem}>
                <span className={styles.securityIcon}>✓</span>
                <div>
                  <strong>Double-check your addresses</strong>
                  <p>Payouts are irreversible. Make sure you control the wallet.</p>
                </div>
              </div>
              <div className={styles.securityItem}>
                <span className={styles.securityIcon}>✓</span>
                <div>
                  <strong>Use a secure wallet</strong>
                  <p>Hardware wallets or secure software wallets recommended.</p>
                </div>
              </div>
              <div className={styles.securityItem}>
                <span className={styles.securityIcon}>✓</span>
                <div>
                  <strong>Same address for all EVM chains</strong>
                  <p>Your EVM address works for Ethereum, Base, Arbitrum, and HyperEVM.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
