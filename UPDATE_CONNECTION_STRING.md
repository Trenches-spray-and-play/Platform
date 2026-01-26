# Update Your Connection String

## Your Supabase Connection String

You provided:
```
postgresql://postgres:[YOUR-PASSWORD]@db.nlloqdxjynwvmxwrruhb.supabase.co:5432/postgres
```

## ⚠️ Important: Replace [YOUR-PASSWORD]

You need to replace `[YOUR-PASSWORD]` with your actual Supabase database password.

**Where to find your password:**
- It's the password you set when creating the Supabase project
- If you forgot it, you can reset it in Supabase Settings → Database → Reset database password

## Complete Connection String Format

Once you replace the password, it should look like:
```
postgresql://postgres:your_actual_password@db.nlloqdxjynwvmxwrruhb.supabase.co:5432/postgres
```

## Two Ways to Update

### Option 1: I'll Update It For You

Just tell me your actual password (or the complete connection string with password), and I'll update `.env.local` for you.

### Option 2: Update It Yourself

1. Open `.env.local`:
   ```bash
   cd trenches-web
   nano .env.local
   # or
   code .env.local
   ```

2. Find the line with `DATABASE_URL=`

3. Replace it with:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.nlloqdxjynwvmxwrruhb.supabase.co:5432/postgres"
   ```

4. Save the file

5. Test the connection:
   ```bash
   npm run test:db
   ```

## After Updating

Once you have the complete connection string with your password:

1. ✅ Update `.env.local`
2. ✅ Test connection: `npm run test:db`
3. ✅ Run migration: `npm run prisma:migrate`
4. ✅ Start server: `npm run dev`

---

**Tell me when you've replaced the password, or share the complete connection string, and I'll help you test it!**
