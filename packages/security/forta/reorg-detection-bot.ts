/**
 * Forta Bot: Reorganization Detection
 * 
 * Monitors for blockchain reorganizations that could affect
 * deposit confirmations and payout validity.
 */

import {
    Finding,
    FindingSeverity,
    FindingType,
    BlockEvent,
    HandleBlock,
    getJsonRpcUrl,
} from 'forta-agent';
import { ethers } from 'ethers';

// Track recent block hashes
const BLOCK_HISTORY_SIZE = 128; // ~25 minutes on Ethereum
const blockHistory: Map<number, { hash: string; timestamp: number }> = new Map();

// Alert cooldowns
const alertCooldowns: Map<string, number> = new Map();
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

function shouldAlert(alertId: string): boolean {
    const lastAlert = alertCooldowns.get(alertId);
    const now = Date.now();
    
    if (!lastAlert || (now - lastAlert) > COOLDOWN_MS) {
        alertCooldowns.set(alertId, now);
        return true;
    }
    return false;
}

export function provideHandleBlock(): HandleBlock {
    return async (blockEvent: BlockEvent) => {
        const findings: Finding[] = [];
        const block = blockEvent.block;
        const blockNumber = block.number;
        const blockHash = block.hash;
        
        // Check if we've seen this block number before with a different hash
        const existing = blockHistory.get(blockNumber);
        
        if (existing && existing.hash !== blockHash) {
            // Reorg detected!
            if (shouldAlert('reorg')) {
                findings.push(
                    Finding.fromObject({
                        name: 'Blockchain Reorganization Detected',
                        description: `Block ${blockNumber} hash changed from ${existing.hash.slice(0, 20)}... to ${blockHash.slice(0, 20)}...`,
                        alertId: 'TRENCHES-REORG-1',
                        severity: FindingSeverity.High,
                        type: FindingType.Suspicious,
                        metadata: {
                            blockNumber: blockNumber.toString(),
                            oldHash: existing.hash,
                            newHash: blockHash,
                            timestamp: new Date().toISOString(),
                        },
                    })
                );
            }
        }
        
        // Update history
        blockHistory.set(blockNumber, {
            hash: blockHash,
            timestamp: Date.now(),
        });
        
        // Clean old entries
        const cutoffBlock = blockNumber - BLOCK_HISTORY_SIZE;
        for (const [num] of blockHistory) {
            if (num < cutoffBlock) {
                blockHistory.delete(num);
            }
        }
        
        // Check for unusual block time gaps (potential consensus issues)
        if (existing) {
            const timeDelta = (Date.now() - existing.timestamp) / 1000;
            
            // If same block number seen again after significant delay
            if (timeDelta > 60 && shouldAlert('late-block')) {
                findings.push(
                    Finding.fromObject({
                        name: 'Late Block Reception',
                        description: `Block ${blockNumber} received ${timeDelta.toFixed(0)}s after first seen`,
                        alertId: 'TRENCHES-REORG-2',
                        severity: FindingSeverity.Low,
                        type: FindingType.Info,
                        metadata: {
                            blockNumber: blockNumber.toString(),
                            delaySeconds: timeDelta.toString(),
                        },
                    })
                );
            }
        }
        
        return findings;
    };
}

export default {
    handleBlock: provideHandleBlock(),
};
