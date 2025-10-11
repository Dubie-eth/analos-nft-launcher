# 🚀 Update Minimal Repo with Enhanced Programs

**Target:** [analos-nft-frontend-minimal](https://github.com/Dubie-eth/analos-nft-frontend-minimal)  
**Deployed:** analosnftfrontendminimal.vercel.app  
**Status:** Auto-deploy enabled ✅

---

## 🎯 **Quick Update Strategy**

Since your minimal repo is already connected to Vercel with auto-deploy, we just need to copy our enhanced features there!

---

## 📋 **Files to Copy**

### **1. Configuration Files**
```
✅ frontend-new/src/config/analos-programs.ts
```

### **2. React Hook**
```
✅ frontend-new/src/hooks/useEnhancedPrograms.tsx
```

### **3. Demo Component**
```
✅ frontend-new/src/app/components/EnhancedProgramsDemo.tsx
```

### **4. New Pages**
```
✅ frontend-new/src/app/otc-marketplace/
✅ frontend-new/src/app/airdrops/
✅ frontend-new/src/app/vesting/
✅ frontend-new/src/app/token-lock/
```

---

## 🚀 **Option A: Manual Copy (5 minutes)**

### **Step 1: Clone Your Minimal Repo**
```bash
git clone https://github.com/Dubie-eth/analos-nft-frontend-minimal.git minimal-repo
cd minimal-repo
```

### **Step 2: Copy Enhanced Files**
```bash
# Copy config
cp ../analos-nft-launchpad/frontend-new/src/config/analos-programs.ts src/config/

# Copy hook
mkdir -p src/hooks
cp ../analos-nft-launchpad/frontend-new/src/hooks/useEnhancedPrograms.tsx src/hooks/

# Copy demo component
mkdir -p src/app/components
cp ../analos-nft-launchpad/frontend-new/src/app/components/EnhancedProgramsDemo.tsx src/app/components/

# Copy new pages
cp -r ../analos-nft-launchpad/frontend-new/src/app/otc-marketplace src/app/
cp -r ../analos-nft-launchpad/frontend-new/src/app/airdrops src/app/
cp -r ../analos-nft-launchpad/frontend-new/src/app/vesting src/app/
cp -r ../analos-nft-launchpad/frontend-new/src/app/token-lock src/app/
```

### **Step 3: Update package.json (if needed)**
Check if you need any additional dependencies:
```bash
npm install @solana/wallet-adapter-react @solana/wallet-adapter-react-ui
```

### **Step 4: Test & Deploy**
```bash
npm run build
git add .
git commit -m "✨ Add 5 enhanced programs integration"
git push origin master
```

**Vercel will auto-deploy!** 🎉

---

## 🚀 **Option B: Direct Push (2 minutes)**

### **Push from Current Repo**
```bash
# Add minimal repo as remote
git remote add minimal https://github.com/Dubie-eth/analos-nft-frontend-minimal.git

# Create a new branch with enhanced features
git checkout -b enhanced-features

# Push to minimal repo
git push minimal enhanced-features:master
```

---

## ✅ **What You'll Get**

After deployment, your minimal site will have:

### **New Pages:**
- `/otc-marketplace` - OTC Trading interface
- `/airdrops` - Airdrop claim page  
- `/vesting` - Vesting dashboard
- `/token-lock` - Token lock manager

### **Enhanced Features:**
- Program ID configuration
- Wallet integration
- Real-time program status checking
- Demo components

### **Existing Features (Still Working):**
- Backend testing
- Marketplace
- Clean architecture
- All existing pages

---

## 🔧 **Environment Variables (Optional)**

If you want to add program IDs as env vars in Vercel:

1. Go to: https://vercel.com/dubie-eths-projects/analos_nft_frontend_minimal/settings/environment-variables
2. Add:
```bash
NEXT_PUBLIC_ANALOS_OTC_ENHANCED=7hnWVgRxu2dNWiNAzNB2jWoubzMcdY6HNysjhLiawXPY
NEXT_PUBLIC_ANALOS_AIRDROP_ENHANCED=J2D1LiSGxj9vTN7vc3CUD1LkrnqanAeAoAhE2nvvyXHC
NEXT_PUBLIC_ANALOS_VESTING_ENHANCED=Ae3hXKsHzYPCPUKLtq2mdYZ3E2oKeKrF63ekceGxpHsY
NEXT_PUBLIC_ANALOS_TOKEN_LOCK_ENHANCED=3WmPLvyFpmQ8yPHh7nLxj6FLSATn2uVeD2ceNpuRKwZH
NEXT_PUBLIC_ANALOS_MONITORING_SYSTEM=7PT1ubRGFWXFCmZTpsa9gtm9GZf8BaYTkSd7gE8VcXdG
```

But they're already in the code config, so this is optional!

---

## 🎉 **Success!**

Once deployed, your enhanced minimal site will be live at:
**analosnftfrontendminimal.vercel.app**

With 4 new pages ready to use! 🚀

---

**Updated:** October 11, 2025  
**Status:** Ready to copy and deploy

