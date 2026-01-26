/**
 * Dynamic RPC Router
 * 
 * Maps chainId to the appropriate RPC endpoint URL.
 * Supports EVM chains and Solana.
 */

// Chain ID to RPC URL mapping from environment variables
// Uses existing env var naming from .env file
const RPC_URLS: Record<number, string | undefined> = {
    999: process.env.HYPEREVM_RPC_URL,  // HyperEVM
    1: process.env.ETHEREUM_RPC_URL,    // Ethereum Mainnet
    8453: process.env.BASE_RPC_URL,     // Base
    42161: process.env.ARBITRUM_RPC_URL, // Arbitrum One
    0: process.env.SOLANA_RPC_URL,      // Solana
};

// Chain ID to human-readable name mapping
const CHAIN_NAMES: Record<number, string> = {
    999: 'HyperEVM',
    1: 'Ethereum',
    8453: 'Base',
    42161: 'Arbitrum',
    0: 'Solana',
};

/**
 * Get the RPC URL for a given chainId
 * @throws Error if no RPC is configured for the chainId
 */
export function getRpcUrl(chainId: number): string {
    const url = RPC_URLS[chainId];
    if (!url) {
        throw new Error(`No RPC configured for chainId ${chainId}. Please set RPC_URL_${chainId} in your environment.`);
    }
    return url;
}

/**
 * Check if an RPC is configured for a given chainId
 */
export function hasRpc(chainId: number): boolean {
    return !!RPC_URLS[chainId];
}

/**
 * Check if a chainId refers to Solana (requires special handling)
 */
export function isSolana(chainId: number): boolean {
    return chainId === 0;
}

/**
 * Get chain name from chainId
 */
export function getChainName(chainId: number): string {
    return CHAIN_NAMES[chainId] || `Chain ${chainId}`;
}

/**
 * Get all supported chain IDs
 */
export function getSupportedChainIds(): number[] {
    return Object.keys(RPC_URLS).map(id => parseInt(id));
}
