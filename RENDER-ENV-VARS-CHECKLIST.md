# ✅ Render Environment Variables Checklist

## 📋 **Copy These From Vercel:**

Open Vercel → Your Project → Settings → Environment Variables

Then paste into Render during setup.

---

## 🔓 **Public Variables (Safe to expose):**

```bash
NODE_ENV=production
HOSTNAME=0.0.0.0

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

NEXT_PUBLIC_ANALOS_RPC_URL=https://rpc.analos.io
NEXT_PUBLIC_ANALOS_WS_URL=wss://rpc.analos.io

NEXT_PUBLIC_PLATFORM_NAME=Analos NFT Launcher
NEXT_PUBLIC_PLATFORM_DESCRIPTION=Launch your NFT collection on Analos

NEXT_PUBLIC_SECURITY_EMAIL=security@analos.io
NEXT_PUBLIC_WEBSITE_URL=https://analos.io
NEXT_PUBLIC_TWITTER_HANDLE=AnalosIO
NEXT_PUBLIC_TELEGRAM_HANDLE=AnalosOfficial

NEXT_PUBLIC_NFT_LAUNCHPAD_CORE_PROGRAM_ID=H423wLPdU2ut7JBJmq7Y9V6whXVTtHyRY3wvqypwfgfm
```

---

## 🔐 **Secret Variables (Server-side only):**

**⚠️ IMPORTANT:** These should NOT have `NEXT_PUBLIC_` prefix!

```bash
# Supabase Admin
SUPABASE_SERVICE_ROLE_KEY=

# Pinata IPFS
PINATA_API_KEY=
PINATA_SECRET_KEY=
PINATA_JWT=

# Admin Access (JSON array format)
ADMIN_WALLETS=["86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW","89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m"]

# Security
DATABASE_ENCRYPTION_KEY=
```

---

## 🎯 **Optional Variables:**

Only add these if you use the features:

```bash
# Price Oracle (if using)
PRICE_ORACLE_PROGRAM_ID=
PRICE_ORACLE_AUTHORITY_SECRET_KEY=
PRICE_ORACLE_COOLDOWN=
PRICE_ORACLE_UPDATE_THRESHOLD=
PRICE_ORACLE_CHECK_INTERVAL=
PRICE_ORACLE_AUTOMATION_ENABLED=

# Backend URLs (if using separate backends)
NEXT_PUBLIC_BACKEND_URL=
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_ORACLE_API_URL=
NEXT_PUBLIC_CORE_API_URL=
NEXT_PUBLIC_SECURITY_API_URL=

# Customer Service (if using)
NEXT_PUBLIC_ENABLE_CUSTOMER_SERVICE=
NEXT_PUBLIC_CUSTOMER_SERVICE_ENDPOINT=

# Other Programs (if using)
ANALOS_MONITORING_SYSTEM_PROGRAM_ID=
ANALOS_TOKEN_LOCK_ENHANCED_PROGRAM_ID=
```

---

## 🚀 **Quick Copy Template:**

**For Render's "Bulk Add" Feature:**

```bash
NODE_ENV=production
HOSTNAME=0.0.0.0
NEXT_PUBLIC_SUPABASE_URL=<YOUR_VALUE>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<YOUR_VALUE>
SUPABASE_SERVICE_ROLE_KEY=<YOUR_VALUE>
PINATA_API_KEY=<YOUR_VALUE>
PINATA_SECRET_KEY=<YOUR_VALUE>
PINATA_JWT=<YOUR_VALUE>
ADMIN_WALLETS=["86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW","89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m"]
DATABASE_ENCRYPTION_KEY=<YOUR_VALUE>
NEXT_PUBLIC_ANALOS_RPC_URL=https://rpc.analos.io
NEXT_PUBLIC_NFT_LAUNCHPAD_CORE_PROGRAM_ID=H423wLPdU2ut7JBJmq7Y9V6whXVTtHyRY3wvqypwfgfm
```

Replace `<YOUR_VALUE>` with actual values from Vercel!

---

## 🔍 **How to Copy from Vercel:**

### **Method 1: One-by-one**
1. Vercel → Settings → Environment Variables
2. Find variable → Click "..." → "Show"
3. Copy value
4. Paste into Render

### **Method 2: Vercel CLI (Fastest)**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Pull environment variables
vercel env pull .env.production

# Now you have all vars in .env.production file!
```

Then copy from `.env.production` to Render.

---

## ⚠️ **Security Reminders:**

### **NEVER add these with NEXT_PUBLIC_ prefix:**
- ❌ `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`
- ❌ `NEXT_PUBLIC_PINATA_API_KEY`
- ❌ `NEXT_PUBLIC_DATABASE_ENCRYPTION_KEY`
- ❌ `NEXT_PUBLIC_ADMIN_WALLETS`

### **These are OK to be public:**
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `NEXT_PUBLIC_ANALOS_RPC_URL`
- ✅ `NEXT_PUBLIC_TWITTER_HANDLE`

---

## 🎉 **You're Ready!**

All files created:
- ✅ `render.yaml` - Deployment config
- ✅ `RENDER-SETUP-GUIDE.md` - Detailed instructions
- ✅ `RENDER-QUICK-START.md` - 5-minute version
- ✅ `RENDER-ENV-VARS-CHECKLIST.md` - This file

**Now:** Go to https://render.com and follow the Quick Start guide!

**Time:** ~5-10 minutes to full deployment  
**Cost:** FREE (or $7/mo for always-on)

---

**Your backup infrastructure is ready to deploy!** 🚀✨

