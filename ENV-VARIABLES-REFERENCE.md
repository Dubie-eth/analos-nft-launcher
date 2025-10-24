# 🔐 Environment Variables Reference

## Quick Copy-Paste Template

Copy this template and fill in your actual values:

```bash
# ============================================
# SUPABASE DATABASE (Required)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# BLOCKCHAIN (Required)
# ============================================
NEXT_PUBLIC_RPC_URL=https://rpc.analos.io
NEXT_PUBLIC_PROGRAM_ID=7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk

# ============================================
# BACKEND API (Frontend Only)
# ============================================
NEXT_PUBLIC_BACKEND_URL=https://analos-core-service-production.up.railway.app
NEXT_PUBLIC_API_URL=https://analos-core-service-production.up.railway.app

# ============================================
# IPFS/PINATA (Optional)
# ============================================
PINATA_API_KEY=your-api-key
PINATA_API_SECRET=your-api-secret
PINATA_JWT=your-jwt-token

# ============================================
# ADMIN (Optional)
# ============================================
ADMIN_WALLET_ADDRESS=your-admin-wallet-address

# ============================================
# APP CONFIG (Optional)
# ============================================
NEXT_PUBLIC_APP_NAME=Analos NFT Launcher
NODE_ENV=production
```

---

## Where to Get Each Value

### Supabase Variables

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Go to: Supabase Dashboard → Settings → API
   - Copy: Project URL
   - Example: `https://abcdefghijklmnop.supabase.co`

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Go to: Supabase Dashboard → Settings → API
   - Copy: anon public key (under "Project API keys")
   - Safe to expose in frontend

3. **SUPABASE_SERVICE_ROLE_KEY**
   - Go to: Supabase Dashboard → Settings → API
   - Copy: service_role key (under "Project API keys")
   - ⚠️ **KEEP SECRET** - Never expose in frontend!

### Blockchain Variables

4. **NEXT_PUBLIC_RPC_URL**
   - Use: `https://rpc.analos.io` (Analos mainnet)
   - Or: Your custom RPC endpoint

5. **NEXT_PUBLIC_PROGRAM_ID**
   - Current: `7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk`
   - This is your deployed program's public key

### Backend API (Frontend Only)

6. **NEXT_PUBLIC_BACKEND_URL**
   - Railway URL: `https://analos-core-service-production.up.railway.app`
   - Find at: Railway Dashboard → Your Service → Settings

7. **NEXT_PUBLIC_API_URL**
   - Same as NEXT_PUBLIC_BACKEND_URL

### Pinata (Optional - for IPFS uploads)

8. **PINATA_API_KEY**
   - Go to: [Pinata Dashboard](https://app.pinata.cloud)
   - API Keys → New Key
   - Copy: API Key

9. **PINATA_API_SECRET**
   - Same page as API Key
   - Copy: API Secret

10. **PINATA_JWT**
    - Same page as API Key
    - Copy: JWT token

---

## Deployment-Specific Instructions

### For Railway (Backend)

1. Go to Railway Dashboard
2. Select your service
3. Click **Variables** tab
4. Add these variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   NEXT_PUBLIC_RPC_URL
   NEXT_PUBLIC_PROGRAM_ID
   ```

### For Vercel (Frontend)

1. Go to Vercel Dashboard
2. Select your project
3. Settings → Environment Variables
4. Add ALL variables from the template above
5. Make sure to select:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

---

## Security Best Practices

### ✅ Safe to Expose (NEXT_PUBLIC_*)
These can be in frontend code:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_RPC_URL`
- `NEXT_PUBLIC_PROGRAM_ID`
- `NEXT_PUBLIC_BACKEND_URL`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_APP_NAME`

### ⚠️ MUST Keep Secret
These should NEVER be in frontend code:
- `SUPABASE_SERVICE_ROLE_KEY` ⚠️
- `PINATA_API_SECRET` ⚠️
- `PINATA_JWT` ⚠️
- Any private keys or keypairs ⚠️

---

## Testing Your Configuration

After setting environment variables, test with:

```bash
# Test health endpoint
curl https://analos-core-service-production.up.railway.app/api/health-simple

# Should return:
# {"status":"healthy","timestamp":"...","service":"analos-nft-platform-simple-health"}

# Test database status
curl https://analos-core-service-production.up.railway.app/api/database/status

# Should return table information
```

---

## Troubleshooting

### "Database not configured" errors
- ❌ Check if `NEXT_PUBLIC_SUPABASE_URL` is set
- ❌ Check if `SUPABASE_SERVICE_ROLE_KEY` is set
- ❌ Verify values are correct (no typos)
- ❌ Redeploy after adding variables

### "CORS" errors in frontend
- ❌ Check if `NEXT_PUBLIC_BACKEND_URL` is set correctly
- ❌ Make sure URL doesn't have trailing slash
- ❌ Verify Railway service is running

### API returns 500 errors
- ❌ Check Railway logs for detailed errors
- ❌ Verify Supabase credentials are correct
- ❌ Check if database tables exist

---

## Quick Command to Set All Variables (Railway CLI)

If you have Railway CLI installed:

```bash
railway variables set NEXT_PUBLIC_SUPABASE_URL="your-url"
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY="your-key"
railway variables set SUPABASE_SERVICE_ROLE_KEY="your-key"
railway variables set NEXT_PUBLIC_RPC_URL="https://rpc.analos.io"
railway variables set NEXT_PUBLIC_PROGRAM_ID="7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk"
```

---

## Need More Help?

- 📖 Check `DEPLOYMENT-SETUP-GUIDE.md` for full setup instructions
- 🔍 Run `scripts/verify-deployment.sh` to test endpoints
- 📊 Check Railway logs for backend errors
- 🌐 Check Vercel logs for frontend errors

