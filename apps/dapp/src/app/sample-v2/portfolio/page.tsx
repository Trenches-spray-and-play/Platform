"use client";

import { useState } from "react";
import Layout from "../components/Layout";
import { ComplianceDisclaimer } from "@trenches/ui";
import styles from "./page.module.css";
import { useUser, useUpdateUser } from "@/hooks/useQueries";

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

import { useUIStore } from "@/store/uiStore";
import { UserUpdateSchema } from "@/lib/schemas";
import { validateOrToast } from "@/lib/validation";

export default function WalletPage() {
  const { data: user } = useUser();
  const updateMutation = useUpdateUser();
  const addToast = useUIStore((state) => state.addToast);

  const [evmInput, setEvmInput] = useState("");
  const [solInput, setSolInput] = useState("");

  const wallets = {
    walletEvm: user?.walletEvm || null,
    walletSol: user?.walletSol || null,
  };

  const saveWallets = async () => {
    try {
      const updateData: any = {};
      if (evmInput.trim()) updateData.walletEvm = evmInput.toLowerCase();
      if (solInput.trim()) updateData.walletSol = solInput;

      const payload = validateOrToast(UserUpdateSchema, updateData);
      if (!payload) return;

      const result = await updateMutation.mutateAsync(payload);
      if (result.success) {
        setEvmInput("");
        setSolInput("");
        addToast("Wallets updated successfully!", "success");
      } else {
        addToast("Failed to update wallets", "error");
      }
    } catch (error) {
      addToast("An error occurred while saving", "error");
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
                  {shortenAddress(wallets.walletEvm)}
                </div>
                {wallets.walletEvm && (
                  <div className={styles.walletFull}>
                    {wallets.walletEvm}
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
                  Current: {shortenAddress(wallets.walletEvm)}
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
                disabled={updateMutation.isPending || (!evmInput.trim() && !solInput.trim())}
              >
                {updateMutation.isPending ? "Saving..." : "Save Addresses"}
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
      <ComplianceDisclaimer variant="footer" />
    </Layout>
  );
}
