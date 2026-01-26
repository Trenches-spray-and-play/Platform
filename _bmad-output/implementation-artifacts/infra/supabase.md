# Supabase Infrastructure Configuration

> **Status**: ACTIVE
> 
> **Purpose**: Infrastructure truth source for Trenches

---

## Supabase Configuration

```env
SUPABASE_URL=https://nlloqdxjynwvmxwrruhb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sbG9xZHhqeW53dm14d3JydWhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODc4NzIsImV4cCI6MjA4MzQ2Mzg3Mn0.WRAgkazIZ3QbnVS42JuojMOjIm6lWV3t8wBQXZExoss
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sbG9xZHhqeW53dm14d3JydWhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzg4Nzg3MiwiZXhwIjoyMDgzNDYzODcyfQ.A7sM_8haim9D7vXXT2ojoOS1B5DriNVF9rjuLQ8cPIU
DATABASE_URL="postgresql://postgres:TboXtraCash1%21%21%3FT@db.nlloqdxjynwvmxwrruhb.supabase.co:5432/postgres"

```

## Network Details

| Field | Value |
|-------|-------|
| Region | |
| Project Name | |
| Environment | |

---

## Usage

These values should be copied to:
- `trenches-web/.env.local` (local development)
- Vercel Environment Variables (production)

> [!CAUTION]
> Never commit `SUPABASE_SERVICE_ROLE_KEY` to version control.
