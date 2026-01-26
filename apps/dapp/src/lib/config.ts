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
    solana: process.env.VAULT_ADDRESS_SOLANA || '',
  },

  // RPC URLs per chain
  rpcUrls: {
    ethereum: process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
    base: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    arbitrum: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    hyperevm: process.env.HYPEREVM_RPC_URL || 'https://rpc.hyperliquid.xyz/evm',
    solana: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  },

  // Confirmation thresholds per chain
  confirmationThresholds: {
    ethereum: 12,
    base: 50,
    arbitrum: 50,
    hyperevm: 1,
    solana: 32,
  } as const,
} as const;

// Validate required environment variables
if (process.env.NODE_ENV === 'production') {
  if (!config.hyperevmRpcUrl) {
    throw new Error('HYPEREVM_RPC_URL is required in production');
  }
}
