"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Layout from "../components/Layout";
import styles from "./page.module.css";
import QRCode from "qrcode";

export type Chain = 'ethereum' | 'base' | 'arbitrum' | 'hyperevm' | 'bsc' | 'solana';
export type Coin = 'USDC' | 'USDT' | 'ETH' | 'BNB' | 'SOL' | 'BLT' | 'HYPE';

// Chain configurations
const CHAIN_CONFIG: Record<Chain, { name: string; icon: string; color: string; nativeAsset: string }> = {
  ethereum: { name: "Ethereum", icon: "◈", color: "#627EEA", nativeAsset: "ETH" },
  base: { name: "Base", icon: "◆", color: "#0052FF", nativeAsset: "ETH" },
  arbitrum: { name: "Arbitrum", icon: "△", color: "#28A0F0", nativeAsset: "ETH" },
  hyperevm: { name: "HyperEVM", icon: "◉", color: "#00FF66", nativeAsset: "ETH" },
  bsc: { name: "BSC", icon: "⬡", color: "#F3BA2F", nativeAsset: "BNB" },
  solana: { name: "Solana", icon: "◎", color: "#14F195", nativeAsset: "SOL" },
};

// BLT Logo Component - Believe Trust
// White "B" directly on Solana green circular background
function BLTLogo({ size = 32 }: { size?: number }) {
  return (
    <div 
      style={{ 
        width: size, 
        height: size, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        borderRadius: '50%',
        background: '#14F195',
        boxShadow: '0 2px 8px rgba(20, 241, 149, 0.3)'
      }}
    >
      <span 
        style={{
          fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          fontSize: Math.round(size * 0.55),
          fontWeight: 900,
          color: '#ffffff',
          lineHeight: 1,
          transform: 'translateY(-1px)'
        }}
      >
        B
      </span>
    </div>
  );
}

// Coin configurations - each coin lists which chains support it
const COIN_CONFIG: Record<Coin, { name: string; icon: string | React.ReactNode; color: string; supportedChains: Chain[] }> = {
  USDC: { 
    name: "USD Coin", 
    icon: "$", 
    color: "#2775CA", 
    supportedChains: ['ethereum', 'base', 'arbitrum', 'bsc']
  },
  USDT: { 
    name: "Tether USD", 
    icon: "₮", 
    color: "#26A17B", 
    supportedChains: ['ethereum', 'base', 'arbitrum', 'bsc']
  },
  ETH: { 
    name: "Ethereum", 
    icon: "◈", 
    color: "#627EEA", 
    supportedChains: ['ethereum', 'base', 'arbitrum', 'hyperevm']
  },
  BNB: { 
    name: "BNB", 
    icon: "⬡", 
    color: "#F3BA2F", 
    supportedChains: ['bsc']
  },
  SOL: { 
    name: "Solana", 
    icon: "◎", 
    color: "#14F195", 
    supportedChains: ['solana']
  },
  BLT: { 
    name: "Believe Trust", 
    icon: "BLT_LOGO", // Special marker, will be rendered as component
    color: "#14F195", // Same green as Solana
    supportedChains: ['hyperevm']
  },
  HYPE: { 
    name: "Hyperliquid", 
    icon: "H", 
    color: "#00D4AA", 
    supportedChains: ['hyperevm']
  },
};

const SUPPORTED_COINS: Coin[] = ['USDC', 'USDT', 'ETH', 'BNB', 'SOL', 'BLT', 'HYPE'];
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

interface PendingDeposit extends Deposit {
  progress: number;
  requiredConfirmations: number;
  estimatedSecondsRemaining: number;
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
  const [pendingDeposits, setPendingDeposits] = useState<PendingDeposit[]>([]);
  const [pendingSummary, setPendingSummary] = useState<{ count: number; amountUsd: number }>({ count: 0, amountUsd: 0 });
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [selectedChain, setSelectedChain] = useState<Chain | null>(null);
  const [coinSheetOpen, setCoinSheetOpen] = useState(false);
  const [chainSheetOpen, setChainSheetOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' });
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);
  
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
        console.log('[Deposit Page] API response:', data);
        if (data.deposits) {
          setDeposits(data.deposits);
          console.log(`[Deposit Page] Loaded ${data.deposits.length} completed deposits`);
        } else {
          console.warn('[Deposit Page] No deposits array in response');
        }
        
        // Store debug info
        setDebugInfo({
          userId: uid,
          timestamp: new Date().toISOString(),
          rawResponse: data,
          depositsCount: data.deposits?.length || 0,
          pendingCount: data.pending?.deposits?.length || 0,
        });
        if (data.pending?.deposits) {
          setPendingDeposits(data.pending.deposits);
          console.log(`[Deposit Page] Loaded ${data.pending.deposits.length} pending deposits`);
        }
        if (data.pending?.summary) setPendingSummary(data.pending.summary);
      } else {
        console.error('[Deposit Page] Failed to load deposits:', await res.text());
      }
    } catch (err) {
      console.error("Failed to load deposits:", err);
    }
  };

  // Format seconds to human readable
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return 'Any moment now...';
    if (seconds < 60) return `${Math.ceil(seconds)}s remaining`;
    if (seconds < 3600) return `${Math.ceil(seconds / 60)} min remaining`;
    return `${Math.ceil(seconds / 3600)} hours remaining`;
  };

  // Format amount for display (handles both string numbers and Decimal)
  const formatAmount = (amount: string | number): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '0';
    // Format with appropriate decimals
    if (num >= 1000000) return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
    if (num >= 1) return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
    return num.toLocaleString(undefined, { maximumFractionDigits: 8 });
  };

  // Format USD value
  const formatUsd = (amount: string | number): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '0.00';
    return num.toFixed(2);
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
  
  // Get available chains for the selected coin
  const getAvailableChainsForCoin = (coin: Coin | null): Chain[] => {
    if (!coin) return [];
    return COIN_CONFIG[coin].supportedChains;
  };
  
  const availableChains = getAvailableChainsForCoin(selectedCoin);

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

          {/* Step 1: Coin Selection */}
          <div className={styles.chainSection}>
            <label className={styles.sectionLabel}>Step 1: Select Coin</label>
            <button
              className={`${styles.chainSelectorTrigger} ${selectedCoin ? styles.hasSelection : ''} haptic`}
              onClick={() => setCoinSheetOpen(true)}
              aria-expanded={coinSheetOpen}
            >
              {selectedCoin ? (
                <>
                  {selectedCoin === 'BLT' ? (
                    <span className={styles.chainIconWrapper} style={{ background: 'transparent', padding: 0, overflow: 'visible' }}>
                      <BLTLogo size={36} />
                    </span>
                  ) : (
                    <span 
                      className={styles.chainIconWrapper}
                      style={{ 
                        color: COIN_CONFIG[selectedCoin].color,
                        background: `${COIN_CONFIG[selectedCoin].color}15`
                      }}
                    >
                      {COIN_CONFIG[selectedCoin].icon}
                    </span>
                  )}
                  <div className={styles.chainSelectorInfo}>
                    <h3>{selectedCoin}</h3>
                    <p>{COIN_CONFIG[selectedCoin].name}</p>
                  </div>
                </>
              ) : (
                <>
                  <span 
                    className={styles.chainIconWrapper}
                    style={{ color: '#888', background: 'rgba(255,255,255,0.05)' }}
                  >
                    ₿
                  </span>
                  <div className={styles.chainSelectorInfo}>
                    <h3>Choose Coin</h3>
                    <p>Select a cryptocurrency to deposit</p>
                  </div>
                </>
              )}
              <span className={styles.chevron}>▼</span>
            </button>
          </div>

          {/* Step 2: Network Selection (only show after coin is selected) */}
          {selectedCoin && (
            <div className={styles.chainSection}>
              <label className={styles.sectionLabel}>Step 2: Select Network</label>
              <button
                className={`${styles.chainSelectorTrigger} ${selectedChain ? styles.hasSelection : ''} haptic`}
                onClick={() => setChainSheetOpen(true)}
                aria-expanded={chainSheetOpen}
                disabled={!selectedCoin}
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
                      <p>Deposit {selectedCoin} on {CHAIN_CONFIG[selectedChain].name}</p>
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
                      <p>Select a network for {selectedCoin}</p>
                    </div>
                  </>
                )}
                <span className={styles.chevron}>▼</span>
              </button>
            </div>
          )}

          {/* Selected Chain Address Card */}
          {selectedCoin && selectedChain && selectedState && (
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
                  <span className={styles.chainAssets}>{selectedCoin} on {CHAIN_CONFIG[selectedChain].name}</span>
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
                        Send only {selectedCoin} on {CHAIN_CONFIG[selectedChain].name} to this address. 
                        Sending other assets or using the wrong network may result in permanent loss.
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

          {/* All Coins Grid - Desktop Only */}
          <div className="hide-mobile">
            <label className={styles.sectionLabel}>All Coins</label>
            <div className={styles.chainGrid}>
              {SUPPORTED_COINS.map(coin => {
                const config = COIN_CONFIG[coin];
                const isSelected = selectedCoin === coin;

                return (
                  <div
                    key={coin}
                    className={`${styles.chainOption} ${isSelected ? styles.selected : ''} haptic`}
                    onClick={() => {
                      setSelectedCoin(coin);
                      setSelectedChain(null);
                    }}
                  >
                    {coin === 'BLT' ? (
                      <span className={styles.chainIcon} style={{ background: 'transparent', padding: 0, overflow: 'visible' }}>
                        <BLTLogo size={32} />
                      </span>
                    ) : (
                      <span 
                        className={styles.chainIcon}
                        style={{ 
                          color: config.color,
                          background: `${config.color}15`
                        }}
                      >
                        {config.icon}
                      </span>
                    )}
                    <div className={styles.chainDetails}>
                      <span className={styles.chainName}>{coin}</span>
                      <span className={styles.chainSubtext}>
                        {config.supportedChains.length} networks
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Available Networks for Selected Coin - Desktop */}
            {selectedCoin && (
              <>
                <label className={styles.sectionLabel} style={{ marginTop: '1.5rem' }}>
                  Available Networks for {selectedCoin}
                </label>
                <div className={styles.chainGrid}>
                  {availableChains.map(chain => {
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
                            {state.address ? 'Address ready' : 'Tap to select'}
                          </span>
                        </div>
                        {state.address && (
                          <span className={styles.checkmark}>✓</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Info Section */}
          <div className={styles.infoSection}>
            <h3>How Deposits Work</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>1</span>
                <div>
                  <h4>Select Coin & Network</h4>
                  <p>Choose your coin, then select a supported network</p>
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

          {/* Pending Deposits */}
          {pendingDeposits.length > 0 && (
            <div className={styles.historySection}>
              <h3>⏳ Incoming Deposits</h3>
              <p className={styles.pendingSummary}>
                {pendingSummary.count} deposit{pendingSummary.count > 1 ? 's' : ''} pending • 
                ${pendingSummary.amountUsd.toFixed(2)} will be credited soon
              </p>
              <div className={styles.depositList}>
                {pendingDeposits.map(deposit => (
                  <div key={deposit.id} className={`${styles.depositRow} ${styles.pending}`}>
                    <div className={styles.depositInfo}>
                      <span className={styles.depositAsset}>{deposit.asset}</span>
                      <span className={styles.depositChain}>{deposit.chain}</span>
                      <span className={styles.depositStatus}>{deposit.status}</span>
                    </div>
                    <div className={styles.depositAmounts}>
                      <span className="amount">{formatAmount(deposit.amount)}</span>
                      <span className={styles.usdValue}>${formatUsd(deposit.amountUsd)}</span>
                    </div>
                    <div className={styles.progressSection}>
                      <div className={styles.progressBar}>
                        <div 
                          className={styles.progressFill} 
                          style={{ width: `${deposit.progress}%` }}
                        />
                      </div>
                      <span className={styles.progressText}>
                        {deposit.progress >= 100 
                          ? 'Finalizing...' 
                          : `${deposit.confirmations || 0}/${deposit.requiredConfirmations} confirms • ${formatTimeRemaining(deposit.estimatedSecondsRemaining)}`
                        }
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                      <span className="amount">{formatAmount(deposit.amount)}</span>
                      <span className={styles.usdValue}>${formatUsd(deposit.amountUsd)}</span>
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
                <p>No completed deposits yet. Generate an address to get started!</p>
              </div>
            </div>
          )}

          {/* Debug Panel */}
          <div className={styles.debugPanel}>
            <button 
              className={styles.debugToggle}
              onClick={() => setShowDebug(!showDebug)}
            >
              {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
            </button>
            {showDebug && debugInfo && (
              <div className={styles.debugContent}>
                <h4>Debug Info</h4>
                <p>User ID: {debugInfo.userId}</p>
                <p>Last Updated: {debugInfo.timestamp}</p>
                <p>Completed Deposits: {debugInfo.depositsCount}</p>
                <p>Pending Deposits: {debugInfo.pendingCount}</p>
                <details>
                  <summary>Raw Response</summary>
                  <pre>{JSON.stringify(debugInfo.rawResponse, null, 2)}</pre>
                </details>
                <button 
                  className={styles.refreshBtn}
                  onClick={() => userId && loadDeposits(userId)}
                >
                  Refresh Deposits
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Sheet Overlay */}
        <div 
          className={`${styles.bottomSheetOverlay} ${(coinSheetOpen || chainSheetOpen) ? styles.visible : ''}`}
          onClick={() => {
            setCoinSheetOpen(false);
            setChainSheetOpen(false);
          }}
        />

        {/* Bottom Sheet - Coin Selection */}
        <div className={`${styles.bottomSheet} ${coinSheetOpen ? styles.visible : ''}`}>
          <div className={styles.bottomSheetHandle} />
          <h3 className={styles.bottomSheetTitle}>Select Coin</h3>
          <div className={styles.bottomSheetChainGrid}>
            {SUPPORTED_COINS.map(coin => {
              const config = COIN_CONFIG[coin];
              const isSelected = selectedCoin === coin;

              return (
                <button
                  key={coin}
                  className={`${styles.bottomSheetChainOption} ${isSelected ? styles.selected : ''} haptic`}
                  onClick={() => {
                    setSelectedCoin(coin);
                    setSelectedChain(null);
                    setCoinSheetOpen(false);
                  }}
                >
                  {coin === 'BLT' ? (
                    <span className={styles.chainIcon} style={{ background: 'transparent', padding: 0, overflow: 'visible' }}>
                      <BLTLogo size={32} />
                    </span>
                  ) : (
                    <span 
                      className={styles.chainIcon}
                      style={{ 
                        color: config.color,
                        background: `${config.color}15`
                      }}
                    >
                      {config.icon}
                    </span>
                  )}
                  <div className={styles.chainDetails}>
                    <span className={styles.chainName}>{coin}</span>
                    <span className={styles.chainSubtext}>
                      {config.supportedChains.length} networks
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Sheet - Chain Selection */}
        <div className={`${styles.bottomSheet} ${chainSheetOpen ? styles.visible : ''}`}>
          <div className={styles.bottomSheetHandle} />
          <h3 className={styles.bottomSheetTitle}>
            Select Network for {selectedCoin || 'Coin'}
          </h3>
          <div className={styles.bottomSheetChainGrid}>
            {selectedCoin ? (
              availableChains.map(chain => {
                const config = CHAIN_CONFIG[chain];
                const state = addresses[chain];
                const isSelected = selectedChain === chain;

                return (
                  <button
                    key={chain}
                    className={`${styles.bottomSheetChainOption} ${isSelected ? styles.selected : ''} haptic`}
                    onClick={() => {
                      setSelectedChain(chain);
                      setChainSheetOpen(false);
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
                        {state.address ? '✓ Address ready' : config.nativeAsset}
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <p className={styles.emptyHistory}>Please select a coin first</p>
            )}
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
