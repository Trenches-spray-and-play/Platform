#!/bin/bash

# PostgreSQL Setup Script for Trenches
# This script helps you set up PostgreSQL for development

echo "🚀 Trenches PostgreSQL Setup"
echo "=============================="
echo ""

# Check for Homebrew
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew not found"
    echo ""
    echo "Installing Homebrew (required for PostgreSQL)..."
    echo "Run this command in your terminal:"
    echo '  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
    echo ""
    echo "After installing Homebrew, run this script again."
    exit 1
fi

echo "✅ Homebrew found"
echo ""

# Check if PostgreSQL is already installed
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL is already installed"
    PSQL_VERSION=$(psql --version | head -n1)
    echo "   Version: $PSQL_VERSION"
    echo ""
else
    echo "📦 Installing PostgreSQL..."
    brew install postgresql@15
    echo ""
fi

# Check if PostgreSQL service is running
if brew services list | grep -q "postgresql@15.*started"; then
    echo "✅ PostgreSQL service is running"
elif brew services list | grep -q "postgresql.*started"; then
    echo "✅ PostgreSQL service is running"
else
    echo "🔄 Starting PostgreSQL service..."
    brew services start postgresql@15 || brew services start postgresql
    sleep 2
    echo "✅ PostgreSQL service started"
fi

echo ""

# Check if database exists
if psql -lqt | cut -d \| -f 1 | grep -qw trenches; then
    echo "✅ Database 'trenches' already exists"
else
    echo "📝 Creating database 'trenches'..."
    createdb trenches
    if [ $? -eq 0 ]; then
        echo "✅ Database 'trenches' created successfully"
    else
        echo "❌ Failed to create database"
        echo ""
        echo "Trying with postgres user..."
        createdb -U postgres trenches || echo "Please create manually: createdb trenches"
    fi
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Your connection string:"
echo '  DATABASE_URL="postgresql://'$(whoami)'@localhost:5432/trenches?schema=public"'
echo ""
echo "Or if you set a password:"
echo '  DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/trenches?schema=public"'
echo ""
echo "Next steps:"
echo "1. Update trenches-web/.env.local with the connection string above"
echo "2. Run: cd trenches-web && npm run test:db"
echo "3. Run: npm run prisma:migrate"
