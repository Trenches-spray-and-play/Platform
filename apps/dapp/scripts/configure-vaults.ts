#!/usr/bin/env node
/**
 * Vault Configuration Script
 * 
 * Seeds the database with vault addresses for each supported chain.
 * 
 * Usage:
 *   npx ts-node scripts/configure-vaults.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Vault addresses from environment or defaults
const VAULT_ADDRESSES: Record<string, string> = {
    ethereum: process.env.VAULT_ADDRESS_ETHEREUM || '',
    base: process.env.VAULT_ADDRESS_BASE || '',
    arbitrum: process.env.VAULT_ADDRESS_ARBITRUM || '',
    hyperevm: process.env.VAULT_ADDRESS_HYPEREVM || '',
    solana: process.env.VAULT_ADDRESS_SOLANA || '',
};

async function configureVaults(): Promise<void> {
    console.log('\n╔════════════════════════════════════════════════════════════════════╗');
    console.log('║                    VAULT CONFIGURATION                             ║');
    console.log('╠════════════════════════════════════════════════════════════════════╣');

    let configured = 0;
    let skipped = 0;

    for (const [chain, address] of Object.entries(VAULT_ADDRESSES)) {
        if (!address) {
            console.log(`║  ⚠️  ${chain.padEnd(12)} - No address configured, skipping           ║`);
            skipped++;
            continue;
        }

        // Upsert vault address
        await prisma.vaultAddress.upsert({
            where: { chain },
            update: { address },
            create: {
                chain,
                address,
                purpose: 'primary',
            },
        });

        console.log(`║  ✅ ${chain.padEnd(12)} - ${address.slice(0, 20)}...${address.slice(-8)}     ║`);
        configured++;
    }

    console.log('╠════════════════════════════════════════════════════════════════════╣');
    console.log(`║  Summary: ${configured} configured, ${skipped} skipped                              ║`);
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');

    // Show current vault addresses in DB
    const vaults = await prisma.vaultAddress.findMany();
    if (vaults.length > 0) {
        console.log('Current vault addresses in database:');
        for (const vault of vaults) {
            console.log(`  ${vault.chain}: ${vault.address}`);
        }
    }
}

configureVaults()
    .catch((error) => {
        console.error('Error configuring vaults:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
