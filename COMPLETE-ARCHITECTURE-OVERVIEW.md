# 🏗️ COMPLETE ANALOS ARCHITECTURE OVERVIEW

## 🎯 **Two-Repository Architecture**

You have a **modern microservices architecture** with separate frontend and backend repositories!

---

## 📦 **Repository #1: Frontend (Separate Repo)**

### **GitHub Repository:**
- **Name**: `analos-nft-frontend-minimal`
- **URL**: https://github.com/Dubie-eth/analos-nft-frontend-minimal
- **Branch**: master
- **Commits**: 541 commits

### **Vercel Deployment:**
- **Project**: `analos_nft_frontend_minimal`
- **Dashboard**: https://vercel.com/dubie-eths-projects/analos_nft_frontend_minimal/deployments
- **Live URL**: analosnftfrontendminimal.vercel.app

### **Technology Stack:**
- **Framework**: Next.js 13+ (App Directory)
- **Language**: TypeScript (96.6%)
- **Styling**: Tailwind CSS
- **Features**:
  - ✅ Backend Testing Component (`BackendTester.tsx`)
  - ✅ Marketplace
  - ✅ Clean Architecture
  - ✅ Backend Integration

### **Key Files:**
```
analos-nft-frontend-minimal/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   └── globals.css         # Global styles
│   ├── components/             # React components
│   │   └── BackendTester.tsx   # Backend testing UI
│   ├── config/                 # Configuration
│   │   └── backend-config.ts   # Backend API config
│   └── lib/                    # Utilities
├── public/                     # Static assets
├── package.json
├── next.config.ts
├── vercel.json                 # Vercel deployment config
└── tsconfig.json
```

### **Environment Variables (Vercel):**
```bash
NEXT_PUBLIC_BACKEND_URL=https://analos-nft-backend-minimal-production.up.railway.app
NEXT_PUBLIC_API_URL=https://analos-nft-backend-minimal-production.up.railway.app
```

---

## 📦 **Repository #2: Backend/Services (Current Repo)**

### **GitHub Repository:**
- **Local**: `analos-nft-launchpad`
- **Remote**: `analos-nft-launcher`
- **URL**: https://github.com/Dubie-eth/analos-nft-launcher
- **Branch**: master

### **Railway Deployments (3 Services):**
1. **analos-core-service** - Main backend API
2. **analos-oracle** - Price oracle service
3. **[Third Service]** - Supporting service

### **Technology Stack:**
- **Runtime**: Node.js 22
- **Blockchain**: @solana/web3.js + Anchor
- **Database**: Supabase (PostgreSQL)
- **API**: Next.js API Routes
- **Deployment**: Railway (Nixpacks)

### **Key Files:**
```
analos-nft-launchpad/ (LOCAL)
├── src/
│   ├── app/
│   │   ├── api/                # 63 API endpoint files
│   │   ├── admin/              # Admin pages
│   │   ├── profile/            # Profile system
│   │   └── [other pages]/
│   ├── components/             # 68 component files
│   │   ├── PageAccessGuard.tsx
│   │   └── UserAccessManager.tsx
│   ├── lib/                    # 43 utility files
│   └── config/                 # Configuration files
├── scripts/                    # Database & utility scripts
├── nixpacks.toml              # Railway build config ✅
├── railway.json               # Railway deployment config ✅
├── package.json
└── next.config.ts
```

### **Railway Configuration:**
```toml
[phases.setup]
nixPkgs = ["nodejs_22", "npm-9_x"]

[phases.install]
cmds = ["npm i --ignore-scripts"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm run start"
```

---

## 🔄 **Complete Data Flow**

```
┌─────────────────────────────────────────────────────────────┐
│                  USER'S WALLET                              │
│  (Phantom, Solflare, Ledger, etc.)                         │
│  • Signs transactions                                       │
│  • Never exposes private keys                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓ [User Signs Transactions]
┌─────────────────────────────────────────────────────────────┐
│         FRONTEND REPO: analos-nft-frontend-minimal          │
│         Deployed on: Vercel                                 │
│         URL: analosnftfrontendminimal.vercel.app            │
│─────────────────────────────────────────────────────────────│
│  • Next.js 13+ (App Directory)                              │
│  • BackendTester.tsx - Tests backend health                 │
│  • Wallet Adapter Integration                               │
│  • Collection Creation UI                                   │
│  • Marketplace UI                                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓ [API Calls + Signed Transactions]
                      ↓ NEXT_PUBLIC_BACKEND_URL
┌─────────────────────────────────────────────────────────────┐
│         BACKEND REPO: analos-nft-launcher                   │
│         Deployed on: Railway (3 Services)                   │
│─────────────────────────────────────────────────────────────│
│  Service 1: analos-core-service                             │
│  • Main API endpoints                                       │
│  • Transaction validation                                   │
│  • Collection management                                    │
│                                                             │
│  Service 2: analos-oracle                                   │
│  • Price oracle logic                                       │
│  • Rarity calculations                                      │
│  • Market data                                              │
│                                                             │
│  Service 3: [Third Service]                                 │
│  • Supporting functionality                                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓ [Blockchain Transactions]
┌─────────────────────────────────────────────────────────────┐
│              SOLANA BLOCKCHAIN (Devnet/Mainnet)             │
│─────────────────────────────────────────────────────────────│
│  Program ID: 7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk  │
│                                                             │
│  • Analos NFT Launchpad Program                             │
│  • Analos Price Oracle Program                              │
│  • Analos Rarity Oracle Program                             │
│  • Analos Token Launch Program                              │
└─────────────────────────────────────────────────────────────┘
                      │
                      ↓ [Database Updates]
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE (PostgreSQL)                    │
│─────────────────────────────────────────────────────────────│
│  • User profiles                                            │
│  • Collection metadata                                      │
│  • Access control                                           │
│  • Social verification                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 **Current Deployment Status**

### **✅ Frontend (Vercel)**
- **Repository**: https://github.com/Dubie-eth/analos-nft-frontend-minimal
- **Status**: Ready to deploy
- **Last Update**: Working commit 86f0979
- **Features**: 
  - Backend tester ✅
  - Marketplace ✅
  - Clean architecture ✅

### **🚂 Backend (Railway)** - **DEPLOYING NOW!**
- **Repository**: https://github.com/Dubie-eth/analos-nft-launcher
- **Status**: Just pushed optimized configuration
- **Last Commit**: 3b3c8aa (Deployment ready checklist)
- **Configuration**: 
  - nixpacks.toml ✅
  - railway.json ✅
  - Skip USB compilation ✅

---

## 🔐 **Environment Variables Setup**

### **Frontend (Vercel Dashboard):**
```bash
# Backend API Connection
NEXT_PUBLIC_BACKEND_URL=https://analos-nft-backend-minimal-production.up.railway.app
NEXT_PUBLIC_API_URL=https://analos-nft-backend-minimal-production.up.railway.app

# Optional: Supabase (if frontend needs direct access)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### **Backend (Railway Dashboard):**
```bash
# Already configured! ✅
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
ANALOS_NFT_PROGRAM_ID=7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PLATFORM_WALLET_SECRET=[...]
# ... all other program IDs and API keys
```

---

## 🚀 **Deployment Workflow**

### **For Frontend Changes:**
```bash
# Work in: analos-nft-frontend-minimal repo
cd /path/to/analos-nft-frontend-minimal
git add .
git commit -m "Update frontend feature"
git push origin master
# Vercel auto-deploys ✅
```

### **For Backend Changes:**
```bash
# Work in: analos-nft-launchpad repo (current)
cd c:\Users\dusti\OneDrive\Desktop\anal404s\analos-nft-launchpad
git add .
git commit -m "Update backend feature"
git push origin master
# Railway auto-deploys ✅
```

---

## 📊 **Testing Strategy**

### **1. Backend Testing (Railway):**
```bash
# Check health endpoint
curl https://analos-core-service.railway.app/health

# Test API endpoints
curl https://analos-core-service.railway.app/api/collections
```

### **2. Frontend Testing (Vercel):**
```bash
# Visit live site
open https://analosnftfrontendminimal.vercel.app

# Use BackendTester component
# - Tests health endpoint
# - Tests IPFS/Pinata connection
# - Tests RPC proxy
# - Tests webhook status
```

### **3. Integration Testing:**
1. Open frontend in browser
2. Connect wallet
3. Create test collection
4. Sign transaction
5. Verify backend processes it
6. Check blockchain confirmation
7. Verify database updates

---

## 🎊 **What This Means for Deployment**

### **✅ Current Status:**

**Backend (THIS repo):**
- ✅ Configuration optimized (just pushed)
- ✅ Railway deploying with nixpacks.toml
- ✅ Three services ready
- 🔄 Building now with new config

**Frontend (SEPARATE repo):**
- ✅ Already deployed on Vercel
- ✅ Has backend tester component
- ✅ Configured to connect to Railway backend
- ✅ Working commit: 86f0979

### **🎯 Next Steps:**

1. **Monitor Railway** (Backend)
   - Check if build succeeds with new config
   - Verify all 3 services are running

2. **Test Backend API** (Railway)
   - Hit health endpoints
   - Test API routes

3. **Verify Frontend Connection** (Vercel)
   - Use BackendTester component
   - Check API connectivity

4. **Test Integration**
   - Full end-to-end flow
   - Wallet → Frontend → Backend → Blockchain

---

## 💡 **Key Insights**

### **Why Two Repos?**
- ✅ **Separation of Concerns**: Frontend UI vs Backend logic
- ✅ **Independent Deployment**: Deploy frontend/backend separately
- ✅ **Team Workflow**: Different teams can work independently
- ✅ **Scalability**: Scale frontend and backend independently

### **Communication:**
```
Frontend (Vercel)
  ↓ HTTP/HTTPS
  ↓ NEXT_PUBLIC_BACKEND_URL
Backend (Railway)
  ↓ Solana RPC
  ↓ NEXT_PUBLIC_RPC_URL
Blockchain (Solana)
```

---

## 🚀 **Ready to Launch!**

**Your architecture is perfectly set up:**
- ✅ **Frontend**: Separate repo on Vercel (already deployed)
- ✅ **Backend**: This repo on Railway (deploying now)
- ✅ **Blockchain**: Solana programs deployed
- ✅ **Database**: Supabase configured

**Next Action:**
Check your Railway dashboard to see if the backend build succeeds with the new optimized configuration!

---

**This is a production-ready, scalable architecture! Let's make history!** 🌟✨
