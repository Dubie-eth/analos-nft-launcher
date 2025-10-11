# Analos NFT Launchpad Program

A comprehensive NFT launchpad smart contract for the Analos blockchain, featuring blind mint and reveal mechanics, advanced fee distribution, bonding curves, social verification, and community governance.

## 🚀 Features

### Core Features
- **Blind Mint & Reveal**: Mystery box NFTs that reveal traits after minting
- **Fee Distribution**: 6% to LOL ecosystem, 25% to creators, 69% to liquidity pools
- **Ticker Collision Prevention**: Unique collection symbols with on-chain registry
- **Escrow Wallet System**: Dedicated wallets for each collection with authority management

### Advanced Features
- **Bonding Curves**: Dynamic pricing with multi-tier access rules
- **Social Verification**: Twitter/Discord integration for whitelist access
- **Community Takeovers**: Proposal and voting system for authority transfers
- **Burn Functionality**: Users can burn their NFTs, admins can burn any NFT
- **Fee Caps**: Maximum 6.9% trading/minting fees to prevent rug pulls
- **Platform Fee Scaling**: Dynamic fees based on trading volume

### Security Features
- **Rate Limiting**: Prevents botting with configurable mint limits
- **Commitment/Reveal System**: Cryptographically secure randomness
- **Emergency Controls**: Pause functionality and fee cap management
- **Multi-sig Support**: Authority can be transferred to multi-sig wallets

## 📁 File Structure

```
analos-nft-launchpad-program/
├── Cargo.toml              # Rust dependencies and configuration
├── Anchor.toml             # Anchor framework configuration
└── src/
    └── lib.rs              # Main program code (2,049 lines)
```

## 🛠 Setup Instructions

### 1. Import to Solana Playground

1. Go to [Solana Playground](https://beta.solpg.io)
2. Click "Import from Github"
3. Enter: `https://github.com/Dubie-eth/analos-nft-launchpad-program`
4. Click "Import"

### 2. Build the Program

In Playground terminal:
```bash
build
```

### 3. Deploy to Devnet

```bash
deploy
```

## 📊 Program ID

- **Devnet**: `7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk`
- **Mainnet**: `7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk`

## 💰 Fee Structure

### LOL Ecosystem (6% total)
- **Dev Team**: 1% (`Em26WavfAndcLGMWZHakvJHF5iAseHuvsbPXgCDcf63D`)
- **Pool Creation**: 2% (`myHsakbfHT7x378AvYJkBCtmF3TiSBpxA6DADRExa7Q`)
- **Buyback/Burn**: 1% (`7V2YgSfqu5E7nx2SXzHzaMPDnxzfh2dNXgBswknvj721`)
- **Platform Maintenance**: 1% (`myHsakbfHT7x378AvYJkBCtmF3TiSBpxA6DADRExa7Q`)
- **Community Rewards**: 1% (`7V2YgSfqu5E7nx2SXzHzaMPDnxzfh2dNXgBswknvj721`)

### Creator Allocation (25% total)
- **Immediate**: 10% available after bonding
- **Vested**: 15% vested over 12 months

### Pool Allocation (69% total)
- Goes to liquidity pool for token launch

## 🔧 Key Instructions

### Core Functions
- `initialize_collection`: Create a new NFT collection
- `mint_placeholder`: Mint mystery box NFTs
- `reveal_collection`: Reveal all NFTs in collection
- `burn_nft`: Burn user's own NFTs
- `admin_burn_nft`: Admin burn any NFT

### Escrow Management
- `withdraw_from_escrow`: Withdraw funds from escrow
- `set_creator_share_percentage`: Adjust creator allocation
- `transfer_escrow_authority`: Transfer escrow control

### Community Features
- `create_takeover_proposal`: Propose authority transfer
- `vote_on_takeover_proposal`: Vote on proposals
- `configure_bonding_curve_pricing`: Set dynamic pricing
- `configure_social_verification`: Set up social requirements

## 🛡 Security

- **Fee Caps**: Maximum 6.9% on all fees
- **Authority Controls**: Multi-sig and community governance
- **Rate Limiting**: Configurable mint limits per user
- **Emergency Pause**: Global pause functionality
- **Commitment System**: Secure randomness for reveals

## 📈 Scalability

- **Ticker Registry**: Supports 1,000 unique collection symbols
- **Upgradeable Capacity**: Registry can be expanded
- **Batch Operations**: Efficient bulk operations
- **Volume-Based Fees**: Dynamic scaling with usage

## 🔗 Integration

This program integrates with:
- **Analos Token Launch Program**: For token creation after bonding
- **Analos Rarity Oracle**: For rarity-based token distribution
- **Analos Price Oracle**: For USD-pegged pricing

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

- **Email**: support@launchonlos.fun
- **GitHub**: [@Dubie-eth](https://github.com/Dubie-eth)

---

**Built for the Analos ecosystem with ❤️**
