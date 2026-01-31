/**
 * Gnosis Safe Deployment & Migration Script
 * 
 * Phase 1: Deploy Safe Core Contracts
 * Phase 2: Configure Treasury Roles
 * Phase 3: Migrate Funds
 */

import { ethers } from 'ethers';
import Safe, { EthersAdapter } from '@safe-global/protocol-kit';
import SafeApiKit from '@safe-global/api-kit';

// Configuration
const CONFIG = {
    // Signers (replace with actual addresses)
    signers: [
        process.env.SAFE_SIGNER_1 || '',  // CTO
        process.env.SAFE_SIGNER_2 || '',  // Lead Dev
        process.env.SAFE_SIGNER_3 || '',  // Security Engineer
        process.env.SAFE_SIGNER_4 || '',  // Dev 1
        process.env.SAFE_SIGNER_5 || '',  // External/Backup
    ].filter(Boolean),
    
    threshold: 3,  // 3-of-5
    
    // Chain configurations
    chains: {
        hyperevm: {
            chainId: 999,
            rpcUrl: process.env.HYPEREVM_RPC_URL,
            safeTxService: null, // Self-hosted or manual
        },
        ethereum: {
            chainId: 1,
            rpcUrl: process.env.ETHEREUM_RPC_URL,
            safeTxService: 'https://safe-transaction-mainnet.safe.global',
        },
        base: {
            chainId: 8453,
            rpcUrl: process.env.BASE_RPC_URL,
            safeTxService: 'https://safe-transaction-base.safe.global',
        },
    }
};

/**
 * Deploy a new Gnosis Safe on specified chain
 */
export async function deploySafe(
    chainName: keyof typeof CONFIG.chains,
    deployerPrivateKey: string
): Promise<{ safeAddress: string; txHash: string }> {
    const chain = CONFIG.chains[chainName];
    if (!chain) throw new Error(`Unknown chain: ${chainName}`);

    console.log(`\n🚀 Deploying Safe on ${chainName}...`);
    console.log(`   Signers: ${CONFIG.signers.length}`);
    console.log(`   Threshold: ${CONFIG.threshold}`);

    // Setup provider and signer
    const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
    const deployer = new ethers.Wallet(deployerPrivateKey, provider);
    
    console.log(`   Deployer: ${deployer.address}`);

    // Create EthersAdapter
    const ethAdapter = new EthersAdapter({
        ethers,
        signerOrProvider: deployer,
    });

    // Deploy Safe
    const safeFactory = await Safe.create({
        ethAdapter,
        predictedSafe: {
            safeAccountConfig: {
                owners: CONFIG.signers,
                threshold: CONFIG.threshold,
            },
        },
    });

    // Get deployment transaction
    const deploymentTx = await safeFactory.createSafeDeploymentTransaction();
    
    // Send deployment
    const tx = await deployer.sendTransaction({
        to: deploymentTx.to,
        value: deploymentTx.value,
        data: deploymentTx.data,
    });

    console.log(`   Deployment tx: ${tx.hash}`);
    const receipt = await tx.wait();
    
    // Get deployed Safe address
    const safeAddress = await safeFactory.getAddress();
    
    console.log(`   ✅ Safe deployed: ${safeAddress}`);
    
    return { safeAddress, txHash: tx.hash };
}

/**
 * Create a Safe transaction (requires multi-sig)
 */
export async function createSafeTransaction(
    safeAddress: string,
    chainName: keyof typeof CONFIG.chains,
    signerPrivateKey: string,
    transactions: Array<{
        to: string;
        value: string;
        data: string;
    }>
) {
    const chain = CONFIG.chains[chainName];
    const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
    const signer = new ethers.Wallet(signerPrivateKey, provider);

    const ethAdapter = new EthersAdapter({
        ethers,
        signerOrProvider: signer,
    });

    const safe = await Safe.create({
        ethAdapter,
        safeAddress,
    });

    // Create transaction
    const safeTransaction = await safe.createTransaction({
        transactions: transactions.map(tx => ({
            to: tx.to,
            value: tx.value,
            data: tx.data,
        })),
    });

    // Sign transaction
    const signedTx = await safe.signTransaction(safeTransaction);
    
    console.log(`Transaction created and signed`);
    console.log(`Safe TX Hash: ${await safe.getTransactionHash(safeTransaction)}`);
    
    return signedTx;
}

/**
 * Execute a transaction (once threshold reached)
 */
export async function executeSafeTransaction(
    safeAddress: string,
    chainName: keyof typeof CONFIG.chains,
    signerPrivateKey: string,
    safeTxHash: string
) {
    const chain = CONFIG.chains[chainName];
    const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
    const signer = new ethers.Wallet(signerPrivateKey, provider);

    const ethAdapter = new EthersAdapter({
        ethers,
        signerOrProvider: signer,
    });

    const safe = await Safe.create({
        ethAdapter,
        safeAddress,
    });

    // Get transaction from service or local
    // ... implementation depends on Safe Tx Service availability
    
    const txResponse = await safe.executeTransaction(safeTxHash as any);
    console.log(`Executed: ${txResponse.hash}`);
    
    return txResponse;
}

/**
 * Fund migration: Transfer from old treasury to Safe
 */
export async function migrateFunds(
    chainName: keyof typeof CONFIG.chains,
    oldTreasuryKey: string,
    newSafeAddress: string,
    tokens: Array<{ address: string; symbol: string }>
) {
    const chain = CONFIG.chains[chainName];
    const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
    const oldTreasury = new ethers.Wallet(oldTreasuryKey, provider);

    console.log(`\n💰 Migrating funds on ${chainName}...`);
    console.log(`   From: ${oldTreasury.address}`);
    console.log(`   To: ${newSafeAddress}`);

    const results = [];

    // Transfer native token (ETH/HYPE)
    const nativeBalance = await provider.getBalance(oldTreasury.address);
    const gasReserve = ethers.parseEther('0.01'); // Keep some for gas
    const transferAmount = nativeBalance - gasReserve;

    if (transferAmount > 0) {
        console.log(`   Transferring ${ethers.formatEther(transferAmount)} native tokens...`);
        const tx = await oldTreasury.sendTransaction({
            to: newSafeAddress,
            value: transferAmount,
        });
        await tx.wait();
        results.push({ symbol: 'NATIVE', amount: transferAmount, txHash: tx.hash });
    }

    // Transfer ERC20 tokens
    const ERC20_ABI = [
        'function balanceOf(address) view returns (uint256)',
        'function transfer(address, uint256) returns (bool)',
        'function decimals() view returns (uint8)',
    ];

    for (const token of tokens) {
        const contract = new ethers.Contract(token.address, ERC20_ABI, oldTreasury);
        const balance = await contract.balanceOf(oldTreasury.address);
        
        if (balance > 0) {
            const decimals = await contract.decimals();
            console.log(`   Transferring ${ethers.formatUnits(balance, decimals)} ${token.symbol}...`);
            
            const tx = await contract.transfer(newSafeAddress, balance);
            await tx.wait();
            results.push({ symbol: token.symbol, amount: balance, txHash: tx.hash });
        }
    }

    console.log(`   ✅ Migration complete: ${results.length} transfers`);
    return results;
}

/**
 * Main deployment workflow
 */
export async function main() {
    const deployerKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!deployerKey) {
        throw new Error('DEPLOYER_PRIVATE_KEY required');
    }

    const oldTreasuryKey = process.env.TREASURY_KEY_EVM;
    if (!oldTreasuryKey) {
        throw new Error('TREASURY_KEY_EVM required for migration');
    }

    // Step 1: Deploy Safe on HyperEVM (primary chain)
    const hyperevmSafe = await deploySafe('hyperevm', deployerKey);
    
    // Step 2: Deploy on other chains as needed
    // const ethereumSafe = await deploySafe('ethereum', deployerKey);
    // const baseSafe = await deploySafe('base', deployerKey);

    // Step 3: Migrate funds (after Safe is confirmed working)
    console.log('\n⚠️  Review Safe deployment before migrating funds!');
    console.log(`   HyperEVM Safe: ${hyperevmSafe.safeAddress}`);
    
    // Uncomment after verification:
    // await migrateFunds('hyperevm', oldTreasuryKey, hyperevmSafe.safeAddress, [
    //     { address: process.env.BLT_CONTRACT_ADDRESS!, symbol: 'BLT' },
    //     { address: '0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb', symbol: 'USDT' },
    // ]);
}

// Run if executed directly
if (require.main === module) {
    main().catch(console.error);
}
