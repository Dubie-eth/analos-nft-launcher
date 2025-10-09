# ▲ Vercel Configuration Guide

## 🔗 Your Vercel Project

**URL:** https://vercel.com/dubie-eths-projects/analos-nft-launcher-9cxc  
**Live Site:** https://analos-nft-launcher-9cxc.vercel.app

---

## ⚙️ Required Configuration Steps

### 1. Update Root Directory

1. Go to: https://vercel.com/dubie-eths-projects/analos-nft-launcher-9cxc/settings/general
2. Scroll to **Root Directory**
3. Click **Edit**
4. Set to: `frontend`
5. Click **Save**

### 2. Configure Environment Variables

1. Go to: https://vercel.com/dubie-eths-projects/analos-nft-launcher-9cxc/settings/environment-variables
2. Add these variables (click **Add** for each):

#### Required Variables:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_RPC_URL` | `https://rpc.analos.io` | Production, Preview, Development |
| `NEXT_PUBLIC_NETWORK` | `mainnet` | Production, Preview, Development |
| `NEXT_PUBLIC_NFT_LAUNCHPAD_PROGRAM` | `FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo` | Production, Preview, Development |
| `NEXT_PUBLIC_API_URL` | `YOUR_RAILWAY_URL_HERE` | Production |
| `NEXT_PUBLIC_ADMIN_WALLET_1` | `YOUR_ADMIN_WALLET` | Production, Preview, Development |

#### Optional Variables:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_PINATA_API_KEY` | `your_pinata_key` | Production |
| `NEXT_PUBLIC_PINATA_SECRET` | `your_pinata_secret` | Production |
| `NEXT_PUBLIC_ENABLE_BONDING_CURVE` | `true` | Production |
| `NEXT_PUBLIC_ENABLE_MARKETPLACE` | `true` | Production |

### 3. Update Build Settings (if needed)

1. Go to: https://vercel.com/dubie-eths-projects/analos-nft-launcher-9cxc/settings/general
2. Check these settings:

- **Framework Preset:** Next.js (should auto-detect)
- **Build Command:** `npm run build` (default)
- **Output Directory:** `.next` (default)
- **Install Command:** `npm install` (default)
- **Root Directory:** `frontend` ⚠️ IMPORTANT!

---

## 🚀 Deploy

### Option 1: Auto-Deploy (Recommended)

1. Push your code to GitHub
2. Vercel will automatically detect changes
3. Wait 3-5 minutes for build
4. Check deployment status in dashboard

### Option 2: Manual Deploy

1. Go to: https://vercel.com/dubie-eths-projects/analos-nft-launcher-9cxc
2. Click **Deployments** tab
3. Click **"..."** menu → **Redeploy**
4. Select **"Use existing Build Cache"** if you haven't changed dependencies
5. Click **Redeploy**

### Option 3: CLI Deploy

```bash
cd analos-nft-production/frontend

# Install Vercel CLI (if not installed)
npm install -g vercel

# Login
vercel login

# Link to your project
vercel link --project analos-nft-launcher-9cxc

# Deploy to production
vercel --prod
```

---

## 🧪 Test Your Deployment

### 1. Check Build Status

1. Go to: https://vercel.com/dubie-eths-projects/analos-nft-launcher-9cxc
2. Click **Deployments** tab
3. Wait for "Building" → "Ready"

### 2. Test Live Site

Visit: https://analos-nft-launcher-9cxc.vercel.app

**Check:**
- [ ] Homepage loads
- [ ] No 404 errors
- [ ] Wallet connect button visible
- [ ] Navigation works

### 3. Test NFT Launchpad

Visit: https://analos-nft-launcher-9cxc.vercel.app/launchpad-demo

**Check:**
- [ ] Page loads without errors
- [ ] Program ID displays: `FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo`
- [ ] Explorer link works
- [ ] Can connect wallet

### 4. Test API Connection

Open browser console on your site and check for:
- No CORS errors
- API calls succeed (if backend is deployed)

---

## 🐛 Troubleshooting

### Build Fails

**Error:** "Module not found"

**Fix:**
1. Check `package.json` and `package-lock.json` are committed
2. Clear build cache: Deployments → Redeploy → Uncheck "Use existing Build Cache"
3. Check all dependencies are listed in `package.json`

**Error:** "Root directory not found"

**Fix:**
1. Settings → General → Root Directory → Set to `frontend`
2. Make sure your GitHub repo has the `frontend/` folder

### Environment Variables Not Working

**Fix:**
1. Make sure they're prefixed with `NEXT_PUBLIC_` for client-side use
2. Redeploy after adding new variables
3. Check they're set for "Production" environment

### 404 on Some Pages

**Fix:**
1. Make sure you're using App Router (which you are)
2. Check file paths are correct
3. Clear build cache and redeploy

### CORS Errors

**Fix:**
1. Make sure backend `CORS_ORIGIN` includes your Vercel URL
2. Check `NEXT_PUBLIC_API_URL` is set correctly
3. Verify backend is deployed and accessible

---

## 📊 Monitor Your Deployment

### View Logs

1. Go to your project dashboard
2. Click **Logs** tab
3. Select deployment
4. View real-time logs

### Check Analytics

1. Go to **Analytics** tab
2. View traffic and performance

### Speed Insights

1. Go to **Speed Insights** tab
2. Check Core Web Vitals

---

## 🎉 Success Checklist

After deployment, verify:

- [ ] Site is live at: https://analos-nft-launcher-9cxc.vercel.app
- [ ] Homepage loads correctly
- [ ] NFT Launchpad demo works: `/launchpad-demo`
- [ ] Wallet connection works
- [ ] Program ID displays correctly
- [ ] Explorer links work
- [ ] No console errors
- [ ] Mobile responsive
- [ ] SSL certificate active (https)

---

## 🔄 Future Updates

To deploy updates:

1. Make changes locally
2. Commit: `git add . && git commit -m "Your message"`
3. Push: `git push origin main`
4. Vercel auto-deploys (2-5 minutes)

---

## 📞 Support

- **Vercel Docs:** https://vercel.com/docs
- **Your Project:** https://vercel.com/dubie-eths-projects/analos-nft-launcher-9cxc
- **Live Site:** https://analos-nft-launcher-9cxc.vercel.app

---

**Ready to configure!** Follow the steps above. 🚀

