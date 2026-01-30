"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Layout from "../components/Layout";
import styles from "./page.module.css";
import { Chain } from "./ChainSelector";
import QRCode from "qrcode";

// Chain configurations
const CHAIN_CONFIG: Record<Chain, { name: string; icon: string; color: string; assets: string }> = {
  ethereum: { name: "Ethereum", icon: "◈", color: "#627EEA", assets: "ETH, USDC, USDT" },
  base: { name: "Base", icon: "◆", color: "#0052FF", assets: "ETH, USDC, USDT" },
  arbitrum: { name: "Arbitrum", icon: "△", color: "#28A0F0", assets: "ETH, USDC, USDT" },
  hyperevm: { name: "HyperEVM", icon: "◉", color: "#00FF66", assets: "ETH, USDC, USDT" },
  bsc: { name: "BSC", icon: "⬡", color: "#F3BA2F", assets: "BNB, USDC, USDT" },
  solana: { name: "Solana", icon: "◎", color: "#14F195", assets: "SOL, USDC" },
};

const SUPPORTED_CHAINS: Chain[] = ['ethereum', 'base', 'arbitrum', 'hyperevm', 'bsc', 'solana'];

interface AddressState {
  address: string | null;
  isLoading: boolean;
  error: string | null;
  qrCode: string | null;
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

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

export default function DepositPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Record<Chain, AddressState>>(
    Object.fromEntries(
      SUPPORTED_CHAINS.map(chain => [
        chain,
        { address: null, isLoading: false, error: null, qrCode: null }
      ])
    ) as Record<Chain, AddressState>
  );
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [selectedChain, setSelectedChain] = useState<Chain | null>(null);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' });
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const pullStartY = useRef<number | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // Fetch existing addresses on load
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/user");
      const data = await res.json();
      if (data.data?.id) {
        setUserId(data.data.id);
        await Promise.all([
          loadAddresses(data.data.id),
          loadDeposits(data.data.id)
        ]);
      }
    } catch (err) {
      console.error("Failed to fetch user:", err);
      setGlobalError("Please connect your wallet to view deposit addresses");
    }
  };

  const loadAddresses = async (uid: string) => {
    try {
      const res = await fetch(`/api/deposit-address?userId=${uid}`);
      if (!res.ok) throw new Error("Failed to load addresses");
      
      const data = await res.json();
      const loadedAddresses = data.addresses || [];

      setAddresses(prev => {
        const next = { ...prev };
        loadedAddresses.forEach((item: { chain: Chain; address: string }) => {
          if (next[item.chain]) {
            next[item.chain] = {
              ...next[item.chain],
              address: item.address,
            };
            generateQR(item.chain, item.address);
          }
        });
        return next;
      });
    } catch (err) {
      console.error("Failed to load addresses:", err);
    }
  };

  const loadDeposits = async (uid: string) => {
    try {
      const res = await fetch(`/api/deposits?userId=${uid}`);
      if (res.ok) {
        const data = await res.json();
        if (data.data) setDeposits(data.data);
      }
    } catch (err) {
      console.error("Failed to load deposits:", err);
    }
  };

  // Pull to refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (pageRef.current && pageRef.current.scrollTop === 0) {
      pullStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (pullStartY.current === null) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - pullStartY.current;
    
    if (diff > 0 && diff < 100 && pageRef.current?.scrollTop === 0) {
      setIsRefreshing(true);
    }
  };

  const handleTouchEnd = async () => {
    if (isRefreshing && userId) {
      await Promise.all([
        loadAddresses(userId),
        loadDeposits(userId)
      ]);
      setTimeout(() => setIsRefreshing(false), 500);
    }
    pullStartY.current = null;
  };

  const generateQR = async (chain: Chain, address: string) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(address, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
      setAddresses(prev => ({
        ...prev,
        [chain]: { ...prev[chain], qrCode: qrDataUrl }
      }));
    } catch (err) {
      console.error("QR generation failed:", err);
    }
  };

  const handleGenerate = async (chain: Chain) => {
    if (!userId) {
      setGlobalError("Please connect your wallet first");
      return;
    }

    setAddresses(prev => ({
      ...prev,
      [chain]: { ...prev[chain], isLoading: true, error: null }
    }));

    try {
      const res = await fetch("/api/deposit-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, chain }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setAddresses(prev => ({
          ...prev,
          [chain]: {
            ...prev[chain],
            address: data.address,
            isLoading: false,
            error: null,
          }
        }));
        generateQR(chain, data.address);
        showToast(`${CHAIN_CONFIG[chain].name} address generated!`, 'success');
      } else {
        throw new Error(data.error || "Failed to generate address");
      }
    } catch (err: any) {
      setAddresses(prev => ({
        ...prev,
        [chain]: {
          ...prev[chain],
          isLoading: false,
          error: err.message || "Failed to generate address"
        }
      }));
      showToast(err.message || "Failed to generate address", 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const copyAddress = (chain: Chain, address: string) => {
    navigator.clipboard.writeText(address);
    showToast('Address copied to clipboard!', 'success');
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
  };

  const getExplorerUrl = (chain: Chain, address: string): string => {
    const explorers: Record<Chain, string> = {
      ethereum: `https://etherscan.io/address/${address}`,
      base: `https://basescan.org/address/${address}`,
      arbitrum: `https://arbiscan.io/address/${address}`,
      hyperevm: `https://hyperevmscan.io/address/${address}`,
      bsc: `https://bscscan.com/address/${address}`,
      solana: `https://solscan.io/account/${address}`,
    };
    return explorers[chain];
  };

  const existingChains = SUPPORTED_CHAINS.filter(chain => addresses[chain]?.address);
  const selectedState = selectedChain ? addresses[selectedChain] : null;

  return (
    <Layout>
      <div 
        ref={pageRef}
        className={styles.page}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={styles.container}>
          {/* Pull to refresh indicator */}
          <div className={`${styles.pullIndicator} ${isRefreshing ? styles.visible : ''} ${isRefreshing ? styles.spinning : ''}`}>
            ↓
          </div>

          {/* Header */}
          <div className={styles.header}>
            <h1>Deposit Funds</h1>
            <p>Generate deposit addresses for any supported network. All EVM chains share the same address.</p>
          </div>

          {/* Global Error */}
          {globalError && (
            <div className={styles.globalError}>
              <span>⚠️</span> {globalError}
            </div>
          )}

          {/* Chain Selection - Mobile Bottom Sheet Trigger */}
          <div className={styles.chainSection}>
            <label className={styles.sectionLabel}>Select Network</label>
            <button
              className={`${styles.chainSelectorTrigger} ${selectedChain ? styles.hasSelection : ''} haptic`}
              onClick={() => setBottomSheetOpen(true)}
              aria-expanded={bottomSheetOpen}
            >
              {selectedChain ? (
                <>
                  <span 
                    className={styles.chainIconWrapper}
                    style={{ 
                      color: CHAIN_CONFIG[selectedChain].color,
                      background: `${CHAIN_CONFIG[selectedChain].color}15`
                    }}
                  >
                    {CHAIN_CONFIG[selectedChain].icon}
                  </span>
                  <div className={styles.chainSelectorInfo}>
                    <h3>{CHAIN_CONFIG[selectedChain].name}</h3>
                    <p>{CHAIN_CONFIG[selectedChain].assets}</p>
                  </div>
                </>
              ) : (
                <>
                  <span 
                    className={styles.chainIconWrapper}
                    style={{ color: '#888', background: 'rgba(255,255,255,0.05)' }}
                  >
                    ◇
                  </span>
                  <div className={styles.chainSelectorInfo}>
                    <h3>Choose Network</h3>
                    <p>Select a blockchain to deposit from</p>
                  </div>
                </>
              )}
              <span className={styles.chevron}>▼</span>
            </button>
          </div>

          {/* Selected Chain Address Card */}
          {selectedChain && selectedState && (
            <div className={styles.addressCard}>
              {/* Card Header */}
              <div className={styles.cardHeader}>
                <span 
                  className={styles.chainIconLarge}
                  style={{ 
                    color: CHAIN_CONFIG[selectedChain].color,
                    background: `${CHAIN_CONFIG[selectedChain].color}15`
                  }}
                >
                  {CHAIN_CONFIG[selectedChain].icon}
                </span>
                <div className={styles.chainInfo}>
                  <h3>{CHAIN_CONFIG[selectedChain].name}</h3>
                  <span className={styles.chainAssets}>{CHAIN_CONFIG[selectedChain].assets}</span>
                </div>
                {selectedState.address && (
                  <span className={styles.activeBadge}>Active</span>
                )}
              </div>

              {/* Card Content */}
              <div className={styles.cardContent}>
                {selectedState.isLoading ? (
                  <div className={styles.loadingState}>
                    <div className={styles.spinner} />
                    <span>Generating address...</span>
                  </div>
                ) : selectedState.address ? (
                  <>
                    {/* QR Code */}
                    <div className={styles.qrSection}>
                      <div className={styles.qrContainer}>
                        <div className={styles.qrWrapper}>
                          {selectedState.qrCode ? (
                            <img 
                              src={selectedState.qrCode} 
                              alt={`${CHAIN_CONFIG[selectedChain].name} QR Code`}
                              className={styles.qrImage}
                            />
                          ) : (
                            <div className={styles.qrPlaceholder}>...</div>
                          )}
                        </div>
                      </div>
                      <p className={styles.qrHint}>Scan with your mobile wallet</p>
                    </div>

                    {/* Address Display */}
                    <div className={styles.addressSection}>
                      <label>Your Deposit Address</label>
                      <div className={styles.addressBox}>
                        <code className={styles.addressText}>{selectedState.address}</code>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className={styles.cardActions}>
                      <button
                        onClick={() => copyAddress(selectedChain, selectedState.address!)}
                        className={`${styles.actionBtn} primary haptic`}
                      >
                        📋 Copy Address
                      </button>
                      <a
                        href={getExplorerUrl(selectedChain, selectedState.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${styles.actionBtn} haptic`}
                      >
                        🔗 Explorer
                      </a>
                    </div>

                    {/* Warning */}
                    <div className={styles.chainWarning}>
                      <span className={styles.warningIcon}>⚠️</span>
                      <p>
                        Send only {CHAIN_CONFIG[selectedChain].name} assets to this address. 
                        Sending assets from other networks may result in permanent loss.
                      </p>
                    </div>
                  </>
                ) : (
                  /* Generate Button */
                  <div className={styles.generateSection}>
                    <p className={styles.generateText}>
                      Generate your {CHAIN_CONFIG[selectedChain].name} deposit address
                    </p>
                    <button
                      onClick={() => handleGenerate(selectedChain)}
                      disabled={!userId || selectedState.isLoading}
                      className={`${styles.generateBtn} haptic-lg`}
                    >
                      Generate Address
                    </button>
                    {selectedState.error && (
                      <p className={styles.errorText}>{selectedState.error}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* All Chains Grid - Desktop Only */}
          <div className="hide-mobile">
            <label className={styles.sectionLabel}>All Networks</label>
            <div className={styles.chainGrid}>
              {SUPPORTED_CHAINS.map(chain => {
                const config = CHAIN_CONFIG[chain];
                const state = addresses[chain];
                const isSelected = selectedChain === chain;

                return (
                  <div
                    key={chain}
                    className={`${styles.chainOption} ${isSelected ? styles.selected : ''} ${state.address ? styles.hasAddress : ''} haptic`}
                    onClick={() => setSelectedChain(chain)}
                  >
                    <span 
                      className={styles.chainIcon}
                      style={{ 
                        color: config.color,
                        background: `${config.color}15`
                      }}
                    >
                      {config.icon}
                    </span>
                    <div className={styles.chainDetails}>
                      <span className={styles.chainName}>{config.name}</span>
                      <span className={styles.chainSubtext}>
                        {state.address ? 'Address ready' : 'Tap to generate'}
                      </span>
                    </div>
                    {state.address && (
                      <span className={styles.checkmark}>✓</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info Section */}
          <div className={styles.infoSection}>
            <h3>How Deposits Work</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>1</span>
                <div>
                  <h4>Generate Address</h4>
                  <p>Select a network and generate your deposit address</p>
                </div>
              </div>
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>2</span>
                <div>
                  <h4>Send Funds</h4>
                  <p>Transfer crypto from your wallet or exchange</p>
                </div>
              </div>
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>3</span>
                <div>
                  <h4>Auto-Credit</h4>
                  <p>Balance credited after network confirmations</p>
                </div>
              </div>
            </div>
          </div>

          {/* Deposit History */}
          {deposits.length > 0 ? (
            <div className={styles.historySection}>
              <h3>📋 Recent Deposits</h3>
              <div className={styles.depositList}>
                {deposits.slice(0, 5).map(deposit => (
                  <div key={deposit.id} className={styles.depositRow}>
                    <div className={styles.depositInfo}>
                      <span className={styles.depositAsset}>{deposit.asset}</span>
                      <span className={styles.depositChain}>{deposit.chain}</span>
                    </div>
                    <div className={styles.depositAmounts}>
                      <span className="amount">{deposit.amount}</span>
                      <span className={styles.usdValue}>${deposit.amountUsd}</span>
                    </div>
                    <span className={`${styles.statusBadge} ${styles[deposit.status.toLowerCase()]}`}>
                      {deposit.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.historySection}>
              <h3>📋 Recent Deposits</h3>
              <div className={styles.emptyHistory}>
                <div className={styles.emptyHistoryIcon}>📭</div>
                <p>No deposits yet. Generate an address to get started!</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Sheet Overlay */}
        <div 
          className={`${styles.bottomSheetOverlay} ${bottomSheetOpen ? styles.visible : ''}`}
          onClick={() => setBottomSheetOpen(false)}
        />

        {/* Bottom Sheet - Chain Selection */}
        <div className={`${styles.bottomSheet} ${bottomSheetOpen ? styles.visible : ''}`}>
          <div className={styles.bottomSheetHandle} />
          <h3 className={styles.bottomSheetTitle}>Select Network</h3>
          <div className={styles.bottomSheetChainGrid}>
            {SUPPORTED_CHAINS.map(chain => {
              const config = CHAIN_CONFIG[chain];
              const state = addresses[chain];
              const isSelected = selectedChain === chain;

              return (
                <button
                  key={chain}
                  className={`${styles.bottomSheetChainOption} ${isSelected ? styles.selected : ''} haptic`}
                  onClick={() => {
                    setSelectedChain(chain);
                    setBottomSheetOpen(false);
                  }}
                >
                  <span 
                    className={styles.chainIcon}
                    style={{ 
                      color: config.color,
                      background: `${config.color}15`
                    }}
                  >
                    {config.icon}
                  </span>
                  <div className={styles.chainDetails}>
                    <span className={styles.chainName}>{config.name}</span>
                    <span className={styles.chainSubtext}>
                      {state.address ? '✓ Address ready' : config.assets}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Toast Notification */}
        <div className={`${styles.toast} ${toast.show ? styles.visible : ''} ${styles[toast.type]}`}>
          <span className={styles.toastIcon}>
            {toast.type === 'success' ? '✓' : '✕'}
          </span>
          <span className={styles.toastMessage}>{toast.message}</span>
        </div>
      </div>
    </Layout>
  );
}
