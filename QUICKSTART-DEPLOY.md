# 🚀 QUICKSTART - Deploy in 10 Minutes

Get your NFT Launchpad live in just 10 minutes!

---

## ⚡ Prerequisites (2 minutes)

- [ ] GitHub account
- [ ] Vercel account (free) - [Sign up](https://vercel.com/signup)
- [ ] Railway account (free) - [Sign up](https://railway.app/)
- [ ] Your Analos admin wallet address

---

## 🚂 Step 1: Deploy Backend (3 minutes)

### Push to GitHub

```bash
cd analos-nft-production
git init
git add .
git commit -m "Initial commit"

# Create new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/analos-nft-launchpad.git
git push -u origin main
```

### Deploy to Railway

1. Go to [railway.app](https://railway.app/) → **New Project**
2. Choose **"Deploy from GitHub repo"**
3. Select your `analos-nft-launchpad` repo
4. **Settings** → **Root Directory** → Set to `backend`
5. **Variables** → Add these:

```bash
NODE_ENV=production
PORT=3001
ANALOS_RPC_URL=https://rpc.analos.io
NFT_LAUNCHPAD_PROGRAM_ID=FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo
ADMIN_PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE
CORS_ORIGIN=*
```

6. **Deploy** → Wait 2-3 minutes
7. **Copy your Railway URL** (e.g., `https://your-app.railway.app`)

✅ Test: Visit `https://your-app.railway.app/api/health`

---

## ▲ Step 2: Deploy Frontend (3 minutes)

### Deploy to Vercel

1. Go to [vercel.com](https://vercel.com/) → **Add New Project**
2. Import your `analos-nft-launchpad` repo
3. **Root Directory** → Set to `frontend`
4. **Environment Variables** → Add these:

```bash
NEXT_PUBLIC_RPC_URL=https://rpc.analos.io
NEXT_PUBLIC_NETWORK=mainnet
NEXT_PUBLIC_NFT_LAUNCHPAD_PROGRAM=FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo
NEXT_PUBLIC_API_URL=https://your-app.railway.app
NEXT_PUBLIC_ADMIN_WALLET_1=YOUR_ADMIN_WALLET_ADDRESS
```

5. **Deploy** → Wait 3-5 minutes
6. **Copy your Vercel URL** (e.g., `https://your-app.vercel.app`)

---

## 🔄 Step 3: Update Backend CORS (1 minute)

1. Go back to Railway → Your Project
2. **Variables** → Edit `CORS_ORIGIN`
3. Change from `*` to: `https://your-app.vercel.app`
4. Save → Backend auto-redeploys

---

## ✅ Step 4: Test Everything (1 minute)

### Test Your Site

1. Visit your Vercel URL
2. Connect wallet (Backpack/Phantom)
3. Go to `/launchpad-demo`
4. Verify Program ID shows: `FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo`
5. Check Explorer link works

### Quick Test Checklist

- [ ] Site loads without errors
- [ ] Wallet connects
- [ ] Program ID visible
- [ ] Explorer link works
- [ ] Navigation works
- [ ] Mobile responsive

---

## 🎉 You're Live!

**Your Live URLs:**
- 🌐 Frontend: `https://your-app.vercel.app`
- 🔧 Backend: `https://your-app.railway.app`
- 📜 Smart Contract: [View on Explorer](https://explorer.analos.io/address/FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo)

---

## 🚀 Next Steps

### Initialize Your Collection

1. Connect your admin wallet
2. Go to `/launchpad-demo`
3. Fill in collection details
4. Click "Initialize Collection"
5. Approve transaction

### Upload Metadata

1. Create placeholder image
2. Upload to IPFS/Pinata
3. Create metadata JSON
4. Use IPFS URL in collection

### Start Minting!

Share your link and let users start minting!

---

## 🐛 Troubleshooting

### Frontend Issues

**Build fails:**
- Check all environment variables are set
- Verify they start with `NEXT_PUBLIC_`

**Can't connect wallet:**
- Check RPC URL: `https://rpc.analos.io`
- Try different wallet (Backpack vs Phantom)

### Backend Issues

**Health check fails:**
- Check Railway logs
- Verify environment variables
- Check RPC URL is accessible

**CORS errors:**
- Update `CORS_ORIGIN` in Railway
- Include your Vercel URL
- Redeploy backend

### Smart Contract Issues

**Program not found:**
- Verify Program ID: `FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo`
- Check network is `mainnet`
- Verify RPC URL

---

## 📚 Full Documentation

- **[Complete Deployment Guide](./DEPLOYMENT.md)** - Detailed steps
- **[README](./README.md)** - Project overview
- **[Integration Guide](./INTEGRATION-GUIDE.md)** - Smart contract details

---

## 💬 Need Help?

- **Vercel Docs:** https://vercel.com/docs
- **Railway Docs:** https://docs.railway.app
- **Analos Explorer:** https://explorer.analos.io

---

## 🎯 Deployment Summary

| Component | Platform | URL | Time |
|-----------|----------|-----|------|
| Backend | Railway | `your-app.railway.app` | 3 min |
| Frontend | Vercel | `your-app.vercel.app` | 3 min |
| Smart Contract | Analos | Explorer link | Already deployed |

**Total Time:** ~10 minutes ⚡

---

**Congratulations! 🎉 Your NFT Launchpad is live!**

Program ID: `FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo`

