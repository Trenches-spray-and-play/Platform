#!/usr/bin/env node

/**
 * Test database connection
 * Run: node scripts/test-db-connection.js
 */

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  console.log('🔍 Testing database connection...');
  console.log(`📍 DATABASE_URL: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@') || 'NOT SET'}`);
  console.log('');

  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');

    // Test query
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('✅ Database query successful!');
    console.log(`📊 PostgreSQL version: ${result[0].version}`);

    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    if (tables.length > 0) {
      console.log(`✅ Found ${tables.length} table(s) in database`);
      tables.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
    } else {
      console.log('⚠️  No tables found. Run migrations: npm run prisma:migrate');
    }

    await prisma.$disconnect();
    console.log('');
    console.log('✅ All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error('');
    console.error('Error details:');
    console.error(error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Check DATABASE_URL in .env.local');
    console.error('2. Ensure PostgreSQL is running');
    console.error('3. Verify database exists');
    console.error('4. Check username/password');
    
    await prisma.$disconnect();
    process.exit(1);
  }
}

testConnection();
