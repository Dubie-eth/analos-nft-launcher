# 🚀 Update Existing Vercel Deployment

**Project:** analos_nft_frontend_minimal  
**URL:** https://vercel.com/dubie-eths-projects/analos_nft_frontend_minimal

---

## ✅ Quick Update Steps

### **Step 1: Connect to Git (One-time setup)**

1. Go to your Vercel project: https://vercel.com/dubie-eths-projects/analos_nft_frontend_minimal
2. Click **"Settings"** tab
3. Click **"Git"** in the left sidebar
4. Click **"Connect Git Repository"**
5. Select: **"Dubie-eth/analos-nft-launcher"**
6. Branch: **"master"**
7. Root Directory: **"frontend-new"** ⚠️ IMPORTANT!
8. Click **"Connect"**

### **Step 2: Configure Build Settings**

In Settings → General:

```
Framework Preset: Next.js
Root Directory: frontend-new
Build Command: npm run build (auto-detected)
Output Directory: .next (auto-detected)
Install Command: npm install (auto-detected)
Node.js Version: 18.x or 20.x
```

### **Step 3: Trigger Deployment**

Once connected to Git, Vercel will automatically deploy when you push to GitHub!

Since we already pushed all changes, go to:
1. **Deployments** tab
2. Click **"Redeploy"** on the latest deployment

OR just push any small change:
```bash
git commit --allow-empty -m "Trigger Vercel deployment"
git push origin master
```

Vercel will automatically detect the push and deploy! ✨

---

## 🎯 What Will Be Deployed

### **New Pages (Available after deployment):**
```
✅ /otc-marketplace    - OTC Trading interface
✅ /airdrops          - Airdrop claim page
✅ /vesting           - Vesting dashboard
✅ /token-lock        - Token lock manager
```

### **Existing Pages (Still working):**
```
✅ /                  - Home page
✅ /admin            - Admin dashboard
✅ /collections      - Collections page
✅ /marketplace      - Marketplace
✅ /profile          - User profile
... and all other existing pages
```

---

## 🔧 Environment Variables (If needed)

If you want to add program IDs as environment variables:

1. Go to **Settings** → **Environment Variables**
2. Add these (optional):

```bash
NEXT_PUBLIC_ANALOS_OTC_ENHANCED=7hnWVgRxu2dNWiNAzNB2jWoubzMcdY6HNysjhLiawXPY
NEXT_PUBLIC_ANALOS_AIRDROP_ENHANCED=J2D1LiSGxj9vTN7vc3CUD1LkrnqanAeAoAhE2nvvyXHC
NEXT_PUBLIC_ANALOS_VESTING_ENHANCED=Ae3hXKsHzYPCPUKLtq2mdYZ3E2oKeKrF63ekceGxpHsY
NEXT_PUBLIC_ANALOS_TOKEN_LOCK_ENHANCED=3WmPLvyFpmQ8yPHh7nLxj6FLSATn2uVeD2ceNpuRKwZH
NEXT_PUBLIC_ANALOS_RPC_URL=https://rpc.analos.io
```

But these are already in your code config, so they're optional!

---

## 🚨 Troubleshooting

### **If Build Fails:**

#### Issue: "Cannot find module 'next'"
**Fix:** Make sure Root Directory is set to `frontend-new`

#### Issue: "Build command failed"
**Fix:** In Settings → General, set:
- Build Command: `cd frontend-new && npm run build`
- Root Directory: `frontend-new`

#### Issue: "Module not found" errors
**Fix:** Make sure all imports use the correct paths with `@/` alias

---

## ✅ Verification Checklist

After deployment completes:

- [ ] Visit your Vercel domain
- [ ] Check `/otc-marketplace` loads
- [ ] Check `/airdrops` loads
- [ ] Check `/vesting` loads
- [ ] Check `/token-lock` loads
- [ ] Test wallet connection
- [ ] Verify program IDs display correctly

---

## 🎉 Success!

Once deployed, your 4 new pages will be live at:
```
https://your-domain.vercel.app/otc-marketplace
https://your-domain.vercel.app/airdrops
https://your-domain.vercel.app/vesting
https://your-domain.vercel.app/token-lock
```

Share them with your users! 🚀

---

**Updated:** October 11, 2025  
**Status:** Ready to deploy

