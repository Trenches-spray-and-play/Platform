"use client";

import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import styles from "./page.module.css";

interface DepositAddress {
  chain: string;
  address: string;
}

interface Deposit {
  id: string;
  chain: string;
  asset: string;
  amount: string;
  amountUsd: string;
  status: string;
  confirmations: number;
  createdAt: string;
}

interface User {
  id: string;
}

const CHAIN_ICONS: Record<string, string> = {
  ethereum: "◈",
  base: "◆",
  arbitrum: "△",
  hyperevm: "◉",
  solana: "◎",
};

const CHAIN_NAMES: Record<string, string> = {
  ethereum: "Ethereum",
  base: "Base",
  arbitrum: "Arbitrum",
  hyperevm: "HyperEVM",
  solana: "Solana",
};

export default function DepositPage() {
  const [addresses, setAddresses] = useState<DepositAddress[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [user, setUser] = useState<User | null>(null);

  const [generating, setGenerating] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/user");
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setUser(data.data);
          fetchData(data.data.id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);

    }
  };

  const fetchData = async (userId: string) => {
    try {
      // Fetch deposit addresses
      const addrRes = await fetch(`/api/deposit-address?userId=${userId}`);
      if (addrRes.ok) {
        const addrData = await addrRes.json();
        if (addrData.addresses) setAddresses(addrData.addresses);
      }

      // Fetch deposit history
      const depositsRes = await fetch(`/api/deposits?userId=${userId}`);
      if (depositsRes.ok) {
        const depositsData = await depositsRes.json();
        if (depositsData.data) setDeposits(depositsData.data);
      }
    } catch (error) {
      console.error("Failed to fetch deposit data:", error);
    }
  };

  const generateAddresses = async () => {
    if (!user?.id) return;
    
    setGenerating(true);
    try {
      const res = await fetch("/api/deposit-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.addresses) {
          const addrArray = Object.entries(data.addresses).map(([chain, address]) => ({
            chain,
            address: address as string,
          }));
          setAddresses(addrArray);
        }
      }
    } catch (error) {
      console.error("Failed to generate addresses:", error);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
      case "SAFE":
        return styles.statusConfirmed;
      case "PENDING":
      case "CONFIRMING":
        return styles.statusPending;
      default:
        return styles.statusDefault;
    }
  };

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.container}>
          {/* Header */}
          <div className={styles.header}>
            <h1>Deposit Funds</h1>
            <p>Send crypto to your platform-assigned addresses to fund your account</p>
          </div>

          {/* Info Alert */}
          <div className={styles.alert}>
            <div className={styles.alertIcon}>ℹ</div>
            <div className={styles.alertContent}>
              <strong>How Deposits Work</strong>
              <p>
                These are platform-controlled deposit addresses derived from our HD wallet. 
                Send crypto here and your USD balance will be credited after confirmations. 
                These addresses are unique to you and monitored 24/7.
              </p>
            </div>
          </div>

          {/* Deposit Addresses */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Your Deposit Addresses</h2>
              {addresses.length === 0 && (
                <button 
                  className={styles.generateBtn} 
                  onClick={generateAddresses} 
                  disabled={!user || generating}
                >
                  {generating ? "Generating..." : "Generate Addresses"}
                </button>
              )}
            </div>

            {addresses.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>◈</div>
                <h3>No Deposit Addresses Yet</h3>
                <p>Click the button above to generate your unique deposit addresses for each chain.</p>
              </div>
            ) : (
              <div className={styles.addressGrid}>
                {addresses.map((addr) => (
                  <div key={addr.chain} className={styles.addressCard}>
                    <div className={styles.addressHeader}>
                      <span className={styles.chainIcon}>{CHAIN_ICONS[addr.chain] || "◈"}</span>
                      <span className={styles.chainName}>{CHAIN_NAMES[addr.chain] || addr.chain}</span>
                    </div>
                    <div className={styles.addressBox}>
                      <code className={styles.address}>{addr.address}</code>
                      <button
                        className={styles.copyBtn}
                        onClick={() => copyToClipboard(addr.address)}
                      >
                        {copiedAddress === addr.address ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <div className={styles.addressNote}>
                      Send only {CHAIN_NAMES[addr.chain] || addr.chain} assets to this address
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Supported Assets */}
          <section className={styles.section}>
            <h2>Supported Assets</h2>
            <div className={styles.assetsGrid}>
              <div className={styles.assetCard}>
                <span className={styles.assetIcon}>◈</span>
                <div>
                  <strong>ETH</strong>
                  <span>Ethereum, Base, Arbitrum, HyperEVM</span>
                </div>
              </div>
              <div className={styles.assetCard}>
                <span className={styles.assetIcon}>$</span>
                <div>
                  <strong>USDC</strong>
                  <span>All EVM chains & Solana</span>
                </div>
              </div>
              <div className={styles.assetCard}>
                <span className={styles.assetIcon}>$</span>
                <div>
                  <strong>USDT</strong>
                  <span>All EVM chains & Solana</span>
                </div>
              </div>
              <div className={styles.assetCard}>
                <span className={styles.assetIcon}>◎</span>
                <div>
                  <strong>SOL</strong>
                  <span>Solana native</span>
                </div>
              </div>
            </div>
          </section>

          {/* Deposit History */}
          <section className={styles.section}>
            <h2>Deposit History</h2>
            {deposits.length === 0 ? (
              <div className={styles.emptyHistory}>
                <p>No deposits yet. Send crypto to one of your addresses above.</p>
              </div>
            ) : (
              <div className={styles.depositList}>
                {deposits.map((deposit) => (
                  <div key={deposit.id} className={styles.depositItem}>
                    <div className={styles.depositInfo}>
                      <span className={styles.depositAsset}>{deposit.asset}</span>
                      <span className={styles.depositChain}>{deposit.chain}</span>
                    </div>
                    <div className={styles.depositAmounts}>
                      <span className={styles.depositCrypto}>{deposit.amount}</span>
                      <span className={styles.depositUsd}>${deposit.amountUsd}</span>
                    </div>
                    <div className={styles.depositStatus}>
                      <span className={`${styles.statusBadge} ${getStatusColor(deposit.status)}`}>
                        {deposit.status}
                      </span>
                      <span className={styles.confirmations}>
                        {deposit.confirmations} confirmations
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
}
