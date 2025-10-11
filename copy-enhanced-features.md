# 🚀 Copy Enhanced Features to Minimal Repo

## Quick Steps:

### 1. Clone your minimal repo:
```bash
git clone https://github.com/Dubie-eth/analos-nft-frontend-minimal.git
cd analos-nft-frontend-minimal
```

### 2. Copy these files from our current project:

**From:** `analos-nft-launchpad/frontend-new/src/`  
**To:** `analos-nft-frontend-minimal/src/`

#### Copy Config:
```bash
cp ../analos-nft-launchpad/frontend-new/src/config/analos-programs.ts src/config/
```

#### Copy Hook:
```bash
mkdir -p src/hooks
cp ../analos-nft-launchpad/frontend-new/src/hooks/useEnhancedPrograms.tsx src/hooks/
```

#### Copy Demo Component:
```bash
mkdir -p src/app/components
cp ../analos-nft-launchpad/frontend-new/src/app/components/EnhancedProgramsDemo.tsx src/app/components/
```

#### Copy New Pages:
```bash
cp -r ../analos-nft-launchpad/frontend-new/src/app/otc-marketplace src/app/
cp -r ../analos-nft-launchpad/frontend-new/src/app/airdrops src/app/
cp -r ../analos-nft-launchpad/frontend-new/src/app/vesting src/app/
cp -r ../analos-nft-launchpad/frontend-new/src/app/token-lock src/app/
```

### 3. Test & Deploy:
```bash
npm run build
git add .
git commit -m "✨ Add 5 enhanced programs integration"
git push origin master
```

**Vercel will auto-deploy!** 🎉

---

## 🎯 Result:
Your site at `analosnftfrontendminimal.vercel.app` will have 4 new pages:
- `/otc-marketplace`
- `/airdrops` 
- `/vesting`
- `/token-lock`

Plus all existing features still working!
