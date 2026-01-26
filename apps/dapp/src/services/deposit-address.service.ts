/**
 * Deposit Address Service
 * 
 * Generates and manages unique deposit addresses per user using HD wallet derivation.
 * Follows BIP-44 standard for deterministic address generation.
 */

import { ethers } from 'ethers';
import { Keypair as SolanaKeypair } from '@solana/web3.js';
import { derivePath } from 'ed25519-hd-key';
import { prisma } from '@/lib/db';
import { config } from '@/lib/config';

// Supported chains
export type Chain = 'ethereum' | 'base' | 'arbitrum' | 'hyperevm' | 'solana';

// EVM chains share the same derivation (coin type 60)
const EVM_CHAINS: Chain[] = ['ethereum', 'base', 'arbitrum', 'hyperevm'];

// Chain-specific coin types for BIP-44
const COIN_TYPES: Record<Chain, number> = {
    ethereum: 60,
    base: 60,      // Uses ETH derivation
    arbitrum: 60,  // Uses ETH derivation
    hyperevm: 60,  // Uses ETH derivation
    solana: 501,
};

// Cache for master wallet nodes
let evmMasterNode: ethers.HDNodeWallet | null = null;
let solanaSeed: Buffer | null = null;

/**
 * Initialize the HD wallet master nodes from seed
 */
function initializeMasterWallet(): boolean {
    if (!config.hdMasterSeed) {
        console.warn('HD_MASTER_SEED not configured, deposit address generation disabled');
        return false;
    }

    try {
        // Determine if seed is a mnemonic or hex
        const seed = config.hdMasterSeed;

        if (seed.includes(' ')) {
            // Mnemonic phrase - use fromPhrase to get root HD node
            evmMasterNode = ethers.HDNodeWallet.fromPhrase(seed);
            const mnemonic = ethers.Mnemonic.fromPhrase(seed);
            solanaSeed = Buffer.from(mnemonic.computeSeed());
        } else {
            // Hex seed
            const seedBuffer = Buffer.from(seed, 'hex');
            evmMasterNode = ethers.HDNodeWallet.fromSeed(seedBuffer);
            solanaSeed = seedBuffer;
        }

        console.log('HD wallet master node initialized');
        return true;
    } catch (error) {
        console.error('Failed to initialize HD wallet:', error);
        return false;
    }
}

/**
 * Derive an EVM wallet from the master wallet
 * Path: m/44'/60'/0'/0/{index}
 */
function deriveEvmWallet(index: number): ethers.HDNodeWallet {
    if (!evmMasterNode) {
        if (!initializeMasterWallet()) {
            throw new Error('HD wallet not initialized');
        }
    }

    // Use relative path (without m/) since fromPhrase returns root node
    const path = `44'/60'/0'/0/${index}`;
    return evmMasterNode!.derivePath(path);
}

/**
 * Derive an EVM address from the master wallet
 * Path: m/44'/60'/0'/0/{index}
 */
function deriveEvmAddress(index: number): string {
    return deriveEvmWallet(index).address;
}

/**
 * Derive an EVM private key from the master wallet
 * Path: m/44'/60'/0'/0/{index}
 * WARNING: Handle private keys with extreme care - never log them
 */
export function deriveEvmPrivateKey(index: number): string {
    const wallet = deriveEvmWallet(index);
    return wallet.privateKey;
}

/**
 * Derive a Solana address from the master seed
 * Path: m/44'/501'/{index}'/0'
 */
function deriveSolanaAddress(index: number): string {
    if (!solanaSeed) {
        if (!initializeMasterWallet()) {
            throw new Error('HD wallet not initialized');
        }
    }

    const path = `m/44'/501'/${index}'/0'`;
    const derived = derivePath(path, solanaSeed!.toString('hex'));
    const keypair = SolanaKeypair.fromSeed(derived.key);
    return keypair.publicKey.toBase58();
}

/**
 * Derive an address for a specific chain and index
 */
export function deriveAddress(chain: Chain, index: number): string {
    if (EVM_CHAINS.includes(chain)) {
        return deriveEvmAddress(index);
    } else if (chain === 'solana') {
        return deriveSolanaAddress(index);
    }

    throw new Error(`Unsupported chain: ${chain}`);
}

/**
 * Get or create a deposit address for a user on a specific chain
 * Returns the same address for the same user/chain combination (CEX-style)
 * 
 * IMPORTANT: All EVM chains share the same deposit address per user
 */
export async function getDepositAddress(
    userId: string,
    chain: Chain
): Promise<{ address: string; isNew: boolean }> {
    const isEvmChain = EVM_CHAINS.includes(chain);

    // Check for existing address on this specific chain
    const existing = await prisma.depositAddress.findUnique({
        where: {
            userId_chain: { userId, chain },
        },
    });

    if (existing) {
        return { address: existing.address, isNew: false };
    }

    // For EVM chains, check if user already has any EVM address (they share the same wallet)
    if (isEvmChain) {
        const existingEvmAddress = await prisma.depositAddress.findFirst({
            where: {
                userId,
                chain: { in: EVM_CHAINS },
            },
            orderBy: { createdAt: 'asc' }, // CRITICAL: Always use the FIRST created address
        });

        if (existingEvmAddress) {
            // Reuse the same address and derivation index for this EVM chain
            await prisma.depositAddress.create({
                data: {
                    userId,
                    chain,
                    address: existingEvmAddress.address,
                    derivationIndex: existingEvmAddress.derivationIndex,
                },
            });

            console.log(`Linked EVM deposit address for user ${userId} on ${chain}: ${existingEvmAddress.address}`);
            return { address: existingEvmAddress.address, isNew: false };
        }
    }

    // No existing address found - derive a new one
    const maxIndex = await prisma.depositAddress.aggregate({
        _max: { derivationIndex: true },
    });
    const nextIndex = (maxIndex._max.derivationIndex ?? -1) + 1;

    // Derive the address
    const address = deriveAddress(chain, nextIndex);

    // Store in database
    await prisma.depositAddress.create({
        data: {
            userId,
            chain,
            address,
            derivationIndex: nextIndex,
        },
    });

    console.log(`Created deposit address for user ${userId} on ${chain}: ${address}`);
    return { address, isNew: true };
}

/**
 * Ensure all EVM addresses for a user are consistent
 * This fixes any inconsistencies where EVM chains have different addresses
 * Call this to verify/repair a user's EVM address state
 */
export async function ensureEvmAddressConsistency(userId: string): Promise<{
    fixed: number;
    canonical: string | null;
}> {
    const evmAddresses = await prisma.depositAddress.findMany({
        where: {
            userId,
            chain: { in: EVM_CHAINS },
        },
        orderBy: { createdAt: 'asc' },
    });

    if (evmAddresses.length <= 1) {
        return { fixed: 0, canonical: evmAddresses[0]?.address || null };
    }

    // The canonical address is the FIRST one created
    const canonical = evmAddresses[0];
    let fixed = 0;

    // Update any that don't match the canonical
    for (const addr of evmAddresses.slice(1)) {
        if (addr.address !== canonical.address || addr.derivationIndex !== canonical.derivationIndex) {
            await prisma.depositAddress.update({
                where: { id: addr.id },
                data: {
                    address: canonical.address,
                    derivationIndex: canonical.derivationIndex,
                },
            });
            console.log(`Fixed EVM address for ${addr.chain}: ${addr.address.slice(0, 10)}... → ${canonical.address.slice(0, 10)}...`);
            fixed++;
        }
    }

    return { fixed, canonical: canonical.address };
}

/**
 * Fix all users' EVM address consistency in the database
 * Run this once to clean up existing inconsistencies
 */
export async function fixAllEvmAddressInconsistencies(): Promise<{
    usersChecked: number;
    usersFixed: number;
    addressesFixed: number;
}> {
    // Get all users with EVM addresses
    const usersWithEvmAddresses = await prisma.depositAddress.findMany({
        where: { chain: { in: EVM_CHAINS } },
        select: { userId: true },
        distinct: ['userId'],
    });

    let usersFixed = 0;
    let addressesFixed = 0;

    for (const { userId } of usersWithEvmAddresses) {
        const result = await ensureEvmAddressConsistency(userId);
        if (result.fixed > 0) {
            usersFixed++;
            addressesFixed += result.fixed;
        }
    }

    console.log(`EVM address cleanup: checked ${usersWithEvmAddresses.length} users, fixed ${addressesFixed} addresses for ${usersFixed} users`);

    return {
        usersChecked: usersWithEvmAddresses.length,
        usersFixed,
        addressesFixed,
    };
}

/**
 * Get all deposit addresses for a user across all chains
 */
export async function getUserDepositAddresses(userId: string): Promise<
    Array<{ chain: Chain; address: string }>
> {
    const addresses = await prisma.depositAddress.findMany({
        where: { userId },
        select: { chain: true, address: true },
    });

    return addresses as Array<{ chain: Chain; address: string }>;
}

/**
 * Get deposit address by address string (for incoming deposit matching)
 */
export async function getDepositAddressByAddress(address: string) {
    return await prisma.depositAddress.findUnique({
        where: { address },
        include: { user: true },
    });
}

/**
 * Get the derivation index for a deposit address
 * Used for deriving private keys during sweep operations
 */
export async function getDerivationIndex(address: string): Promise<number | null> {
    const depositAddress = await prisma.depositAddress.findUnique({
        where: { address },
        select: { derivationIndex: true },
    });

    return depositAddress?.derivationIndex ?? null;
}

/**
 * Validate address format for a chain
 */
export function isValidAddress(chain: Chain, address: string): boolean {
    if (EVM_CHAINS.includes(chain)) {
        // EVM address validation: 0x + 40 hex chars
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    } else if (chain === 'solana') {
        // Solana address validation: base58, 32-44 chars
        return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
    }
    return false;
}

/**
 * Get all supported chains
 */
export function getSupportedChains(): Chain[] {
    return ['ethereum', 'base', 'arbitrum', 'hyperevm', 'solana'];
}

/**
 * Get confirmation threshold for a chain
 */
export function getConfirmationThreshold(chain: Chain): number {
    return config.confirmationThresholds[chain] || 12;
}

/**
 * Check if HD wallet is properly configured
 */
export function isHdWalletConfigured(): boolean {
    return !!config.hdMasterSeed;
}
