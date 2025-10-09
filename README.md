# 🚀 Analos NFT Launchpad - Production

Complete NFT launchpad platform with blind mint & reveal system on Analos blockchain.

## 🌟 What's Included

### Frontend (Next.js 15 + React 19)
- **NFT Launchpad** - Blind mint & reveal system
- **Collection Management** - Create and manage collections
- **Bonding Curve** - Dynamic pricing
- **Marketplace** - Trading interface
- **Admin Dashboard** - Full admin controls
- **Wallet Integration** - Backpack, Phantom support

### Backend (Node.js + Express)
- **NFT Minting API** - Blockchain integration
- **Metadata Management** - IPFS/Arweave storage
- **Collection Tracking** - Real-time stats
- **Webhook Support** - Event notifications

### Smart Contract (Anchor/Rust)
- **Program ID:** `FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo`
- **Network:** Analos Mainnet
- **Features:** Blind mint, reveal, admin controls, rarity system

---

## 🚀 Quick Deploy

### Deploy to Vercel (Frontend)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=YOUR_REPO_URL&project-name=analos-nft-frontend&root-directory=frontend)

**One-Click Deploy:**
1. Click the button above
2. Connect your GitHub account
3. Set environment variables (see below)
4. Deploy!

**Manual Deploy:**
```bash
cd frontend
npm install
npm run build
# Connect to Vercel
vercel --prod
```

### Deploy to Railway (Backend)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/YOUR_TEMPLATE)

**One-Click Deploy:**
1. Click the button above
2. Connect your GitHub account
3. Set environment variables
4. Deploy!

**Manual Deploy:**
```bash
cd backend
npm install
npm run build
# Connect to Railway
railway up
```

---

## 🔧 Environment Variables

### Frontend (.env.local)

```bash
# Analos Network
NEXT_PUBLIC_RPC_URL=https://rpc.analos.io
NEXT_PUBLIC_NETWORK=mainnet

# NFT Launchpad Smart Contract
NEXT_PUBLIC_NFT_LAUNCHPAD_PROGRAM=FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo

# Admin Configuration
NEXT_PUBLIC_ADMIN_WALLET_1=YourAdminWalletAddress

# Backend API (set after backend deployment)
NEXT_PUBLIC_API_URL=https://your-backend.railway.app

# Optional: IPFS/Arweave
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_key
NEXT_PUBLIC_PINATA_SECRET=your_pinata_secret
```

### Backend (.env)

```bash
# Server
PORT=3001
NODE_ENV=production

# Analos Network
ANALOS_RPC_URL=https://rpc.analos.io

# Admin Wallet (for server-side operations)
ADMIN_PRIVATE_KEY=your_private_key_base58

# Storage (IPFS/Arweave)
PINATA_API_KEY=your_pinata_key
PINATA_SECRET_API_KEY=your_pinata_secret
ARWEAVE_WALLET=your_arweave_wallet_json

# CORS (your frontend URL)
CORS_ORIGIN=https://your-frontend.vercel.app

# Optional: Database
DATABASE_URL=your_database_url
```

---

## 📦 Local Development

### Prerequisites
- Node.js 18+ 
- npm/yarn
- Git

### Setup

```bash
# Clone the repo
git clone YOUR_REPO_URL
cd analos-nft-production

# Install frontend
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your values
npm run dev
# Frontend runs on http://localhost:3000

# Install backend (in a new terminal)
cd ../backend
npm install
cp .env.example .env
# Edit .env with your values
npm run dev
# Backend runs on http://localhost:3001
```

---

## 🎯 Features

### NFT Launchpad
- ✅ **Blind Minting** - Mystery box NFTs
- ✅ **On-Chain Randomness** - Fair rarity distribution
- ✅ **Reveal System** - Timed or threshold-based reveals
- ✅ **Rarity Tiers** - Legendary, Epic, Rare, Common
- ✅ **Admin Controls** - Pause, resume, withdraw

### Collection Management
- ✅ **Create Collections** - Custom parameters
- ✅ **Metadata Management** - IPFS/Arweave integration
- ✅ **Supply Tracking** - Real-time stats
- ✅ **Price Configuration** - Flexible pricing

### User Experience
- ✅ **Wallet Connect** - Backpack, Phantom, Solflare
- ✅ **Real-time Updates** - WebSocket support
- ✅ **Mobile Responsive** - Works on all devices
- ✅ **Dark/Light Mode** - Theme support

---

## 📚 Documentation

- **[Frontend README](./frontend/README.md)** - Frontend setup and features
- **[Backend README](./backend/README.md)** - API documentation
- **[Integration Guide](./INTEGRATION-GUIDE.md)** - Smart contract integration
- **[Deployment Guide](./DEPLOYMENT.md)** - Full deployment instructions

---

## 🏗️ Project Structure

```
analos-nft-production/
├── frontend/                 # Next.js 15 frontend
│   ├── src/
│   │   ├── app/             # Pages and routes
│   │   ├── components/      # React components
│   │   └── lib/             # Services and utilities
│   ├── public/              # Static assets
│   ├── package.json
│   ├── next.config.ts
│   └── vercel.json          # Vercel config
├── backend/                 # Node.js backend
│   ├── src/                 # Source code
│   ├── package.json
│   └── railway.json         # Railway config
├── README.md                # This file
└── DEPLOYMENT.md            # Deployment guide
```

---

## 🔗 Important Links

**Smart Contract:**
- Program ID: `FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo`
- Explorer: https://explorer.analos.io/address/FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo
- Network: Analos Mainnet (https://rpc.analos.io)

**Resources:**
- Analos Docs: https://docs.analos.io
- Analos Explorer: https://explorer.analos.io
- Discord: [Your Discord]
- Twitter: [Your Twitter]

---

## 🚨 Security

**Important Security Notes:**

1. **Never commit private keys or secrets**
2. **Use environment variables for all sensitive data**
3. **Enable security features in production**
4. **Regular security audits recommended**
5. **Monitor admin wallet activity**

See [SECURITY.md](./SECURITY.md) for full security guidelines.

---

## 🧪 Testing

### Frontend Tests
```bash
cd frontend
npm test
```

### Backend Tests
```bash
cd backend
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 📄 License

MIT License - See [LICENSE](./LICENSE) for details

---

## 💬 Support

- **Technical Issues:** Open a GitHub issue
- **Security Issues:** Email security@yourdomain.com
- **Discord:** Join our community
- **Docs:** Check the documentation

---

## 🎉 Quick Start Checklist

### First-Time Setup

- [ ] Clone the repository
- [ ] Install dependencies (frontend + backend)
- [ ] Set up environment variables
- [ ] Test locally (`npm run dev`)
- [ ] Deploy backend to Railway
- [ ] Deploy frontend to Vercel
- [ ] Configure environment variables in production
- [ ] Test production deployment
- [ ] Set up custom domain (optional)
- [ ] Configure monitoring/analytics

### Before Launch

- [ ] Test all features thoroughly
- [ ] Upload placeholder metadata to IPFS
- [ ] Upload revealed metadata to IPFS
- [ ] Test minting on testnet/devnet
- [ ] Configure admin wallet
- [ ] Set collection parameters
- [ ] Test reveal mechanism
- [ ] Verify Explorer links work
- [ ] Announce to community
- [ ] Launch! 🚀

---

## 🌟 What's Next?

After successful deployment:

1. **Test Everything** - Thoroughly test all features
2. **Create Collection** - Initialize your first collection
3. **Upload Metadata** - Prepare placeholder and revealed assets
4. **Configure Parameters** - Set pricing, supply, reveal threshold
5. **Announce** - Share with your community
6. **Monitor** - Track mints, revenue, and activity
7. **Iterate** - Improve based on feedback

---

Built with ❤️ for Analos blockchain

**Program ID:** `FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo`

