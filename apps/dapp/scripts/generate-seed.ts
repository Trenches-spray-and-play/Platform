#!/usr/bin/env node
/**
 * HD Wallet Seed Generator
 * 
 * Generates a secure BIP-39 mnemonic for the deposit address system.
 * 
 * Usage:
 *   npx ts-node scripts/generate-seed.ts
 * 
 * WARNING: Store the generated seed securely!
 * Never commit it to version control or share it.
 */

import { ethers } from 'ethers';

function generateMnemonic(): void {
    // Generate a random 256-bit entropy mnemonic (24 words)
    const wallet = ethers.Wallet.createRandom();
    const mnemonic = wallet.mnemonic;

    if (!mnemonic) {
        console.error('Failed to generate mnemonic');
        process.exit(1);
    }

    console.log('\n╔════════════════════════════════════════════════════════════════════╗');
    console.log('║                    HD WALLET SEED GENERATED                        ║');
    console.log('╠════════════════════════════════════════════════════════════════════╣');
    console.log('║                                                                    ║');
    console.log('║  ⚠️  CRITICAL: STORE THIS SECURELY! NEVER SHARE OR COMMIT!        ║');
    console.log('║                                                                    ║');
    console.log('╠════════════════════════════════════════════════════════════════════╣');
    console.log('║                                                                    ║');

    // Print mnemonic words
    const words = mnemonic.phrase.split(' ');
    console.log('║  MNEMONIC PHRASE (12 words):                                       ║');
    console.log('║                                                                    ║');

    // Print in 3 rows of 4 words
    for (let i = 0; i < words.length; i += 4) {
        const row = words.slice(i, i + 4).map((w, j) => `${i + j + 1}. ${w}`).join('  ');
        console.log(`║    ${row.padEnd(62)}║`);
    }

    console.log('║                                                                    ║');
    console.log('╠════════════════════════════════════════════════════════════════════╣');
    console.log('║                                                                    ║');
    console.log('║  Add to your .env file:                                            ║');
    console.log('║                                                                    ║');
    console.log(`║  HD_MASTER_SEED="${mnemonic.phrase}"`);
    console.log('║                                                                    ║');
    console.log('╠════════════════════════════════════════════════════════════════════╣');
    console.log('║                                                                    ║');
    console.log('║  First derived addresses (for verification):                       ║');
    console.log('║                                                                    ║');

    // Show first few derived addresses
    const hdNode = ethers.HDNodeWallet.fromMnemonic(mnemonic);
    for (let i = 0; i < 3; i++) {
        const derived = hdNode.derivePath(`m/44'/60'/0'/0/${i}`);
        console.log(`║    User ${i}: ${derived.address}    ║`);
    }

    console.log('║                                                                    ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝');
    console.log('\n');
}

generateMnemonic();
