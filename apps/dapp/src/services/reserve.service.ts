import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAccount, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';

const prisma = new PrismaClient();

// ERC20 ABI - just need balanceOf
const ERC20_ABI = ['function balanceOf(address) view returns (uint256)'];

// Chain RPC endpoints
const CHAIN_RPC: Record<number, string> = {
    999: process.env.HYPEREVM_RPC_URL || 'https://rpc.hyperliquid.xyz/evm',
    1: process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
    8453: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    42161: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
};

// Treasury wallet addresses per chain (derived from env keys)
function getTreasuryAddress(chainId: number): string | null {
    // Solana special case
    if (chainId === 0) {
        const solanaKey = process.env.TREASURY_KEY_SOLANA;
        if (!solanaKey) return null;
        try {
            // For Solana, the key is base58 encoded - derive pubkey using Keypair
            const { Keypair } = require('@solana/web3.js');
            const bs58 = require('bs58');
            const secretKey = bs58.decode(solanaKey);
            const keypair = Keypair.fromSecretKey(secretKey);
            return keypair.publicKey.toString();
        } catch (err) {
            console.error('Failed to derive Solana address:', err);
            return null;
        }
    }

    // All EVM chains use the same key
    const privateKey = process.env.TREASURY_KEY_EVM || process.env.PAYOUT_PRIVATE_KEY;
    if (!privateKey) return null;

    try {
        const wallet = new ethers.Wallet(privateKey);
        return wallet.address;
    } catch {
        return null;
    }
}

// Rounding unit labels
const ROUNDING_LABELS: Record<number, string> = {
    1000: 'K',
    1000000: 'M',
    10000000: '10M',
    100000000: '100M',
    1000000000: 'B',
};

// Format balance with rounding
function formatRoundedBalance(
    rawBalance: bigint,
    decimals: number,
    roundingUnit: number,
    symbol: string
): string {
    // Convert to number (safe for display purposes)
    const balanceNum = Number(rawBalance) / Math.pow(10, decimals);

    // Round to nearest unit
    const rounded = Math.round(balanceNum / roundingUnit) * roundingUnit;

    // Get display value
    let displayValue: string;
    let suffix = '';

    if (roundingUnit >= 1000000000) {
        displayValue = (rounded / 1000000000).toFixed(1);
        suffix = 'B';
    } else if (roundingUnit >= 1000000) {
        displayValue = (rounded / 1000000).toFixed(0);
        suffix = 'M';
    } else if (roundingUnit >= 1000) {
        displayValue = (rounded / 1000).toFixed(0);
        suffix = 'K';
    } else {
        displayValue = rounded.toFixed(0);
    }

    // Remove trailing .0
    displayValue = displayValue.replace(/\.0$/, '');

    return `${displayValue}${suffix} $${symbol}`;
}

// Get EVM token balance
async function getEVMBalance(
    tokenAddress: string,
    walletAddress: string,
    chainId: number
): Promise<bigint> {
    const rpcUrl = CHAIN_RPC[chainId];
    if (!rpcUrl) throw new Error(`No RPC URL for chain ${chainId}`);

    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Native token check
    if (tokenAddress === '0x0000000000000000000000000000000000000000' ||
        tokenAddress.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
        const balance = await provider.getBalance(walletAddress);
        return balance;
    }

    // ERC20 token
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const balance = await contract.balanceOf(walletAddress);
    return balance;
}

// Get Solana token/SOL balance
async function getSolanaBalance(
    tokenAddress: string,
    walletAddress: string
): Promise<bigint> {
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    const connection = new Connection(rpcUrl, 'confirmed');

    try {
        const walletPubkey = new PublicKey(walletAddress);

        // Native SOL check
        if (tokenAddress === 'So11111111111111111111111111111111111111112' ||
            tokenAddress.toLowerCase() === 'sol') {
            const balance = await connection.getBalance(walletPubkey);
            return BigInt(balance);
        }

        // SPL Token
        const mintPubkey = new PublicKey(tokenAddress);
        const ataAddress = await getAssociatedTokenAddress(mintPubkey, walletPubkey);

        try {
            const tokenAccount = await getAccount(connection, ataAddress);
            return BigInt(tokenAccount.amount.toString());
        } catch (err: any) {
            // Token account doesn't exist = 0 balance
            if (err.name === 'TokenAccountNotFoundError') {
                return BigInt(0);
            }
            throw err;
        }
    } catch (error) {
        console.error('Error fetching Solana balance:', error);
        return BigInt(0);
    }
}

// Main function: Get reserve balance for a campaign
export async function getReserveBalance(
    tokenAddress: string,
    tokenSymbol: string,
    tokenDecimals: number,
    chainId: number,
    roundingUnit: number
): Promise<{ raw: bigint; rounded: string }> {
    const treasuryAddress = getTreasuryAddress(chainId);

    if (!treasuryAddress) {
        return { raw: BigInt(0), rounded: `0 $${tokenSymbol}` };
    }

    let rawBalance: bigint;

    if (chainId === 0) {
        // Solana
        rawBalance = await getSolanaBalance(tokenAddress, treasuryAddress);
    } else {
        // EVM chains
        rawBalance = await getEVMBalance(tokenAddress, treasuryAddress, chainId);
    }

    const rounded = formatRoundedBalance(rawBalance, tokenDecimals, roundingUnit, tokenSymbol);

    return { raw: rawBalance, rounded };
}

// Refresh cache for a campaign (called every 12 hours or manually)
export async function refreshReserveCache(campaignId: string): Promise<string> {
    const campaign = await prisma.campaignConfig.findUnique({
        where: { id: campaignId },
    });

    if (!campaign) {
        throw new Error('Campaign not found');
    }

    const { rounded } = await getReserveBalance(
        campaign.tokenAddress,
        campaign.tokenSymbol,
        campaign.tokenDecimals,
        campaign.chainId,
        campaign.reserveRoundingUnit
    );

    await prisma.campaignConfig.update({
        where: { id: campaignId },
        data: {
            reserveCachedBalance: rounded,
            reserveCacheUpdatedAt: new Date(),
        },
    });

    return rounded;
}

// Get cached balance or refresh if stale (12 hours)
export async function getCachedReserve(campaignId: string): Promise<string> {
    const campaign = await prisma.campaignConfig.findUnique({
        where: { id: campaignId },
    });

    if (!campaign) {
        return '0';
    }

    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

    // Check if cache is valid
    if (campaign.reserveCachedBalance &&
        campaign.reserveCacheUpdatedAt &&
        campaign.reserveCacheUpdatedAt > twelveHoursAgo) {
        return campaign.reserveCachedBalance;
    }

    // Refresh cache
    try {
        return await refreshReserveCache(campaignId);
    } catch (error) {
        console.error('Failed to refresh reserve cache:', error);
        return campaign.reserveCachedBalance || `0 $${campaign.tokenSymbol}`;
    }
}

// Get available rounding options
export const ROUNDING_OPTIONS = [
    { value: 1000, label: '1K' },
    { value: 100000, label: '100K' },
    { value: 1000000, label: '1M' },
    { value: 10000000, label: '10M' },
    { value: 100000000, label: '100M' },
    { value: 1000000000, label: '1B' },
];
