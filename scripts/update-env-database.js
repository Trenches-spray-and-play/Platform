#!/usr/bin/env node

/**
 * Helper script to update DATABASE_URL in .env.local
 * Usage: node scripts/update-env-database.js "your-connection-string"
 */

const fs = require('fs');
const path = require('path');

const connectionString = process.argv[2];

if (!connectionString) {
  console.log('❌ Please provide a connection string');
  console.log('');
  console.log('Usage:');
  console.log('  node scripts/update-env-database.js "postgresql://..."');
  console.log('');
  process.exit(1);
}

const envPath = path.join(__dirname, '..', 'trenches-web', '.env.local');

if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found');
  console.log('   Run: npm run setup:env');
  process.exit(1);
}

// Read current .env.local
let envContent = fs.readFileSync(envPath, 'utf8');

// Update DATABASE_URL
if (envContent.includes('DATABASE_URL=')) {
  // Replace existing DATABASE_URL
  envContent = envContent.replace(
    /DATABASE_URL=.*/,
    `DATABASE_URL="${connectionString}"`
  );
} else {
  // Add DATABASE_URL if it doesn't exist
  envContent += `\nDATABASE_URL="${connectionString}"\n`;
}

// Write back
fs.writeFileSync(envPath, envContent);

console.log('✅ Updated DATABASE_URL in .env.local');
console.log('');
console.log('Next steps:');
console.log('1. Test connection: cd trenches-web && npm run test:db');
console.log('2. Run migration: npm run prisma:migrate');
