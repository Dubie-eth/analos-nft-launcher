# ✅ DEPLOYMENT CHECKLIST

## Step-by-Step Guide to Deploy Your NFT Launchpad

**Status:** ✅ Code pushed to GitHub!  
**GitHub:** https://github.com/Dubie-eth/analos-nft-launcher

---

## 🚂 Part 1: Deploy Backend to Railway (5 minutes)

### Step 1: Configure Railway Root Directory

1. Open Railway: https://railway.com/project/b00441bd-d76f-4ccb-84da-3e320d70306b
2. Click on your service
3. Go to **Settings** tab
4. Find **Root Directory** section
5. Click **Edit** or configure
6. Set to: `backend`
7. Click **Save**

**Why:** This tells Railway where your backend code is located.

---

### Step 2: Add Environment Variables

1. Still in Railway, click **Variables** tab
2. Add each of these variables (click **+ New Variable** for each):

```bash
NODE_ENV=production
PORT=3001
ANALOS_RPC_URL=https://rpc.analos.io
NFT_LAUNCHPAD_PROGRAM_ID=FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo
CORS_ORIGIN=https://analos-nft-launcher-9cxc.vercel.app
```

**⚠️ IMPORTANT - Add your admin key:**
```bash
ADMIN_PRIVATE_KEY=your_actual_private_key_here
ADMIN_PUBLIC_KEY=your_admin_public_key_here
```

**Optional (but recommended):**
```bash
PINATA_API_KEY=your_pinata_key
PINATA_SECRET_API_KEY=your_pinata_secret
```

---

### Step 3: Deploy Backend

1. After saving variables, Railway should auto-deploy
2. Or click **Deploy** button (if available)
3. Wait 2-3 minutes
4. Check **Logs** tab for deployment status

---

### Step 4: Get Your Railway URL

1. Go to **Settings** tab
2. Look for **Domains** section
3. Your URL will look like: `https://analos-nft-launcher-production-XXXX.up.railway.app`
4. **COPY THIS URL** - you need it for Vercel!

---

### Step 5: Test Backend

Open in browser or curl:
```bash
https://your-railway-url.up.railway.app/api/health
```

**Expected Response:**
```json
{"status":"healthy","timestamp":"2025-10-09T...","version":"2.0.4"}
```

✅ **Backend deployed!**

---

## ▲ Part 2: Deploy Frontend to Vercel (5 minutes)

### Step 1: Configure Vercel Root Directory

1. Open Vercel: https://vercel.com/dubie-eths-projects/analos-nft-launcher-9cxc
2. Go to **Settings** tab
3. Click **General** (left sidebar)
4. Find **Root Directory** section
5. Click **Edit**
6. Set to: `frontend`
7. Click **Save**

**Why:** This tells Vercel where your frontend code is located.

---

### Step 2: Add Environment Variables

1. Still in Settings, click **Environment Variables** (left sidebar)
2. Add each variable (click **Add** for each):

**Required Variables:**

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_RPC_URL` | `https://rpc.analos.io` |
| `NEXT_PUBLIC_NETWORK` | `mainnet` |
| `NEXT_PUBLIC_NFT_LAUNCHPAD_PROGRAM` | `FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo` |
| `NEXT_PUBLIC_API_URL` | **YOUR RAILWAY URL FROM STEP 1** |
| `NEXT_PUBLIC_ADMIN_WALLET_1` | **YOUR ADMIN WALLET ADDRESS** |

**For each variable:**
- Click **Add New**
- Enter **Name**
- Enter **Value**
- Select all environments (Production, Preview, Development)
- Click **Save**

---

### Step 3: Deploy Frontend

**Option A: Auto-Deploy (Recommended)**
1. Vercel should detect your GitHub push
2. Check **Deployments** tab
3. Wait 3-5 minutes for build

**Option B: Manual Deploy**
1. Go to **Deployments** tab
2. Click **"..."** on latest deployment
3. Click **Redeploy**
4. Click **Redeploy** to confirm

---

### Step 4: Monitor Deployment

1. Go to **Deployments** tab
2. Watch for "Building" → "Ready"
3. If errors, click deployment to see logs

---

### Step 5: Test Frontend

**Test Homepage:**
```
https://analos-nft-launcher-9cxc.vercel.app
```

**Test NFT Launchpad:**
```
https://analos-nft-launcher-9cxc.vercel.app/launchpad-demo
```

**Check:**
- [ ] Page loads without errors
- [ ] Can connect wallet
- [ ] Program ID shows: `FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo`
- [ ] Explorer link works

✅ **Frontend deployed!**

---

## 🔄 Part 3: Final Configuration

### Update Backend CORS (if needed)

If you get CORS errors:

1. Go back to Railway → Variables
2. Update `CORS_ORIGIN` to your actual Vercel URL
3. Railway will auto-redeploy

---

## 🎉 Final Checklist

- [ ] ✅ Code pushed to GitHub
- [ ] ✅ Railway root directory set to `backend`
- [ ] ✅ Railway environment variables configured
- [ ] ✅ Backend deployed successfully
- [ ] ✅ Railway URL copied
- [ ] ✅ Railway health check passes
- [ ] ✅ Vercel root directory set to `frontend`
- [ ] ✅ Vercel environment variables configured (including Railway URL)
- [ ] ✅ Frontend deployed successfully
- [ ] ✅ Can connect wallet on live site
- [ ] ✅ `/launchpad-demo` page loads
- [ ] ✅ Program ID displays correctly

---

## 🐛 Troubleshooting

### "Root directory not found"

**Fix:**
- Make sure you set root directory correctly
- Railway: `backend`
- Vercel: `frontend`

### "Module not found" errors

**Fix:**
- Clear build cache
- Redeploy with fresh build
- Check `package.json` is in the correct directory

### CORS errors

**Fix:**
- Check `CORS_ORIGIN` in Railway matches your Vercel URL
- No trailing slash in URL
- Include `https://`

### Environment variables not working

**Fix:**
- Make sure they start with `NEXT_PUBLIC_` for Vercel
- Select all environments when adding
- Redeploy after adding new variables

---

## 🎯 Quick Reference

**Your URLs:**
- GitHub: https://github.com/Dubie-eth/analos-nft-launcher
- Railway: https://railway.com/project/b00441bd-d76f-4ccb-84da-3e320d70306b
- Vercel: https://vercel.com/dubie-eths-projects/analos-nft-launcher-9cxc
- Live Site: https://analos-nft-launcher-9cxc.vercel.app
- Launchpad Demo: https://analos-nft-launcher-9cxc.vercel.app/launchpad-demo

**Smart Contract:**
- Program ID: `FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo`
- Network: Analos Mainnet
- Explorer: https://explorer.analos.io/address/FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo

---

## 📞 Need Help?

**Detailed Guides:**
- Railway: See `RAILWAY-CONFIG.md`
- Vercel: See `VERCEL-CONFIG.md`
- Full Deployment: See `DEPLOYMENT.md`

**Support:**
- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs

---

**Ready to deploy!** Follow the checklist above. 🚀

