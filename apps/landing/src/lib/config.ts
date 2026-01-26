// Environment configuration
export const config = {
  // Blockchain
  hyperevmRpcUrl: process.env.HYPEREVM_RPC_URL || '',
  bltContractAddress: process.env.BLT_CONTRACT_ADDRESS || '0xFEF20Fd2422a9d47Fe1a8C355A1AE83F04025EDF',
  
  // Payment window (15 minutes in milliseconds)
  paymentWindowMs: 15 * 60 * 1000,
  
  // Blockchain polling interval (seconds)
  pollingInterval: 10,
} as const;

// Validate required environment variables
if (process.env.NODE_ENV === 'production') {
  if (!config.hyperevmRpcUrl) {
    throw new Error('HYPEREVM_RPC_URL is required in production');
  }
}
