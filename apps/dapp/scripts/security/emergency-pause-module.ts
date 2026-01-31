/**
 * Emergency Pause Module for Gnosis Safe
 * 
 * This module allows designated guardians to trigger emergency actions
 * with lower threshold than standard transactions.
 */

import { ethers } from 'ethers';

// Module bytecode (simplified - use official for production)
const PAUSE_MODULE_BYTECODE = '0x...'; // Would include actual compiled bytecode

// Module ABI
const PAUSE_MODULE_ABI = [
    'function pause(uint8 level, string reason) external',
    'function unpause() external',
    'function isGuardian(address) view returns (bool)',
    'function pauseLevel() view returns (uint8)',
    'function pausedAt() view returns (uint256)',
    'event Paused(uint8 level, string reason, address guardian)',
    'event Unpaused(address guardian)',
];

export enum PauseLevel {
    NONE = 0,
    PAYOUTS = 1,
    DEPOSITS = 2,
    FULL = 3,
}

interface PauseConfig {
    guardians: string[];
    pauseThreshold: number;  // Number of guardians to trigger pause
    unPauseThreshold: number; // Number of guardians to trigger unpause
    timelockSeconds: number;  // Delay before unpause can execute
}

/**
 * Deploy Pause Module and enable on Safe
 */
export async function deployPauseModule(
    safeAddress: string,
    config: PauseConfig,
    deployerKey: string,
    rpcUrl: string
): Promise<string> {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const deployer = new ethers.Wallet(deployerKey, provider);

    console.log('Deploying Emergency Pause Module...');
    console.log(`  Safe: ${safeAddress}`);
    console.log(`  Guardians: ${config.guardians.length}`);
    console.log(`  Pause Threshold: ${config.pauseThreshold}`);

    // Deploy module
    const factory = new ethers.ContractFactory(
        PAUSE_MODULE_ABI,
        PAUSE_MODULE_BYTECODE,
        deployer
    );

    const module = await factory.deploy(
        safeAddress,
        config.guardians,
        config.pauseThreshold,
        config.unPauseThreshold,
        config.timelockSeconds
    );

    await module.waitForDeployment();
    const moduleAddress = await module.getAddress();

    console.log(`  Module deployed: ${moduleAddress}`);

    // Enable module on Safe (requires Safe transaction)
    console.log('  ⚠️  Remember to enable module on Safe via multi-sig transaction');

    return moduleAddress;
}

/**
 * Create Safe transaction to enable pause module
 */
export function createEnableModuleTransaction(
    moduleAddress: string
): { to: string; data: string; value: string } {
    // Safe.enableModule(address) selector
    const ENABLE_MODULE_SELECTOR = '0x610b5925';
    
    // Encode module address
    const encodedAddress = ethers.zeroPadValue(moduleAddress, 32).slice(2);
    
    return {
        to: '', // Safe address (filled in by caller)
        data: ENABLE_MODULE_SELECTOR + encodedAddress,
        value: '0',
    };
}

/**
 * Pause configuration recommendations
 */
export const RECOMMENDED_PAUSE_CONFIG: PauseConfig = {
    // Same 5 signers as Safe, but different threshold for speed
    guardians: [
        process.env.SAFE_SIGNER_1 || '',
        process.env.SAFE_SIGNER_2 || '',
        process.env.SAFE_SIGNER_3 || '',
        process.env.SAFE_SIGNER_4 || '',
        process.env.SAFE_SIGNER_5 || '',
    ].filter(Boolean),
    
    // 2-of-5 for pause (faster response)
    pauseThreshold: 2,
    
    // 3-of-5 for unpause (more careful)
    unPauseThreshold: 3,
    
    // 24 hour timelock before unpause executes
    timelockSeconds: 24 * 60 * 60,
};
