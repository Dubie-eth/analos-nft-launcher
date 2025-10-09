# 🚂 Railway Configuration Guide

## 🔗 Your Railway Project

**URL:** https://railway.com/project/b00441bd-d76f-4ccb-84da-3e320d70306b  
**Environment:** 200b5785-d15c-4a99-905c-31d1e4a9fa07

---

## ⚙️ Required Configuration Steps

### 1. Update Root Directory

1. Go to your Railway project: https://railway.com/project/b00441bd-d76f-4ccb-84da-3e320d70306b
2. Click on your service
3. Go to **Settings** tab
4. Scroll to **Source**
5. Click **Root Directory**
6. Set to: `backend`
7. Click **Save**

### 2. Configure Build Settings

Still in Settings:

**Build:**
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run start`

**Deploy:**
- **Watch Paths:** `/backend/**` (optional - only rebuild when backend changes)

### 3. Configure Environment Variables

1. Go to **Variables** tab
2. Add these variables (click **+ New Variable** for each):

#### Required Variables:

```bash
NODE_ENV=production
PORT=3001
ANALOS_RPC_URL=https://rpc.analos.io
NFT_LAUNCHPAD_PROGRAM_ID=FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo
```

#### Admin Credentials (⚠️ KEEP SECRET!):

```bash
ADMIN_PRIVATE_KEY=your_base58_private_key_here
ADMIN_PUBLIC_KEY=your_admin_public_key_here
```

#### CORS Configuration:

```bash
CORS_ORIGIN=https://analos-nft-launcher-9cxc.vercel.app
```

**Note:** After Vercel is deployed, come back and update `CORS_ORIGIN` with your actual Vercel URL!

#### Optional - IPFS/Storage:

```bash
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_key
```

#### Optional - Platform Fees:

```bash
PLATFORM_FEE_PERCENTAGE=2.5
PLATFORM_FEE_RECIPIENT=your_fee_wallet_address
```

### 4. Configure Health Checks (Optional but Recommended)

1. Settings → **Health Check**
2. Enable health checks
3. **Path:** `/api/health`
4. **Timeout:** 300 seconds
5. Save

---

## 🚀 Deploy

### Option 1: Auto-Deploy (Recommended)

1. Push your code to GitHub (connected in Settings → Source)
2. Railway will automatically detect changes
3. Wait 2-3 minutes for build
4. Check deployment status in dashboard

### Option 2: Manual Deploy

1. Go to your project dashboard
2. Click **"Deploy"** button (top right)
3. Or go to **Deployments** tab → **Deploy Now**

### Option 3: CLI Deploy

```bash
cd analos-nft-production/backend

# Install Railway CLI (if not installed)
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link b00441bd-d76f-4ccb-84da-3e320d70306b

# Deploy
railway up
```

---

## 🧪 Test Your Deployment

### 1. Get Your Railway URL

After deployment:
1. Go to **Settings** tab
2. Look for **Domains** section
3. Your URL will be like: `https://your-service.up.railway.app`
4. **Copy this URL** - you'll need it for Vercel!

### 2. Test Health Endpoint

```bash
curl https://your-service.up.railway.app/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-09T...",
  "version": "2.0.4",
  "uptime": 123
}
```

### 3. Test via Browser

Visit: `https://your-service.up.railway.app/api/health`

Should see JSON response above.

---

## 🔄 Update Vercel with Backend URL

**IMPORTANT:** After Railway deploys, go back to Vercel:

1. Go to Vercel → Environment Variables
2. Add/Update `NEXT_PUBLIC_API_URL` with your Railway URL:
   ```
   NEXT_PUBLIC_API_URL=https://your-service.up.railway.app
   ```
3. Redeploy Vercel frontend

---

## 🔄 Update CORS

After Vercel deploys, update Railway CORS:

1. Railway → Variables tab
2. Update `CORS_ORIGIN` to your Vercel URL:
   ```
   CORS_ORIGIN=https://analos-nft-launcher-9cxc.vercel.app
   ```
3. Railway will auto-redeploy

---

## 📊 Monitor Your Deployment

### View Logs

1. Go to your service dashboard
2. Click **Logs** tab (or **Observability** → **Logs**)
3. View real-time logs
4. Filter by log level

### Check Metrics

1. **Observability** tab
2. View:
   - CPU usage
   - Memory usage
   - Network traffic
   - Request rate

### Deployment History

1. **Deployments** tab
2. See all previous deployments
3. Rollback if needed

---

## 🐛 Troubleshooting

### Build Fails

**Error:** "Cannot find module"

**Fix:**
1. Check `package.json` and `package-lock.json` are in git
2. Make sure root directory is set to `backend`
3. Check all dependencies are listed

**Error:** "Solana SDK path does not exist"

**Fix:**
This shouldn't happen in production. If it does:
1. Check your build is using the production build command
2. The backend doesn't need Solana SDK at build time

### Deployment Hangs

**Fix:**
1. Check logs for errors
2. Verify build command is correct
3. Try clearing build cache (Settings → Clear Build Cache)

### Health Check Fails

**Fix:**
1. Make sure server is listening on `0.0.0.0` not `localhost`
2. Check `PORT` environment variable is set
3. Verify `/api/health` endpoint exists in your code

### CORS Errors

**Fix:**
1. Check `CORS_ORIGIN` includes your Vercel URL
2. No trailing slashes in URLs
3. Include protocol (`https://`)
4. Redeploy after changing variables

---

## 🔐 Security Best Practices

### Protect Your Keys

- ✅ **NEVER** commit `.env` files to git
- ✅ Use Railway's Variables tab for all secrets
- ✅ Rotate keys regularly
- ✅ Use different keys for dev/prod

### Monitor Access

1. Enable Railway logs
2. Monitor for suspicious activity
3. Set up alerts

### Rate Limiting

Consider adding rate limiting in your backend code if you expect high traffic.

---

## 💰 Railway Pricing

**Free Tier:**
- $5 free credit per month
- Pay for usage beyond that

**Monitor Usage:**
1. Go to project dashboard
2. Check **Usage** tab
3. Set up spending limits

---

## 🎉 Success Checklist

After deployment, verify:

- [ ] Backend deployed successfully
- [ ] Railway URL copied
- [ ] Health check passes
- [ ] Logs show no errors
- [ ] Environment variables set correctly
- [ ] CORS configured with Vercel URL
- [ ] Vercel updated with Railway URL
- [ ] Test API calls work

---

## 🔄 Future Updates

To deploy updates:

1. Make changes locally
2. Commit: `git add . && git commit -m "Your message"`
3. Push: `git push origin main`
4. Railway auto-deploys (1-3 minutes)

---

## 📞 Support

- **Railway Docs:** https://docs.railway.app
- **Your Project:** https://railway.com/project/b00441bd-d76f-4ccb-84da-3e320d70306b
- **Community:** https://discord.gg/railway

---

**Ready to configure!** Follow the steps above. 🚀

