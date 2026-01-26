# PostgreSQL Setup Guide

> **Purpose**: Get your PostgreSQL connection string for Layer 1

---

## Option 1: Local PostgreSQL Installation

### macOS (using Homebrew)

```bash
# Install PostgreSQL
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Create database
createdb trenches

# Test connection
psql -d trenches -c "SELECT version();"
```

**Connection String:**
```env
DATABASE_URL="postgresql://$(whoami)@localhost:5432/trenches?schema=public"
```

Or if you set a password:
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/trenches?schema=public"
```

### Linux (Ubuntu/Debian)

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Switch to postgres user and create database
sudo -u postgres psql
```

In PostgreSQL prompt:
```sql
CREATE DATABASE trenches;
CREATE USER trenches_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE trenches TO trenches_user;
\q
```

**Connection String:**
```env
DATABASE_URL="postgresql://trenches_user:your_password@localhost:5432/trenches?schema=public"
```

### Windows

1. Download from: https://www.postgresql.org/download/windows/
2. Install using the installer
3. During installation, set a password for the `postgres` user
4. Open "SQL Shell (psql)" or "pgAdmin"

Create database:
```sql
CREATE DATABASE trenches;
```

**Connection String:**
```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/trenches?schema=public"
```

---

## Option 2: Docker (Easiest - Recommended)

### Quick Start

```bash
# Run PostgreSQL in Docker
docker run --name trenches-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=trenches \
  -p 5432:5432 \
  -d postgres:15

# Verify it's running
docker ps
```

**Connection String:**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/trenches?schema=public"
```

### Docker Compose (Better for Development)

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: trenches-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: trenches
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Start it:
```bash
docker-compose up -d
```

**Connection String:**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/trenches?schema=public"
```

---

## Option 3: Cloud Databases (Production Ready)

### Supabase (Free Tier Available)

1. Go to https://supabase.com
2. Sign up / Log in
3. Create new project
4. Go to Settings → Database
5. Copy "Connection string" → "URI"

**Connection String Format:**
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

### Neon (Serverless PostgreSQL)

1. Go to https://neon.tech
2. Sign up / Log in
3. Create new project
4. Copy connection string from dashboard

**Connection String Format:**
```env
DATABASE_URL="postgresql://[user]:[password]@[host]/[database]?sslmode=require"
```

### Railway

1. Go to https://railway.app
2. Sign up / Log in
3. New Project → Add PostgreSQL
4. Copy connection string from Variables tab

### Render

1. Go to https://render.com
2. Sign up / Log in
3. New → PostgreSQL
4. Copy "Internal Database URL" or "External Database URL"

### AWS RDS / Google Cloud SQL / Azure

For production deployments, these are enterprise options with more setup required.

---

## Option 4: SQLite (Development Only - Not Recommended)

**Note**: Prisma supports SQLite, but PostgreSQL is recommended for production.

Change `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

**Connection String:**
```env
DATABASE_URL="file:./dev.db"
```

---

## Testing Your Connection

### Method 1: Using psql

```bash
# Test connection
psql "postgresql://user:password@localhost:5432/trenches"

# If successful, you'll see:
# trenches=>
```

### Method 2: Using Prisma

```bash
cd trenches-web

# Test connection
npx prisma db pull

# Or open Prisma Studio
npm run prisma:studio
```

### Method 3: Quick Test Script

Create `test-db.js`:

```javascript
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function test() {
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

test();
```

Run:
```bash
node test-db.js
```

---

## Connection String Format

```
postgresql://[username]:[password]@[host]:[port]/[database]?[parameters]
```

### Components:

- **username**: Database user (default: `postgres` or your system user)
- **password**: User password (empty if no password set)
- **host**: Database host (`localhost` for local, or cloud host)
- **port**: PostgreSQL port (default: `5432`)
- **database**: Database name (`trenches`)
- **parameters**: Optional query params like `schema=public`

### Examples:

**Local (no password):**
```env
DATABASE_URL="postgresql://mac@localhost:5432/trenches?schema=public"
```

**Local (with password):**
```env
DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/trenches?schema=public"
```

**Docker:**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/trenches?schema=public"
```

**Cloud (Supabase):**
```env
DATABASE_URL="postgresql://postgres.xxxxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?schema=public"
```

---

## Quick Setup Commands

### macOS (Homebrew)
```bash
brew install postgresql@15
brew services start postgresql@15
createdb trenches
```

### Docker (Recommended)
```bash
docker run --name trenches-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=trenches \
  -p 5432:5432 \
  -d postgres:15
```

### Verify Connection
```bash
psql "postgresql://postgres:postgres@localhost:5432/trenches" -c "SELECT 1;"
```

---

## Troubleshooting

### "Connection refused"

- PostgreSQL not running: `brew services start postgresql@15` (macOS)
- Wrong port: Check if PostgreSQL is on port 5432
- Firewall blocking: Check firewall settings

### "Database does not exist"

```bash
createdb trenches
```

### "Password authentication failed"

- Check username/password in connection string
- Reset password: `psql -U postgres -c "ALTER USER postgres PASSWORD 'newpassword';"`

### "Permission denied"

- User doesn't have access: `GRANT ALL PRIVILEGES ON DATABASE trenches TO your_user;`

### Docker container not starting

```bash
# Check logs
docker logs trenches-postgres

# Restart container
docker restart trenches-postgres
```

---

## Recommended Setup for Development

**For quick local development:**
```bash
# Use Docker (easiest)
docker run --name trenches-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=trenches \
  -p 5432:5432 \
  -d postgres:15
```

**Connection String:**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/trenches?schema=public"
```

**For production:**
- Use Supabase (free tier) or Neon (serverless)
- Both have generous free tiers
- Easy to scale later

---

## Next Steps

Once you have your connection string:

1. **Update `.env.local`:**
   ```bash
   # Edit the file
   nano trenches-web/.env.local
   # or
   code trenches-web/.env.local
   ```

2. **Replace DATABASE_URL:**
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/trenches?schema=public"
   ```

3. **Test connection:**
   ```bash
   cd trenches-web
   npm run prisma:migrate
   ```

4. **Verify:**
   ```bash
   npm run prisma:studio
   # Opens browser with database GUI
   ```

---

## Security Notes

⚠️ **Never commit `.env.local` to git** (already in `.gitignore`)

✅ **For production:**
- Use environment variables from your hosting platform
- Use connection pooling for better performance
- Enable SSL/TLS for cloud databases
- Rotate passwords regularly
