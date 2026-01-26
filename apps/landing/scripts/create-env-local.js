#!/usr/bin/env node

/**
 * Create .env.local file from template
 * This script can be run to set up the environment file
 */

const fs = require('fs');
const path = require('path');

const envLocalPath = path.join(__dirname, '..', '.env.local');
const envExamplePath = path.join(__dirname, '..', '.env.example');

const envContent = `# Database
# TODO: Replace with your actual PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/trenches?schema=public"

# Blockchain
# TODO: Replace with your actual HyperEVM RPC endpoint
HYPEREVM_RPC_URL="https://your-hyperevm-rpc-url"
BLT_CONTRACT_ADDRESS="0xFEF20Fd2422a9d47Fe1a8C355A1AE83F04025EDF"

# Payment Window (optional, defaults to 15 minutes)
PAYMENT_WINDOW_MS=900000

# Blockchain Polling Interval in seconds (optional, defaults to 10)
POLLING_INTERVAL=10

# Node Environment
NODE_ENV="development"
`;

if (fs.existsSync(envLocalPath)) {
  console.log('⚠️  .env.local already exists. Skipping creation.');
  console.log('   If you want to recreate it, delete .env.local first.');
} else {
  fs.writeFileSync(envLocalPath, envContent);
  console.log('✅ Created .env.local');
  console.log('⚠️  Please edit .env.local with your actual database and RPC URLs');
}
