# 📁 Project Structure

Complete overview of your production-ready NFT Launchpad project.

---

## 🏗️ Directory Layout

```
analos-nft-production/
│
├── frontend/                          # Next.js 15 Frontend
│   ├── src/
│   │   ├── app/                       # App Router Pages
│   │   │   ├── page.tsx               # Homepage
│   │   │   ├── layout.tsx             # Root layout
│   │   │   ├── launchpad-demo/        # ✨ NEW: NFT Launchpad Demo
│   │   │   ├── collections/           # Collection browsing
│   │   │   ├── launch-collection/     # Create collections
│   │   │   ├── marketplace/           # Trading interface
│   │   │   ├── admin/                 # Admin panel
│   │   │   ├── mint/[collectionName]/ # Minting page
│   │   │   └── api/                   # API routes
│   │   ├── components/                # React Components
│   │   │   ├── NFTLaunchpadDemo.tsx   # ✨ NEW: Main demo UI
│   │   │   ├── AdminControlPanel.tsx  # Admin dashboard
│   │   │   ├── NFTGenerator.tsx       # Generator tool
│   │   │   ├── BondingCurveInterface.tsx
│   │   │   └── ... (90+ components)
│   │   └── lib/                       # Services & Utilities
│   │       ├── nft-launchpad-config.ts # ✨ NEW: Launchpad config
│   │       ├── nft-launchpad-service.ts # ✨ NEW: Service layer
│   │       ├── analos-web3-wrapper.ts # Analos integration
│   │       ├── blockchain/            # Blockchain services
│   │       ├── security/              # Security utilities
│   │       └── ... (100+ service files)
│   ├── public/                        # Static assets
│   ├── package.json                   # Dependencies
│   ├── next.config.ts                 # Next.js config
│   ├── vercel.json                    # Vercel deployment
│   ├── .env.example                   # Environment template
│   └── tsconfig.json                  # TypeScript config
│
├── backend/                           # Node.js Backend
│   ├── src/
│   │   ├── simple-server.ts           # Main server (production)
│   │   ├── collection-service.ts      # Collection management
│   │   ├── metaplex-nft-service.ts    # Metaplex integration
│   │   ├── blockchain-recovery-service.ts
│   │   ├── nft-tracking-service.ts    # NFT tracking
│   │   ├── webhook-routes.ts          # Webhook handlers
│   │   └── ... (30+ service files)
│   ├── data/                          # Data storage
│   │   ├── collection-stats.json
│   │   ├── minted-nfts.json
│   │   └── user-stats.json
│   ├── package.json                   # Dependencies
│   ├── tsconfig.json                  # TypeScript config
│   ├── railway.json                   # Railway deployment
│   └── .env.example                   # Environment template
│
├── README.md                          # 📖 Project overview
├── DEPLOYMENT.md                      # 🚀 Full deployment guide
├── QUICKSTART-DEPLOY.md               # ⚡ 10-minute deploy
├── INTEGRATION-GUIDE.md               # 🔧 Smart contract details
├── PROJECT-STRUCTURE.md               # 📁 This file
└── .gitignore                         # Git ignore rules
```

---

## ✨ Key New Features

### NFT Launchpad Integration

**Location:** `frontend/src/lib/`

- `nft-launchpad-config.ts` - Configuration and types
- `nft-launchpad-service.ts` - Complete service layer
- `analos-web3-wrapper.ts` - Updated with Program ID

**UI Component:** `frontend/src/app/components/NFTLaunchpadDemo.tsx`

**Page Route:** `frontend/src/app/launchpad-demo/page.tsx`

**Features:**
- Blind mint & reveal system
- On-chain randomness
- Rarity tiers (Legendary, Epic, Rare, Common)
- Admin controls (pause, reveal, withdraw)
- Collection management
- Real-time updates

---

## 🎯 Main Entry Points

### Frontend

**Homepage:** `frontend/src/app/page.tsx`
- Landing page with project overview

**NFT Launchpad Demo:** `frontend/src/app/launchpad-demo/page.tsx`
- Full-featured demo of the new smart contract
- Collection initialization
- Minting interface
- Reveal controls
- Admin panel

**Launch Collection:** `frontend/src/app/launch-collection/page.tsx`
- Create new collections
- Configure parameters
- Deploy to blockchain

**Mint Page:** `frontend/src/app/mint/[collectionName]/page.tsx`
- Dynamic minting interface
- Supports any collection
- Payment processing
- Real-time supply tracking

### Backend

**Main Server:** `backend/src/simple-server.ts`
- Express server
- API endpoints
- CORS configuration
- Health checks

**Key Services:**
- `collection-service.ts` - Collection management
- `metaplex-nft-service.ts` - NFT operations
- `nft-tracking-service.ts` - Tracking and stats
- `blockchain-recovery-service.ts` - Error recovery

---

## 🔧 Configuration Files

### Frontend Config

**next.config.ts**
- TypeScript configuration
- Build settings
- Webpack overrides
- Error handling (ignores build errors for production)

**vercel.json**
- Deployment configuration
- Security headers
- Environment variables
- Routing rules

**tsconfig.json**
- TypeScript compiler options
- Path aliases (`@/lib`, `@/components`, etc.)
- Module resolution

### Backend Config

**tsconfig.json**
- TypeScript compiler settings
- ES module support
- Output directory (`dist/`)

**railway.json**
- Deployment configuration
- Build commands
- Start command
- Health checks

---

## 📦 Dependencies

### Frontend

**Core:**
- `next` 15.5.4 - React framework
- `react` 19.1.0 - UI library
- `react-dom` 19.1.0 - React DOM

**Blockchain:**
- `@solana/web3.js` - Solana SDK
- `@solana/wallet-adapter-react` - Wallet integration
- `@solana/wallet-adapter-backpack` - Backpack wallet
- `@coral-xyz/anchor` - Anchor framework

**Analos Specific:**
- `@analosfork/damm-sdk` - DAMM protocol
- `@analosfork/dynamic-bonding-curve-sdk` - Bonding curves
- `@analos/web3-kit` - Custom Analos utilities

**NFT/Metaplex:**
- `@metaplex-foundation/mpl-token-metadata` - Token metadata
- `@metaplex-foundation/umi` - Metaplex Umi

**UI:**
- `tailwindcss` - Styling
- `lucide-react` - Icons
- `@hello-pangea/dnd` - Drag and drop

### Backend

**Core:**
- `express` - Web server
- `typescript` - Type safety
- `ts-node` - Development

**Blockchain:**
- `@solana/web3.js` - Solana SDK
- `@solana/spl-token` - Token program

**Storage:**
- `arweave` - Arweave integration
- Node IPFS clients (via Pinata)

**Utilities:**
- `cors` - CORS handling
- `helmet` - Security headers
- `morgan` - Request logging
- `multer` - File uploads
- `dotenv` - Environment variables

---

## 🌐 Deployment Configuration

### Frontend → Vercel

**Framework:** Next.js  
**Build Command:** `npm run build`  
**Output Directory:** `.next`  
**Install Command:** `npm install`  
**Dev Command:** `npm run dev`

**Environment Variables Required:**
```bash
NEXT_PUBLIC_RPC_URL=https://rpc.analos.io
NEXT_PUBLIC_NETWORK=mainnet
NEXT_PUBLIC_NFT_LAUNCHPAD_PROGRAM=FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_ADMIN_WALLET_1=your_admin_wallet
```

### Backend → Railway

**Builder:** NIXPACKS  
**Build Command:** `npm install && npm run build`  
**Start Command:** `npm run start`  
**Health Check:** `/api/health`

**Environment Variables Required:**
```bash
NODE_ENV=production
PORT=3001
ANALOS_RPC_URL=https://rpc.analos.io
NFT_LAUNCHPAD_PROGRAM_ID=FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo
ADMIN_PRIVATE_KEY=your_private_key
CORS_ORIGIN=https://your-frontend.vercel.app
```

---

## 🔗 Smart Contract

**Program ID:** `FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo`  
**Network:** Analos Mainnet  
**RPC:** https://rpc.analos.io  
**Explorer:** https://explorer.analos.io/address/FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo

**Features:**
- Initialize collections with custom parameters
- Blind mint placeholder NFTs
- On-chain pseudo-randomness (keccak hash)
- 4-tier rarity system
- Collection-wide and individual reveals
- Admin controls (pause, resume, withdraw, update)
- Secure fund management

---

## 📊 Data Flow

```
User Frontend (Vercel)
    ↓
Wallet Connect (Backpack/Phantom)
    ↓
NFT Launchpad Service ← Backend API (Railway)
    ↓
Smart Contract (Analos)
    ↓
Program Derived Addresses (PDAs)
    ├── Collection Config
    └── Mint Records
```

---

## 🚀 Build & Test Commands

### Frontend

```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Development server (port 3000)
npm run build        # Production build
npm run start        # Production server
npm run lint         # Linting
```

### Backend

```bash
cd backend
npm install          # Install dependencies
npm run dev          # Development server (port 3001)
npm run build        # Compile TypeScript
npm run start        # Production server
```

---

## 📝 Important Files

### Documentation
- `README.md` - Project overview
- `DEPLOYMENT.md` - Complete deployment guide
- `QUICKSTART-DEPLOY.md` - Fast deployment (10 min)
- `INTEGRATION-GUIDE.md` - Smart contract integration
- `PROJECT-STRUCTURE.md` - This file

### Configuration
- `frontend/vercel.json` - Vercel config
- `backend/railway.json` - Railway config
- `frontend/.env.example` - Frontend environment template
- `backend/.env.example` - Backend environment template
- `.gitignore` - Git ignore rules

### Smart Contract Integration
- `frontend/src/lib/nft-launchpad-config.ts` - Config & types
- `frontend/src/lib/nft-launchpad-service.ts` - Service layer
- `frontend/src/lib/analos-web3-wrapper.ts` - Connection manager

### UI Components
- `frontend/src/app/components/NFTLaunchpadDemo.tsx` - Main demo
- `frontend/src/app/launchpad-demo/page.tsx` - Demo page
- All other components in `frontend/src/app/components/`

---

## 🎯 Quick Start

### 1. Local Development

```bash
# Terminal 1 - Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your values
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your values
npm run dev
```

Visit: http://localhost:3000

### 2. Production Deployment

```bash
# Push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_REPO_URL
git push -u origin main

# Deploy backend to Railway (3 min)
# Deploy frontend to Vercel (3 min)
# Configure environment variables
# Done! 🎉
```

See `QUICKSTART-DEPLOY.md` for detailed steps.

---

## 🔐 Security Notes

**NEVER commit these files:**
- `.env`
- `.env.local`
- `.env.production`
- `wallet.json`
- `keypair.json`
- Any private keys or secrets

**Always use environment variables for:**
- Private keys
- API keys
- Admin wallet addresses
- Database URLs
- Secret tokens

---

## 🎉 You're All Set!

Your project is production-ready with:
- ✅ Full-stack application
- ✅ NFT Launchpad integration
- ✅ Deployed smart contract
- ✅ Deployment configurations
- ✅ Comprehensive documentation
- ✅ Build tests passed

**Start deploying:** Read `QUICKSTART-DEPLOY.md`

---

Built with ❤️ on Analos • Program ID: `FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo`

