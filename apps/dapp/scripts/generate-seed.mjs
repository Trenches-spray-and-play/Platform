#!/usr/bin/env node
/**
 * HD Wallet Seed Generator
 * 
 * Generates a secure BIP-39 mnemonic for the deposit address system.
 * Shows derived addresses for both EVM (Ethereum, Base, Arbitrum) and Solana.
 * 
 * Usage:
 *   node scripts/generate-seed.mjs
 * 
 * WARNING: Store the generated seed securely!
 * Never commit it to version control or share it.
 */

import { ethers } from 'ethers';
import { Keypair as SolanaKeypair } from '@solana/web3.js';
import { derivePath } from 'ed25519-hd-key';

function generateMnemonic() {
    // Generate a random wallet with mnemonic
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
    console.log('║  This single seed works for ALL chains (EVM + Solana)              ║');
    console.log('║                                                                    ║');
    console.log('╠════════════════════════════════════════════════════════════════════╣');
    console.log('║                                                                    ║');

    // Print mnemonic words
    const words = mnemonic.phrase.split(' ');
    console.log('║  MNEMONIC PHRASE (' + words.length + ' words):');
    console.log('║                                                                    ║');

    // Print in 3 rows of 4 words
    for (let i = 0; i < words.length; i += 4) {
        const row = words.slice(i, i + 4).map((w, j) => `${i + j + 1}. ${w}`).join('  ');
        console.log(`║    ${row}`);
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
    console.log('║  EVM ADDRESSES (Ethereum, Base, Arbitrum, HyperEVM):               ║');
    console.log('║                                                                    ║');

    // Create HD wallet from mnemonic root
    const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic.phrase);

    // Derive EVM addresses using relative paths from the HD node
    for (let i = 0; i < 3; i++) {
        const derived = hdNode.derivePath(`44'/60'/0'/0/${i}`);
        console.log(`║    User ${i}: ${derived.address}`);
    }

    console.log('║                                                                    ║');
    console.log('╠════════════════════════════════════════════════════════════════════╣');
    console.log('║                                                                    ║');
    console.log('║  SOLANA ADDRESSES:                                                 ║');
    console.log('║                                                                    ║');

    // Derive Solana addresses from the same seed
    const solanaSeed = mnemonic.computeSeed();
    const solanaSeedHex = Buffer.from(solanaSeed).toString('hex');

    for (let i = 0; i < 3; i++) {
        const path = `m/44'/501'/${i}'/0'`;
        const derived = derivePath(path, solanaSeedHex);
        const keypair = SolanaKeypair.fromSeed(derived.key);
        console.log(`║    User ${i}: ${keypair.publicKey.toBase58()}`);
    }

    console.log('║                                                                    ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝');
    console.log('\n');
    console.log('✅ This single seed derives unique addresses for ALL supported chains!');
    console.log('\n');
}

generateMnemonic();
