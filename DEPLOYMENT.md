# 🚀 Deployment Guide - Analos NFT Launchpad

Complete step-by-step guide for deploying your NFT Launchpad to production.

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] GitHub account
- [ ] Vercel account (for frontend)
- [ ] Railway account (for backend)
- [ ] Analos wallet with $LOS for testing
- [ ] IPFS/Pinata account (for metadata)
- [ ] Domain name (optional but recommended)

---

## 🎯 Deployment Overview

1. **Backend** → Deploy to Railway first
2. **Frontend** → Deploy to Vercel (using Railway backend URL)
3. **Test** → Verify everything works
4. **Configure** → Set up custom domain and SSL

---

## 🚂 Part 1: Deploy Backend to Railway

### Step 1: Push to GitHub

```bash
cd analos-nft-production
git init
git add .
git commit -m "Initial commit - Production ready"

# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/analos-nft-launchpad.git
git branch -M main
git push -u origin main
```

### Step 2: Connect to Railway

1. Go to [railway.app](https://railway.app/)
2. Sign in with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose your `analos-nft-launchpad` repository
6. Select the `backend` directory as root

### Step 3: Configure Railway

**Set Root Directory:**
- Go to Settings → Root Directory
- Set to: `backend`

**Configure Build:**
- Build Command: `npm install && npm run build`
- Start Command: `npm run start`

### Step 4: Add Environment Variables

Click **"Variables"** tab and add:

```bash
# Required
NODE_ENV=production
PORT=3001
ANALOS_RPC_URL=https://rpc.analos.io
NFT_LAUNCHPAD_PROGRAM_ID=FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo

# Admin (⚠️ IMPORTANT: Your private key - keep secret!)
ADMIN_PRIVATE_KEY=your_base58_private_key
ADMIN_PUBLIC_KEY=your_admin_public_key

# CORS (add your Vercel domain once frontend is deployed)
CORS_ORIGIN=http://localhost:3000

# IPFS (Optional)
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_key

# Platform Fees
PLATFORM_FEE_PERCENTAGE=2.5
PLATFORM_FEE_RECIPIENT=your_fee_wallet_address
```

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait for deployment to complete (2-5 minutes)
3. Copy your Railway URL (e.g., `https://your-backend.railway.app`)
4. Test the health endpoint: `https://your-backend.railway.app/api/health`

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-09T...",
  "version": "2.0.4",
  "uptime": 123
}
```

✅ **Backend Deployed!** Save your Railway URL for the next step.

---

## ▲ Part 2: Deploy Frontend to Vercel

### Step 1: Prepare Frontend

Update your repository with the Railway backend URL:

```bash
cd analos-nft-production
# No code changes needed, just environment variables
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com/)
2. Sign in with GitHub
3. Click **"Add New..."** → **"Project"**
4. Import your `analos-nft-launchpad` repository
5. Configure project:
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

### Step 3: Add Environment Variables

In Vercel project settings, add these variables:

```bash
# Required - Analos Network
NEXT_PUBLIC_RPC_URL=https://rpc.analos.io
NEXT_PUBLIC_NETWORK=mainnet

# Required - Smart Contract
NEXT_PUBLIC_NFT_LAUNCHPAD_PROGRAM=FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo

# Required - Backend API (use your Railway URL)
NEXT_PUBLIC_API_URL=https://your-backend.railway.app

# Required - Admin Wallet
NEXT_PUBLIC_ADMIN_WALLET_1=your_admin_wallet_address

# Optional - IPFS
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
NEXT_PUBLIC_PINATA_SECRET=your_pinata_secret

# Optional - Analytics
NEXT_PUBLIC_GA_ID=your_google_analytics_id

# Optional - Feature Flags
NEXT_PUBLIC_ENABLE_BONDING_CURVE=true
NEXT_PUBLIC_ENABLE_MARKETPLACE=true
```

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for build to complete (3-7 minutes)
3. Your site will be live at: `https://your-project.vercel.app`

### Step 5: Update Backend CORS

Go back to Railway → Variables and update:

```bash
CORS_ORIGIN=https://your-project.vercel.app,https://www.yourdomain.com
```

Redeploy the backend for changes to take effect.

✅ **Frontend Deployed!** Your app is now live!

---

## 🧪 Part 3: Test Your Deployment

### Test Frontend

1. Visit your Vercel URL
2. Check that the page loads
3. Connect your wallet (Backpack/Phantom)
4. Navigate to `/launchpad-demo`
5. Try viewing collection info (read-only test)

### Test Backend

```bash
# Health check
curl https://your-backend.railway.app/api/health

# Should return:
# {"status":"healthy","timestamp":"...","version":"2.0.4"}
```

### Test Smart Contract Integration

1. Go to `/launchpad-demo` on your live site
2. Connect wallet
3. View the deployed contract info
4. Check Explorer link works
5. Verify Program ID matches

### Test Features

- [ ] Wallet connection works
- [ ] Program ID displays correctly
- [ ] Explorer links open
- [ ] Collection info loads (if initialized)
- [ ] Admin controls visible (if admin wallet)
- [ ] Navigation works
- [ ] Mobile responsive
- [ ] No console errors

---

## 🌐 Part 4: Custom Domain (Optional)

### Add Domain to Vercel

1. Go to Project Settings → Domains
2. Click **"Add Domain"**
3. Enter your domain (e.g., `nft.yourdomain.com`)
4. Follow DNS instructions
5. Wait for SSL certificate (automatic)

### Add Domain to Backend (Optional)

Railway provides custom domains too:

1. Go to Settings → Domains
2. Click **"Add Domain"**
3. Follow instructions

---

## 🔐 Part 5: Security Configuration

### Vercel Security Headers

Already configured in `vercel.json`:
- ✅ X-Content-Type-Options
- ✅ X-Frame-Options
- ✅ X-XSS-Protection
- ✅ Referrer-Policy

### Railway Security

1. Enable **"Private Networking"** if using Railway database
2. Set up **"Service Variables"** securely
3. Enable **"Health Checks"**
4. Configure **"Deploy Triggers"** for main branch only

### Environment Variables

**⚠️ CRITICAL:**
- **NEVER** commit `.env` files
- **NEVER** expose private keys in frontend
- **ALWAYS** use environment variables
- **ROTATE** keys regularly

---

## 📊 Part 6: Monitoring & Analytics

### Vercel Analytics

1. Enable Vercel Analytics in project settings
2. View real-time traffic and performance

### Railway Metrics

1. View resource usage in Railway dashboard
2. Set up **"Alerts"** for downtime

### Custom Monitoring (Optional)

Add Sentry for error tracking:

```bash
# Frontend
npm install @sentry/nextjs

# Backend
npm install @sentry/node
```

Configure in environment variables:
```bash
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_DSN=your_backend_sentry_dsn
```

---

## 🐛 Troubleshooting

### Build Fails on Vercel

**Error:** Module not found

**Solution:**
```bash
# Make sure all dependencies are in package.json
cd frontend
npm install
# Commit package-lock.json
git add package-lock.json
git commit -m "Update dependencies"
git push
```

**Error:** Environment variable undefined

**Solution:**
- Check environment variables are set in Vercel dashboard
- Ensure they're prefixed with `NEXT_PUBLIC_` for client-side
- Redeploy after adding variables

### Backend Not Responding

**Error:** 500 Internal Server Error

**Solution:**
1. Check Railway logs
2. Verify environment variables
3. Check CORS settings
4. Verify RPC URL is accessible

**Error:** CORS blocked

**Solution:**
- Update `CORS_ORIGIN` in Railway to include your Vercel URL
- Redeploy backend

### Smart Contract Issues

**Error:** Program account not found

**Solution:**
- Verify Program ID is correct: `FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo`
- Check RPC URL: `https://rpc.analos.io`
- Verify network is set to `mainnet`

**Error:** Transaction failed

**Solution:**
- Ensure wallet has enough $LOS for gas
- Check collection is initialized
- Verify you're the collection authority (for admin functions)

---

## 🔄 Part 7: Continuous Deployment

### Automatic Deployments

Both Vercel and Railway support automatic deployments:

**Vercel:**
- Deploys automatically on push to `main` branch
- Preview deployments for pull requests

**Railway:**
- Deploys automatically on push to `main` branch
- Configure in Settings → Deploy Triggers

### Deployment Workflow

```bash
# Make changes locally
git add .
git commit -m "Add feature X"
git push origin main

# Automatic deployment triggered:
# 1. Railway builds backend (2-5 min)
# 2. Vercel builds frontend (3-7 min)
# 3. Both go live automatically
```

### Rollback

**Vercel:**
1. Go to Deployments tab
2. Find previous working deployment
3. Click **"..."** → **"Promote to Production"**

**Railway:**
1. Go to Deployments tab
2. Find previous version
3. Click **"Rollback"**

---

## 📚 Part 8: Post-Deployment Tasks

### Initialize Your First Collection

1. Connect admin wallet
2. Go to `/launchpad-demo`
3. Fill in collection details:
   - Name: "Your Collection Name"
   - Symbol: "YCN"
   - Max Supply: 1000
   - Price: 0.1 SOL
   - Reveal Threshold: 500
4. Click **"Initialize Collection"**
5. Approve transaction
6. Wait for confirmation

### Upload Metadata

1. Create placeholder metadata JSON:
```json
{
  "name": "Mystery Box #{{index}}",
  "description": "Unrevealed NFT - Surprise inside!",
  "image": "https://your-ipfs-url/placeholder.png",
  "attributes": [
    {
      "trait_type": "Status",
      "value": "Unrevealed"
    }
  ]
}
```

2. Upload to Pinata/IPFS
3. Get IPFS CID
4. Use in collection initialization

### Test Minting

1. Create a test collection
2. Mint a few NFTs
3. Verify on Explorer
4. Test reveal mechanism
5. Check metadata updates

### Announce to Community

- Share your deployed URL
- Explain the blind mint mechanic
- Set launch date
- Create hype!

---

## 🎉 Success Checklist

- [ ] Backend deployed to Railway
- [ ] Frontend deployed to Vercel
- [ ] Environment variables configured
- [ ] Custom domain set up (optional)
- [ ] SSL certificate active
- [ ] Health checks passing
- [ ] Smart contract verified
- [ ] Test collection created
- [ ] Metadata uploaded
- [ ] Test mint successful
- [ ] Admin controls working
- [ ] Mobile responsive verified
- [ ] Analytics configured
- [ ] Monitoring set up
- [ ] Community announced

---

## 📞 Support

### Deployment Issues

- **Vercel Docs:** https://vercel.com/docs
- **Railway Docs:** https://docs.railway.app
- **Next.js Docs:** https://nextjs.org/docs

### Smart Contract Issues

- **Analos Explorer:** https://explorer.analos.io
- **Analos Docs:** https://docs.analos.io
- **Program ID:** `FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo`

### Community

- Discord: [Your Discord]
- Twitter: [Your Twitter]
- Email: support@yourdomain.com

---

## 🚀 You're Live!

**Congratulations!** Your NFT Launchpad is now deployed and accessible to the world!

**Next steps:**
1. Monitor initial traffic
2. Collect user feedback
3. Iterate and improve
4. Scale as needed

**Your Live URLs:**
- Frontend: `https://your-project.vercel.app`
- Backend: `https://your-backend.railway.app`
- Smart Contract: `https://explorer.analos.io/address/FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo`

---

Built with ❤️ on Analos • Program ID: `FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo`

