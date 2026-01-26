# Let's Set Up PostgreSQL Together! 🚀

## Step-by-Step Setup

### Option 1: Install Homebrew + PostgreSQL (Recommended for macOS)

#### Step 1: Install Homebrew (if not installed)

Open Terminal and run:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

This will take a few minutes. Follow the prompts.

#### Step 2: Install PostgreSQL

```bash
brew install postgresql@15
```

#### Step 3: Start PostgreSQL

```bash
brew services start postgresql@15
```

#### Step 4: Create Database

```bash
createdb trenches
```

#### Step 5: Get Your Connection String

Run this to see your connection string:

```bash
echo "postgresql://$(whoami)@localhost:5432/trenches?schema=public"
```

#### Step 6: Update .env.local

```bash
cd trenches-web
nano .env.local
```

Replace the DATABASE_URL line with the connection string from Step 5.

---

### Option 2: Use Cloud Database (Easiest - No Installation)

#### Supabase (Free, 2 minutes setup)

1. Go to: https://supabase.com
2. Click "Start your project" → Sign up (free)
3. Click "New Project"
4. Fill in:
   - Name: `trenches`
   - Database Password: (choose a strong password)
   - Region: (choose closest)
5. Wait 2 minutes for setup
6. Go to: Settings → Database
7. Scroll to "Connection string" → Copy "URI"
8. Paste into `trenches-web/.env.local` as `DATABASE_URL`

**Done!** No installation needed.

---

### Option 3: Use Our Setup Script

I've created a script that does everything automatically:

```bash
cd "/Users/mac/Trenches - Spray and Pray"
./scripts/setup-postgres.sh
```

This will:
- Check for Homebrew
- Install PostgreSQL if needed
- Start the service
- Create the database
- Show you the connection string

---

## After Setup: Test Connection

Once you have your DATABASE_URL set:

```bash
cd trenches-web
npm run test:db
```

You should see: ✅ Database connection successful!

---

## Quick Commands Reference

```bash
# Install PostgreSQL
brew install postgresql@15

# Start service
brew services start postgresql@15

# Create database
createdb trenches

# Test connection
cd trenches-web && npm run test:db

# Run migration
npm run prisma:migrate
```

---

## Which Option Should You Choose?

- **Option 1 (Homebrew)**: Best for local development, full control
- **Option 2 (Supabase)**: Easiest, no installation, works anywhere, free tier
- **Option 3 (Script)**: Automated, does everything for you

**My recommendation**: Start with **Option 2 (Supabase)** - it's the fastest and you can always switch to local later.

---

## Need Help?

Tell me which option you want to use and I'll guide you through it step by step!
