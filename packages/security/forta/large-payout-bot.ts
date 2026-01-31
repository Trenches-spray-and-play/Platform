/**
 * Forta Bot: Large Payout Detection
 * 
 * Monitors for unusually large payouts that may indicate:
 * - Compromised keys
 * - Oracle manipulation
 * - System misconfiguration
 */

import {
    Finding,
    FindingSeverity,
    FindingType,
    TransactionEvent,
    HandleTransaction,
    getJsonRpcUrl,
} from 'forta-agent';
import { ethers } from 'ethers';

// Configuration
const THRESHOLDS = {
    // USD thresholds per chain
    ethereum: 10000,
    base: 5000,
    arbitrum: 5000,
    hyperevm: 2000,
    bsc: 2000,
    solana: 2000,
};

// Known payout contract addresses per chain
const PAYOUT_CONTRACTS: Record<string, string[]> = {
    ethereum: [process.env.PAYOUT_CONTRACT_ETHEREUM || ''],
    base: [process.env.PAYOUT_CONTRACT_BASE || ''],
    arbitrum: [process.env.PAYOUT_CONTRACT_ARBITRUM || ''],
    hyperevm: [process.env.PAYOUT_CONTRACT_HYPEREVM || ''],
    bsc: [process.env.PAYOUT_CONTRACT_BSC || ''],
};

// ERC20 Transfer event signature
const TRANSFER_EVENT = 'event Transfer(address indexed from, address indexed to, uint256 value)';

// Rate limiting: track alerts per hour
const alertHistory: Map<string, number> = new Map();
const ALERT_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

function shouldAlert(key: string): boolean {
    const lastAlert = alertHistory.get(key);
    const now = Date.now();
    
    if (!lastAlert || (now - lastAlert) > ALERT_COOLDOWN_MS) {
        alertHistory.set(key, now);
        return true;
    }
    return false;
}

export function provideHandleTransaction(): HandleTransaction {
    return async (txEvent: TransactionEvent) => {
        const findings: Finding[] = [];
        
        // Check for large ERC20 transfers from payout wallets
        const transfers = txEvent.filterLog(TRANSFER_EVENT);
        
        for (const transfer of transfers) {
            const from = transfer.args.from.toLowerCase();
            const to = transfer.args.to.toLowerCase();
            const value = transfer.args.value;
            
            // Check if sender is a known payout contract
            const isPayoutContract = Object.values(PAYOUT_CONTRACTS)
                .flat()
                .filter(Boolean)
                .some(addr => addr.toLowerCase() === from);
            
            if (!isPayoutContract) continue;
            
            // Calculate USD value (would need price oracle in production)
            // For now, use raw amount as proxy
            const rawAmount = parseFloat(ethers.formatUnits(value, 18));
            
            // Check against threshold
            const chainId = txEvent.network;
            const threshold = THRESHOLDS.ethereum; // Simplified - would map chainId to name
            
            if (rawAmount > threshold) {
                const alertKey = `large-payout:${from}:${to}`;
                
                if (shouldAlert(alertKey)) {
                    findings.push(
                        Finding.fromObject({
                            name: 'Large Payout Detected',
                            description: `Payout of ${rawAmount.toLocaleString()} tokens detected`,
                            alertId: 'TRENCHES-1',
                            severity: FindingSeverity.Medium,
                            type: FindingType.Suspicious,
                            metadata: {
                                from,
                                to,
                                amount: rawAmount.toString(),
                                txHash: txEvent.hash,
                                chainId: chainId.toString(),
                            },
                            addresses: [from, to],
                        })
                    );
                }
            }
        }
        
        // Check for failed transactions from payout contracts
        if (txEvent.logs.length === 0 && txEvent.gasUsed === '21000') {
            // Potential failed payout - would need more context
        }
        
        return findings;
    };
}

export default {
    handleTransaction: provideHandleTransaction(),
};
