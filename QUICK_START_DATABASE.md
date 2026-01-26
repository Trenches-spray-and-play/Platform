# Quick Start: Database Setup

## Fastest Way (Docker - Recommended)

### 1. Start PostgreSQL

```bash
# From project root
docker-compose up -d

# Or manually:
docker run --name trenches-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=trenches \
  -p 5432:5432 \
  -d postgres:15
```

### 2. Update .env.local

```bash
cd trenches-web
```

Edit `.env.local` and set:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/trenches?schema=public"
```

### 3. Test Connection

```bash
npm run test:db
```

### 4. Run Migration

```bash
npm run prisma:migrate
```

### 5. Verify

```bash
npm run prisma:studio
# Opens browser - you should see empty tables
```

---

## Alternative: Local PostgreSQL (macOS)

```bash
# Install
brew install postgresql@15

# Start
brew services start postgresql@15

# Create database
createdb trenches

# Update .env.local
DATABASE_URL="postgresql://$(whoami)@localhost:5432/trenches?schema=public"
```

---

## Alternative: Cloud (Free Tier)

### Supabase (Recommended)

1. Go to https://supabase.com
2. Sign up → New Project
3. Copy connection string from Settings → Database
4. Paste into `.env.local` as `DATABASE_URL`

---

## Verify Setup

```bash
cd trenches-web
npm run test:db
```

Should see: ✅ Database connection successful!

---

## Next Steps

Once database is connected:

1. ✅ Run migration: `npm run prisma:migrate`
2. ✅ Start server: `npm run dev`
3. ✅ Initialize blockchain: `POST /api/blockchain/init`
