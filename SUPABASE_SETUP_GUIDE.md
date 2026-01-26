# Supabase Setup - Step by Step

## Let's Set Up Your Database! 🚀

### Step 1: Create Supabase Account

1. **Go to**: https://supabase.com
2. Click **"Start your project"** (top right)
3. Sign up with:
   - GitHub (easiest)
   - Email
   - Or Google

### Step 2: Create New Project

1. Click **"New Project"** button
2. Fill in the form:
   - **Name**: `trenches` (or any name you like)
   - **Database Password**: 
     - ⚠️ **IMPORTANT**: Choose a strong password and **SAVE IT** somewhere safe!
     - You'll need this for the connection string
   - **Region**: Choose the closest to you
     - US East, US West, EU, etc.
3. Click **"Create new project"**
4. Wait 2-3 minutes for setup to complete

### Step 3: Get Your Connection String

Once your project is ready:

1. In the left sidebar, click **"Settings"** (gear icon)
2. Click **"Database"** in the settings menu
3. Scroll down to **"Connection string"** section
4. Find **"URI"** tab (not "JDBC" or "Golang")
5. Click the **copy button** next to the connection string

It will look like:
```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### Step 4: Update .env.local

I'll help you update the file once you have the connection string!

---

## What to Do Next

1. **Complete Steps 1-3 above** to get your connection string
2. **Come back here** and tell me you have the connection string
3. I'll help you update `.env.local` and test everything!

---

## Quick Checklist

- [ ] Signed up for Supabase
- [ ] Created new project
- [ ] Saved the database password
- [ ] Copied the connection string (URI format)
- [ ] Ready to update .env.local

---

## Need Help?

If you get stuck at any step, let me know and I'll help you through it!
