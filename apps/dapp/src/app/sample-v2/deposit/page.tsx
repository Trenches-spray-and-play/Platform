"use client";

import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import styles from "./page.module.css";
import { Chain, ChainSelector } from "./ChainSelector";
import { GenerateButton } from "./GenerateButton";
import { AddressDisplay } from "./AddressDisplay";

// Status toast component
function StatusToast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`${styles.statusToast} ${styles[type]}`}>
      <span className={styles.statusIcon}>{type === 'success' ? '✓' : '✕'}</span>
      <span className={styles.statusMessage}>{message}</span>
      <button className={styles.statusClose} onClick={onClose}>×</button>
    </div>
  );
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

const SUPPORTED_CHAINS: Chain[] = ['ethereum', 'base', 'arbitrum', 'hyperevm', 'bsc', 'solana'];

export default function DepositPage() {
  const [step, setStep] = useState<'SELECT' | 'GENERATE' | 'DISPLAY'>('SELECT');
  const [selectedChain, setSelectedChain] = useState<Chain | null>(null);
  const [addresses, setAddresses] = useState<Record<string, string>>({}); // Cache: chain -> address
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [user, setUser] = useState<User | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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
          // Fetch initial addresses and history
          fetchInitialData(data.data.id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
    }
  };

  const fetchInitialData = async (userId: string) => {
    setIsLoading(true);
    try {
      // Fetch all existing deposit addresses
      const addrRes = await fetch(`/api/deposit-address?userId=${userId}`);
      if (addrRes.ok) {
        const addrData = await addrRes.json();
        if (addrData.addresses) {
          // Convert Array<{chain, address}> to Record<string, string>
          const cache: Record<string, string> = {};
          addrData.addresses.forEach((item: any) => {
            cache[item.chain] = item.address;
          });
          setAddresses(cache);
        }
      }

      // Fetch deposit history
      const depositsRes = await fetch(`/api/deposits?userId=${userId}`);
      if (depositsRes.ok) {
        const depositsData = await depositsRes.json();
        if (depositsData.data) setDeposits(depositsData.data);
      }
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
      setFetchError("Failed to load deposit data. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChainSelect = (chain: Chain) => {
    setSelectedChain(chain);
    if (addresses[chain]) {
      setStep('DISPLAY');
    } else {
      setStep('GENERATE');
    }
  };

  const handleGenerate = async () => {
    if (!user?.id || !selectedChain) return;

    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/deposit-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, chain: selectedChain }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Update cache and move to display
        setAddresses(prev => ({ ...prev, [selectedChain]: data.address }));
        setStep('DISPLAY');
        setStatus({ message: `${selectedChain} address generated!`, type: 'success' });
      } else {
        const errorMsg = data.error || "Failed to generate address. Please try again.";
        setFetchError(errorMsg);
        setStatus({ message: errorMsg, type: 'error' });
      }
    } catch (error) {
      console.error("Failed to generate address:", error);
      setFetchError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
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
          {/* Status Toast */}
          {status && (
            <StatusToast
              message={status.message}
              type={status.type}
              onClose={() => setStatus(null)}
            />
          )}

          {/* Header */}
          <div className={styles.header}>
            <h1>Deposit Funds</h1>
            <p>Select a network to get your unique deposit address</p>
          </div>

          {/* Main Deposit Flow */}
          <section className={styles.section}>
            <div className={styles.stepContainer}>
              {step === 'SELECT' && (
                <>
                  <div className={styles.sectionHeader}>
                    <h2>1. Select Network</h2>
                    {isLoading && <span className={styles.loadingSpinner}></span>}
                  </div>
                  <ChainSelector
                    chains={SUPPORTED_CHAINS}
                    existingAddresses={Object.keys(addresses)}
                    onSelect={handleChainSelect}
                    selectedChain={selectedChain}
                  />
                </>
              )}

              {step === 'GENERATE' && selectedChain && (
                <>
                  <div className={styles.sectionHeader}>
                    <button onClick={() => setStep('SELECT')} className={styles.backLink}>
                      ← Back to Selection
                    </button>
                    <h2>2. Generate Address</h2>
                  </div>
                  <GenerateButton
                    chain={selectedChain}
                    onClick={handleGenerate}
                    isLoading={isLoading}
                  />
                  {fetchError && <div className={styles.errorText}>{fetchError}</div>}
                </>
              )}

              {step === 'DISPLAY' && selectedChain && addresses[selectedChain] && (
                <>
                  <div className={styles.sectionHeader}>
                    <h2>3. Your Deposit Address</h2>
                  </div>
                  <AddressDisplay
                    chain={selectedChain}
                    address={addresses[selectedChain]}
                    onBack={() => setStep('SELECT')}
                    copiedAddress={copiedAddress}
                    onCopy={copyToClipboard}
                  />
                </>
              )}
            </div>
          </section>

          {/* Info Alert - Only shown in SELECT step to keep UI clean */}
          {step === 'SELECT' && (
            <div className={styles.alert}>
              <div className={styles.alertIcon}>ℹ</div>
              <div className={styles.alertContent}>
                <strong>How Deposits Work</strong>
                <p>
                  Send crypto to your platform address. Your USD balance will be credited after network confirmations.
                  Addresses are unique to your account and monitored 24/7.
                </p>
              </div>
            </div>
          )}

          {/* Supported Assets */}
          <section className={styles.section}>
            <h2>Supported Assets</h2>
            <div className={styles.assetsGrid}>
              <div className={styles.assetCard}>
                <span className={styles.assetIcon}>◈</span>
                <div>
                  <strong>ETH</strong>
                  <span>Mainnet, Base, Arbitrum, HyperEVM</span>
                </div>
              </div>
              <div className={styles.assetCard}>
                <span className={styles.assetIcon}>$</span>
                <div>
                  <strong>USDC / USDT</strong>
                  <span>All supported EVM chains & Solana</span>
                </div>
              </div>
              <div className={styles.assetCard}>
                <span className={styles.assetIcon}>◎</span>
                <div>
                  <strong>SOL</strong>
                  <span>Solana Native</span>
                </div>
              </div>
            </div>
          </section>

          {/* Deposit History */}
          <section className={styles.section}>
            <h2>Recent Deposits</h2>
            {deposits.length === 0 ? (
              <div className={styles.emptyHistory}>
                <p>No deposits detected yet. Fund your account to start spraying.</p>
              </div>
            ) : (
              <div className={styles.depositList}>
                {deposits.slice(0, 10).map((deposit) => (
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
