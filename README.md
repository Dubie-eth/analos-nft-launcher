# LosLauncher - Advanced NFT Minting Platform for Analos Blockchain

A full-stack NFT minting platform built for the Analos blockchain, featuring advanced collection deployment, multi-token payments, whitelist management, and comprehensive admin controls.

## 🌐 Live Demo

- **Admin Panel**: https://analos-nft-launcher-9cxc.vercel.app/admin
- **Mint Page**: https://analos-nft-launcher-9cxc.vercel.app/mint/launch-on-los
- **NFT Explorer**: https://analos-nft-launcher-9cxc.vercel.app/explorer

## 🚀 Advanced Features

- **Multi-Token Payment System**: Pay with any Analos token + small $LOS fee for account creation
- **Advanced Whitelist Management**: Address-based and token-holder based whitelisting
- **Whitelist Phases**: Multiple phases with different rules, prices, and eligibility
- **Delayed Reveal**: Timer-based, completion-based, or manual NFT reveals
- **Max Mints Per Wallet**: Configurable limits per wallet address
- **Token Holder Verification**: Auto-detect and whitelist holders of specific tokens
- **Collection Management**: Professional admin panel with hide/unhide functionality
- **Real-time Blockchain Integration**: Live supply tracking and minting status
- **Token-2022 Support**: Full support for both SPL Token and Token-2022 standards

## 🏗️ Architecture

- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Backend**: Express.js with TypeScript
- **Blockchain**: Solana/Anchor smart contracts for Analos
- **Wallet Integration**: Solana wallet adapter

## 📁 Project Structure

```
LosLauncher/
├── frontend-new/          # Next.js frontend application
├── backend/               # Express.js backend API
├── contracts/             # Anchor smart contracts
├── deploy-contracts.sh    # Contract deployment script
└── railway.json          # Railway deployment config
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Solana CLI
- Anchor CLI
- Git

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd LosLauncher

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend-new
npm install

# Install contract dependencies
cd ../contracts
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the `frontend-new` directory:

```env
# Backend API URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# App URL (for generating mint page URLs)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Deploy Smart Contracts

```bash
# Navigate to contracts directory
cd contracts

# Build and deploy contracts
anchor build
anchor deploy --provider.cluster devnet
```

### 4. Start the Development Servers

```bash
# Terminal 1: Start backend server
cd backend
npm run dev

# Terminal 2: Start frontend server
cd frontend-new
npm run dev
```

## 🌐 API Endpoints

### Collections
- `GET /api/collections` - List all collections
- `GET /api/collections/:name` - Get collection by name
- `POST /api/collections/deploy` - Deploy new collection

### Minting
- `POST /api/mint` - Mint NFTs from a collection

### Admin
- `GET /api/admin/mint-stats` - Get minting statistics
- `POST /api/admin/toggle-minting` - Toggle minting status

## 🎯 Usage

1. **Create Collection**: Use the admin panel to deploy a new NFT collection
2. **Configure Settings**: Set price, supply, fees, and metadata
3. **Mint NFTs**: Users can mint NFTs from available collections
4. **Track Progress**: Monitor minting progress and supply

## 🔧 Development

### Backend Development
```bash
cd backend
npm run dev    # Start with hot reload
npm run build  # Build for production
npm start      # Start production server
```

### Frontend Development
```bash
cd frontend-new
npm run dev    # Start development server
npm run build  # Build for production
npm start      # Start production server
```

### Smart Contract Development
```bash
cd contracts
anchor build   # Build contracts
anchor test    # Run tests
anchor deploy  # Deploy to network
```

## 🚀 Deployment

### Railway Deployment
The project is configured for Railway deployment with the included `railway.json` file.

### Manual Deployment
1. Build the frontend: `cd frontend-new && npm run build`
2. Build the backend: `cd backend && npm run build`
3. Deploy contracts: `cd contracts && anchor deploy`
4. Update environment variables for production

## 📝 Smart Contracts

The project includes Anchor-based smart contracts for:
- Collection initialization
- NFT minting
- Supply management
- Authority controls

## 🔗 Blockchain Integration

- **Network**: Analos Devnet/Mainnet
- **RPC**: https://rpc.analos.io
- **Explorer**: https://explorer.analos.io

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Open an issue on GitHub
- Join our community Discord

---

**Built for the Analos ecosystem** 🚀
