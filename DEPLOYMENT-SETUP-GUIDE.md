# 🚀 Analos NFT Launchpad - Complete Deployment Setup Guide

## ✅ Step 1: Database Setup in Supabase

### 1.1 Access Supabase SQL Editor
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**

### 1.2 Run the Database Setup Script
1. Copy the entire contents of `scripts/safe-database-setup.sql`
2. Paste it into the SQL Editor
3. Click **Run** (or press Ctrl+Enter)
4. Wait for completion (should take 5-10 seconds)
5. You should see: "Success. No rows returned"

### 1.3 Verify Tables Were Created
Run this query to verify:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see these tables:
- `admin_users`
- `feature_flags`
- `free_mint_usage`
- `mint_counter`
- `page_access_config`
- `profile_nfts`
- `user_profiles`
- `whitelist_entries`

---

## ✅ Step 2: Get Supabase Credentials

### 2.1 Get Your Supabase URL
1. In Supabase Dashboard, go to **Settings** → **API**
2. Copy **Project URL** (looks like: `https://xxxxx.supabase.co`)

### 2.2 Get Your API Keys
From the same **Settings** → **API** page:
- Copy **anon/public** key (for `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- Copy **service_role** key (for `SUPABASE_SERVICE_ROLE_KEY`)

⚠️ **IMPORTANT**: Keep the service_role key secret! Never expose it in frontend code.

---

## ✅ Step 3: Configure Railway Environment Variables

### 3.1 Access Railway Project Settings
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your `analos-nft-launchpad` project
3. Click on your service (`analos-core-service`)
4. Click on the **Variables** tab

### 3.2 Add These Environment Variables

Click **New Variable** for each of these:

#### Database Variables (Required)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

#### Blockchain Variables (Required)
```
NEXT_PUBLIC_RPC_URL=https://rpc.analos.io
NEXT_PUBLIC_PROGRAM_ID=7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk
```

#### Optional - IPFS/Pinata (if you're using it)
```
PINATA_API_KEY=your-pinata-api-key
PINATA_API_SECRET=your-pinata-secret
PINATA_JWT=your-pinata-jwt
```

#### Optional - Admin Settings
```
ADMIN_WALLET_ADDRESS=your-admin-wallet-address
```

### 3.3 Apply Changes
1. After adding all variables, Railway will automatically redeploy
2. Wait 2-3 minutes for the deployment to complete

---

## ✅ Step 4: Verify Deployment is Working

### 4.1 Check Health Endpoint
Open in browser:
```
https://analos-core-service-production.up.railway.app/api/health-simple
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-24T...",
  "service": "analos-nft-platform-simple-health"
}
```

### 4.2 Test Database Connection
Open in browser:
```
https://analos-core-service-production.up.railway.app/api/database/status
```

Should return information about your database tables.

### 4.3 Test a User Profile Endpoint
Replace `YOUR_WALLET_ADDRESS` with a Solana wallet address:
```
https://analos-core-service-production.up.railway.app/api/user-profiles/YOUR_WALLET_ADDRESS
```

Should return profile data (or 404 if no profile exists).

---

## ✅ Step 5: Configure Frontend (Vercel)

### 5.1 Access Vercel Project Settings
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your Analos project
3. Go to **Settings** → **Environment Variables**

### 5.2 Add These Environment Variables

#### Backend Connection
```
NEXT_PUBLIC_BACKEND_URL=https://analos-core-service-production.up.railway.app
NEXT_PUBLIC_API_URL=https://analos-core-service-production.up.railway.app
```

#### Database (Same as Railway)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

#### Blockchain
```
NEXT_PUBLIC_RPC_URL=https://rpc.analos.io
NEXT_PUBLIC_PROGRAM_ID=7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk
```

### 5.3 Redeploy Frontend
1. After adding variables, click **Redeploy** or
2. Make a small commit to your GitHub repo to trigger auto-deployment

---

## ✅ Step 6: Test End-to-End Flow

### 6.1 Open Your Frontend
Go to your Vercel URL (e.g., `https://analos-nft-launcher-9cxc.vercel.app`)

### 6.2 Test These Features

1. **Home Page**
   - Should load without errors
   - Check browser console for any errors

2. **Connect Wallet**
   - Click "Connect Wallet"
   - Connect with a Solana wallet (Phantom, Backpack, etc.)

3. **Profile Page**
   - Navigate to `/profile`
   - Should show your wallet address
   - Try creating/editing a profile

4. **Explorer**
   - Navigate to `/explorer`
   - Should show transactions (if any)

5. **Create Collection** (Admin)
   - Navigate to `/create-collection`
   - Test creating a new NFT collection

---

## 🔍 Troubleshooting

### Database Connection Issues
```bash
# Check if Supabase is configured
curl https://analos-core-service-production.up.railway.app/api/database/status
```

### Frontend Not Connecting to Backend
1. Check browser console for CORS errors
2. Verify `NEXT_PUBLIC_BACKEND_URL` is set correctly
3. Test backend health endpoint directly

### Profile Creation Fails
1. Verify database tables exist in Supabase
2. Check Railway logs for errors
3. Verify RLS policies allow inserts

### Railway Logs
To check Railway logs:
1. Go to Railway dashboard
2. Select your service
3. Click **Deployments** tab
4. Click on latest deployment
5. Check logs for errors

---

## 📋 Quick Verification Checklist

- [ ] Supabase database tables created successfully
- [ ] Supabase credentials added to Railway
- [ ] Railway service is healthy (green status)
- [ ] Health endpoint returns `{ "status": "healthy" }`
- [ ] Database status endpoint returns table info
- [ ] Frontend environment variables configured
- [ ] Frontend can connect wallet
- [ ] Frontend can load profile page
- [ ] No console errors in browser

---

## 🎉 Success!

If all steps are complete and tests pass, your Analos NFT Launchpad is fully deployed and operational!

**Live URLs:**
- **Backend (Railway)**: https://analos-core-service-production.up.railway.app
- **Frontend (Vercel)**: https://analos-nft-launcher-9cxc.vercel.app
- **Database**: Supabase (via environment variables)

---

## 🆘 Need Help?

If you encounter issues:
1. Check Railway logs for backend errors
2. Check Vercel logs for frontend errors
3. Check Supabase logs for database errors
4. Check browser console for client-side errors

Common issues and solutions are documented in the troubleshooting section above.

