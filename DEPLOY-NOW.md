# 🚀 DEPLOY NOW - Quick Commands

## 📋 Your Deployment Info

**Vercel Project:** https://vercel.com/dubie-eths-projects/analos-nft-launcher-9cxc  
**Railway Project:** https://railway.com/project/b00441bd-d76f-4ccb-84da-3e320d70306b

---

## Step 1: Push to GitHub

### If you already have a GitHub repo for this project:

```bash
cd analos-nft-production

# Connect to your existing repo
git remote add origin https://github.com/YOUR_USERNAME/analos-nft-launcher.git

# Push to main branch
git push -u origin main
```

### If you need a NEW GitHub repo:

1. Go to https://github.com/new
2. Create new repository: `analos-nft-launcher`
3. Don't initialize with README (we have files already)
4. Then run:

```bash
cd analos-nft-production
git remote add origin https://github.com/YOUR_USERNAME/analos-nft-launcher.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Backend to Railway

### Option A: Via Railway Dashboard (Recommended)

1. Go to your Railway project: https://railway.com/project/b00441bd-d76f-4ccb-84da-3e320d70306b
2. Click **Settings** → **Source**
3. Update **Root Directory** to: `backend`
4. Go to **Variables** tab
5. Add/Update these variables:

```bash
NODE_ENV=production
PORT=3001
ANALOS_RPC_URL=https://rpc.analos.io
NFT_LAUNCHPAD_PROGRAM_ID=FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo
ADMIN_PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE
ADMIN_PUBLIC_KEY=YOUR_PUBLIC_KEY_HERE
CORS_ORIGIN=*
PINATA_API_KEY=your_pinata_key
PINATA_SECRET_API_KEY=your_pinata_secret
```

6. Click **Deploy** (or it will auto-deploy on git push)
7. Wait 2-3 minutes
8. Copy your Railway URL

### Option B: Via Railway CLI

```bash
# Install Railway CLI (if not installed)
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link b00441bd-d76f-4ccb-84da-3e320d70306b

# Deploy
cd backend
railway up
```

---

## Step 3: Deploy Frontend to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to your Vercel project: https://vercel.com/dubie-eths-projects/analos-nft-launcher-9cxc
2. Click **Settings** → **Git**
3. Ensure it's connected to your GitHub repo
4. Update **Root Directory** to: `frontend`
5. Go to **Environment Variables**
6. Add/Update these:

```bash
NEXT_PUBLIC_RPC_URL=https://rpc.analos.io
NEXT_PUBLIC_NETWORK=mainnet
NEXT_PUBLIC_NFT_LAUNCHPAD_PROGRAM=FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo
NEXT_PUBLIC_API_URL=YOUR_RAILWAY_URL
NEXT_PUBLIC_ADMIN_WALLET_1=YOUR_ADMIN_WALLET
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_key
NEXT_PUBLIC_PINATA_SECRET=your_pinata_secret
```

7. Click **Deployments** → **Redeploy** (or push to GitHub for auto-deploy)
8. Wait 3-5 minutes

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Login
vercel login

# Link to your project
vercel link

# Deploy
cd frontend
vercel --prod
```

---

## Step 4: Update Backend CORS

1. Go back to Railway → Variables
2. Update `CORS_ORIGIN` with your Vercel URL:

```bash
CORS_ORIGIN=https://analos-nft-launcher-9cxc.vercel.app
```

3. Redeploy backend

---

## Step 5: Test Your Deployment

### Test Backend

```bash
curl https://YOUR_RAILWAY_URL/api/health
```

Should return:
```json
{"status":"healthy","timestamp":"...","version":"2.0.4"}
```

### Test Frontend

1. Visit: https://analos-nft-launcher-9cxc.vercel.app
2. Check homepage loads
3. Go to `/launchpad-demo`
4. Connect wallet
5. Verify Program ID: `FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo`
6. Check Explorer link works

---

## 🎯 Quick Checklist

- [ ] Code pushed to GitHub
- [ ] Railway root directory set to `backend`
- [ ] Railway environment variables configured
- [ ] Backend deployed and health check passes
- [ ] Railway URL copied
- [ ] Vercel root directory set to `frontend`
- [ ] Vercel environment variables configured (including Railway URL)
- [ ] Frontend deployed successfully
- [ ] Backend CORS updated with Vercel URL
- [ ] Test: Visit your Vercel URL
- [ ] Test: Connect wallet works
- [ ] Test: `/launchpad-demo` loads
- [ ] Test: Program ID displays correctly

---

## 🚨 Important Environment Variables

### Backend (Railway) - REQUIRED:

```bash
NODE_ENV=production
PORT=3001
ANALOS_RPC_URL=https://rpc.analos.io
NFT_LAUNCHPAD_PROGRAM_ID=FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo
ADMIN_PRIVATE_KEY=your_private_key  # ⚠️ KEEP SECRET!
CORS_ORIGIN=https://analos-nft-launcher-9cxc.vercel.app
```

### Frontend (Vercel) - REQUIRED:

```bash
NEXT_PUBLIC_RPC_URL=https://rpc.analos.io
NEXT_PUBLIC_NETWORK=mainnet
NEXT_PUBLIC_NFT_LAUNCHPAD_PROGRAM=FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_ADMIN_WALLET_1=your_admin_wallet_address
```

---

## 🐛 Troubleshooting

### "Root directory not set" error

**Railway:**
- Settings → Root Directory → Set to: `backend`

**Vercel:**
- Settings → General → Root Directory → Set to: `frontend`

### Build fails

**Check:**
- Root directory is correct
- All environment variables are set
- GitHub repo has latest code

### CORS errors

**Fix:**
- Update `CORS_ORIGIN` in Railway to your Vercel URL
- Redeploy backend

### "Module not found" errors

**Fix:**
- Make sure `package-lock.json` is committed to git
- Try clearing build cache and redeploying

---

## 🎉 Success!

Once deployed, your URLs will be:

- **Frontend:** https://analos-nft-launcher-9cxc.vercel.app
- **Backend:** https://your-backend.railway.app
- **Launchpad Demo:** https://analos-nft-launcher-9cxc.vercel.app/launchpad-demo

**Smart Contract:** `FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo`

---

## 📞 Need Help?

- **Vercel Docs:** https://vercel.com/docs
- **Railway Docs:** https://docs.railway.app
- **Your Projects:**
  - Vercel: https://vercel.com/dubie-eths-projects/analos-nft-launcher-9cxc
  - Railway: https://railway.com/project/b00441bd-d76f-4ccb-84da-3e320d70306b

---

**Ready to deploy!** Start with Step 1 above. 🚀

