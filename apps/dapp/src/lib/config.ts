// Environment detection
const isTestnet = process.env.USE_TESTNET === 'true';

// Environment configuration
export const config = {
  // Blockchain
  hyperevmRpcUrl: process.env.HYPEREVM_RPC_URL || '',
  bltContractAddress: process.env.BLT_CONTRACT_ADDRESS || '0xFEF20Fd2422a9d47Fe1a8C355A1AE83F04025EDF',

  // Payment window (15 minutes in milliseconds)
  paymentWindowMs: 15 * 60 * 1000,

  // Blockchain polling interval (seconds)
  pollingInterval: 10,

  // Deposit Address System (HD Wallet)
  hdMasterSeed: process.env.HD_MASTER_SEED || '',
  sweepIntervalHours: parseInt(process.env.SWEEP_INTERVAL_HOURS || '6', 10),
  minSweepThresholdUsd: parseFloat(process.env.MIN_SWEEP_THRESHOLD_USD || '50'),

  // Treasury Keys (for sweep operations)
  treasuryKeys: {
    evm: process.env.TREASURY_KEY_EVM || '',
    solana: process.env.TREASURY_KEY_SOLANA || '',
  },

  // Vault Addresses (per chain) - where swept funds go
  vaultAddresses: {
    ethereum: process.env.VAULT_ADDRESS_EVM || process.env.VAULT_ADDRESS_ETHEREUM || '',
    base: process.env.VAULT_ADDRESS_EVM || process.env.VAULT_ADDRESS_BASE || '',
    arbitrum: process.env.VAULT_ADDRESS_EVM || process.env.VAULT_ADDRESS_ARBITRUM || '',
    hyperevm: process.env.VAULT_ADDRESS_EVM || process.env.VAULT_ADDRESS_HYPEREVM || '',
    bsc: isTestnet
      ? process.env.VAULT_ADDRESS_BSC_TESTNET || ''
      : process.env.VAULT_ADDRESS_BSC || process.env.VAULT_ADDRESS_EVM || '',
    solana: process.env.VAULT_ADDRESS_SOLANA || '',
  },

  // RPC URLs per chain
  rpcUrls: {
    ethereum: process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
    base: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    arbitrum: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    hyperevm: process.env.HYPEREVM_RPC_URL || 'https://rpc.hyperliquid.xyz/evm',
    bsc: isTestnet
      ? process.env.BSC_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545/'
      : process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org/',
    solana: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  },

  // Confirmation thresholds per chain
  confirmationThresholds: {
    ethereum: 12,
    base: 50,
    arbitrum: 50,
    hyperevm: 1,
    bsc: 15,
    solana: 32,
  } as const,

  // Reorg protection configuration
  reorgProtection: {
    // Safety margin beyond standard confirmations (blocks)
    safetyMarginBlocks: {
      ethereum: 12,   // 12 + 12 = 24 total (~5 min)
      base: 25,       // 50 + 25 = 75 total (~2 min)
      arbitrum: 25,
      hyperevm: 20,   // 1 + 20 = 21 total (~20 seconds, matches Solana)
      bsc: 10,
      solana: 16,     // 32 + 16 = 48 slots (~20 sec)
    } as const,

    // How often to check for reorgs (ms)
    reorgCheckIntervalMs: 30000, // 30 seconds

    // Maximum reorg depth to check (blocks)
    maxReorgDepth: 100,
  },

  // Alerting configuration
  alerts: {
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
    telegramChatId: process.env.TELEGRAM_ADMIN_CHAT_ID || '',
    alertCooldownMs: 5 * 60 * 1000, // 5 minutes per deposit
  },

  // Token Addresses per chain
  tokenAddresses: {
    ethereum: {
      ETH: 'native',
      USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    },
    base: {
      ETH: 'native',
      USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    },
    arbitrum: {
      ETH: 'native',
      USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
      USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    },
    hyperevm: {
      ETH: 'native',
      BLT: process.env.BLT_CONTRACT_ADDRESS || '0xFEF20Fd2422a9d47Fe1a8C355A1AE83F04025EDF',
      USDT: '0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb',
      USDC: '0xb88339CB7199b77E23DB6E890353E22632Ba630f',
      HYPE: 'native',
    },
    bsc: {
      BNB: 'native',
      USDT: '0x55d398326f99059fF775485246999027B3197955',
      USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    },
  },
} as const;

// Validate required environment variables
// Skip validation during build phase to allow static generation
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.CI === 'true' ||
  process.env.VERCEL === '1';

if (process.env.NODE_ENV === 'production' && !isBuildPhase) {
  if (!config.hyperevmRpcUrl) {
    throw new Error('HYPEREVM_RPC_URL is required in production');
  }
}

// Runtime check for Supabase vars (non-blocking but logged)
if (typeof window !== 'undefined') {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    console.warn('AUTH_WARNING: NEXT_PUBLIC_SUPABASE_URL is not configured correctly');
  }
}
