/**
 * Wallet Token Scanner API
 * 
 * Scans the platform's settlement wallet for available tokens
 * across multiple chains (EVM + Solana).
 */

import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { getRpcUrl, isSolana, getChainName, hasRpc } from '@/lib/rpc';
import { getSolanaTokenBalance } from '@/services/solana-payout.service';

const ERC20_ABI = [
    'function balanceOf(address) view returns (uint256)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
];

// Known token addresses per chain
const KNOWN_TOKENS: Record<number, { address: string; symbol: string; decimals: number }[]> = {
    999: [
        { address: '0xFEF20Fd2422a9d47Fe1a8C355A1AE83F04025EDF', symbol: 'BLT', decimals: 18 },
    ],
    1: [
        { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', decimals: 6 },
        { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', decimals: 6 },
        { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', decimals: 18 },
    ],
    8453: [
        { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', decimals: 6 },
        { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', decimals: 18 },
    ],
    42161: [
        { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', symbol: 'USDC', decimals: 6 },
        { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', symbol: 'USDT', decimals: 6 },
    ],
    0: [
        { address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', decimals: 6 },
        { address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', symbol: 'USDT', decimals: 6 },
    ],
};

interface WalletToken {
    address: string;
    symbol: string;
    balance: string;
    decimals: number;
}

interface ChainTokens {
    chainId: number;
    chainName: string;
    tokens: WalletToken[];
    vaultAddress?: string;
}

// Map chainId to vault address - EVM chains share one address, Solana has its own
function getVaultAddress(chainId: number): string | undefined {
    if (chainId === 0) {
        return process.env.VAULT_ADDRESS_SOLANA;
    }
    // All EVM chains use the same vault address
    return process.env.VAULT_ADDRESS_EVM || process.env.VAULT_ADDRESS_HYPEREVM;
}

export async function GET() {
    const results: ChainTokens[] = [];
    let hasAnyVault = false;

    // Scan EVM chains
    for (const [chainIdStr, tokens] of Object.entries(KNOWN_TOKENS)) {
        const chainId = parseInt(chainIdStr);

        // Skip Solana (handled separately) and chains without RPC
        if (isSolana(chainId) || !hasRpc(chainId)) continue;

        const vaultAddress = getVaultAddress(chainId);
        if (!vaultAddress) continue;
        hasAnyVault = true;

        try {
            const rpcUrl = getRpcUrl(chainId);
            const provider = new ethers.JsonRpcProvider(rpcUrl);
            const chainTokens: WalletToken[] = [];

            for (const token of tokens) {
                try {
                    const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
                    const balance = await contract.balanceOf(vaultAddress);

                    // Include tokens with non-zero balance
                    if (balance > 0n) {
                        chainTokens.push({
                            address: token.address,
                            symbol: token.symbol,
                            balance: ethers.formatUnits(balance, token.decimals),
                            decimals: token.decimals,
                        });
                    }
                } catch (tokenError) {
                    console.warn(`Failed to fetch ${token.symbol} on chain ${chainId}:`, tokenError);
                }
            }

            // Also check native ETH/gas token balance
            try {
                const nativeBalance = await provider.getBalance(vaultAddress);
                if (nativeBalance > 0n) {
                    const nativeSymbol = chainId === 999 ? 'HYPE' : 'ETH';
                    chainTokens.push({
                        address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
                        symbol: nativeSymbol,
                        balance: ethers.formatEther(nativeBalance),
                        decimals: 18,
                    });
                }
            } catch {
                // Ignore native balance errors
            }

            if (chainTokens.length > 0) {
                results.push({
                    chainId,
                    chainName: getChainName(chainId),
                    tokens: chainTokens,
                    vaultAddress,
                });
            }
        } catch (chainError) {
            console.error(`Failed to scan chain ${chainId}:`, chainError);
        }
    }

    // Scan Solana
    const solanaVaultAddress = getVaultAddress(0);
    if (solanaVaultAddress && hasRpc(0)) {
        hasAnyVault = true;
        const solanaTokens: WalletToken[] = [];
        const solanaKnownTokens = KNOWN_TOKENS[0] || [];

        for (const token of solanaKnownTokens) {
            try {
                const { balance, decimals } = await getSolanaTokenBalance(
                    solanaVaultAddress,
                    token.address
                );

                if (balance > 0) {
                    solanaTokens.push({
                        address: token.address,
                        symbol: token.symbol,
                        balance: balance.toString(),
                        decimals,
                    });
                }
            } catch (tokenError) {
                console.warn(`Failed to fetch Solana ${token.symbol}:`, tokenError);
            }
        }

        if (solanaTokens.length > 0) {
            results.push({
                chainId: 0,
                chainName: 'Solana',
                tokens: solanaTokens,
                vaultAddress: solanaVaultAddress,
            });
        }
    }

    if (!hasAnyVault) {
        return NextResponse.json(
            { success: false, error: 'No vault addresses configured. Set VAULT_ADDRESS_HYPEREVM and other VAULT_ADDRESS_* variables.' },
            { status: 500 }
        );
    }

    return NextResponse.json({
        success: true,
        data: results,
    });
}
