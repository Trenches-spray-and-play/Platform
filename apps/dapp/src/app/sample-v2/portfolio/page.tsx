"use client";

import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import styles from "./page.module.css";

interface UserWallets {
  wallet: string | null;
  walletEvm: string | null;
  walletSol: string | null;
}

// Info Tooltip Component
function InfoTooltip({ content }: { content: string }) {
  const [show, setShow] = useState(false);
  
  return (
    <span 
      className={styles.infoIcon}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={() => setShow(!show)}
    >
      ⓘ
      {show && (
        <span className={styles.tooltip}>{content}</span>
      )}
    </span>
  );
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
          setMessage({ type: "error", text: "Invalid EVM address format" });
          setSaving(false);
          return;
        }
        updateData.walletEvm = evmInput.toLowerCase();
        updateData.wallet = evmInput.toLowerCase();
      }

      if (solInput.trim()) {
        if (solInput.length < 32 || solInput.length > 44 || solInput.startsWith("0x")) {
          setMessage({ type: "error", text: "Invalid Solana address" });
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
          setMessage({ type: "success", text: "Wallets updated!" });
        }
      } else {
        setMessage({ type: "error", text: "Failed to update" });
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
            <p>Set where your payouts go</p>
          </div>

          {/* Current Wallets */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Your Addresses</h2>
              <InfoTooltip content="These wallets receive your campaign payouts. Make sure you control them - payouts cannot be reversed." />
            </div>
            
            <div className={styles.walletCards}>
              <div className={styles.walletCard}>
                <div className={styles.walletHeader}>
                  <span className={styles.walletIcon}>◈</span>
                  <span className={styles.walletType}>EVM</span>
                </div>
                <div className={styles.walletAddress}>
                  {shortenAddress(wallets.walletEvm || wallets.wallet)}
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
                  <span className={styles.walletType}>Solana</span>
                </div>
                <div className={styles.walletAddress}>
                  {shortenAddress(wallets.walletSol)}
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
            <div className={styles.sectionHeader}>
              <h2>Update Addresses</h2>
            </div>
            
            {message && (
              <div className={`${styles.message} ${styles[message.type]}`}>
                {message.text}
              </div>
            )}

            <div className={styles.form}>
              <div className={styles.inputGroup}>
                <label>
                  EVM Address
                  <InfoTooltip content="Your EVM address works for Ethereum, Base, Arbitrum, and HyperEVM payouts. Must start with 0x and be 42 characters." />
                </label>
                <input
                  type="text"
                  value={evmInput}
                  onChange={(e) => setEvmInput(e.target.value)}
                  placeholder="0x..."
                  className={styles.input}
                />
                <span className={styles.inputHelp}>
                  Current: {shortenAddress(wallets.walletEvm || wallets.wallet)}
                </span>
              </div>

              <div className={styles.inputGroup}>
                <label>
                  Solana Address
                  <InfoTooltip content="Your Solana wallet address for SOL payouts. Must be 32-44 characters." />
                </label>
                <input
                  type="text"
                  value={solInput}
                  onChange={(e) => setSolInput(e.target.value)}
                  placeholder="Enter address..."
                  className={styles.input}
                />
                <span className={styles.inputHelp}>
                  Current: {shortenAddress(wallets.walletSol)}
                </span>
              </div>

              <button
                className={styles.saveBtn}
                onClick={saveWallets}
                disabled={saving || (!evmInput.trim() && !solInput.trim())}
              >
                {saving ? "Saving..." : "Save Addresses"}
              </button>
            </div>
          </section>

          {/* Security Notes - Condensed */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Security</h2>
              <InfoTooltip content="Payouts are irreversible. Always double-check your addresses and use secure wallets. Your EVM address works across all EVM chains." />
            </div>
            <div className={styles.securityBadges}>
              <span className={styles.badge}>✓ Verify addresses</span>
              <span className={styles.badge}>✓ Use secure wallets</span>
              <span className={styles.badge}>✓ One EVM address for all chains</span>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
