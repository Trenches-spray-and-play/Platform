#!/bin/bash

# Setup script for Layer 1 environment

echo "🚀 Setting up Trenches Layer 1 environment..."

# Create .env.local from .env.example if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from template..."
    cat > .env.local << 'EOF'
# Database
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
EOF
    echo "✅ Created .env.local"
    echo "⚠️  Please edit .env.local with your actual database and RPC URLs"
else
    echo "✅ .env.local already exists"
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your DATABASE_URL and HYPEREVM_RPC_URL"
echo "2. Run: npm run prisma:migrate"
echo "3. Start dev server: npm run dev"
echo "4. Initialize blockchain: POST /api/blockchain/init"
