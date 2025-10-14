# 🚀 Analos Programs - Official Verification Repository

**Complete source code for all Analos NFT Launchpad programs.**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Anchor](https://img.shields.io/badge/anchor-0.29.0-purple.svg)](https://www.anchor-lang.com/)
[![Solana](https://img.shields.io/badge/solana-1.17+-green.svg)](https://solana.com/)

This repository contains the auditable source code for the entire Analos ecosystem, deployed on the Analos blockchain.

## 🎯 Programs Overview

### Core Programs (Foundation)

| Program | Program ID | Status | Description |
|---------|-----------|--------|-------------|
| **💰 Price Oracle** | `9dEJ2oK4cgDE994FU9za4t2BN7mFwSCfhSsLTGD3a4ym` | ✅ Active | Real-time LOS price feeds from multiple sources |
| **🎲 Rarity Oracle** | `C2YCPD3ZR5mWC7q1TMh2KqN43XWzCsdnbPgswGsFTDr5` | ✅ Active | NFT rarity determination with provable randomness |
| **🎨 NFT Launchpad** | `5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT` | ✅ Active | Blind mint NFT collections with reveal mechanism |
| **🚀 Token Launch** | `Eydws6TzESGgBZyEHy5BYF8sSDcsRXC4tBF9JaVqWCRw` | ✅ Active | NFT → Token conversion with rarity multipliers |

### Enhanced Programs (Advanced Features)

| Program | Program ID | Status | Description |
|---------|-----------|--------|-------------|
| **💼 OTC Enhanced** | `7hnWVgRxu2dNWiNAzNB2jWoubzMcdY6HNysjhLiawXPY` | ✅ Active | P2P trading with escrow and multi-sig |
| **🎁 Airdrop Enhanced** | `J2D1LiSGxj9vTN7vc3CUD1LkrnqanAeAoAhE2nvvyXHC` | ✅ Active | Merkle-based airdrops with rate limiting |
| **⏰ Vesting Enhanced** | `Ae3hXKsHzYPCPUKLtq2mdYZ3E2oKeKrF63ekceGxpHsY` | ✅ Active | Time-locked token releases with vesting schedules |
| **🔒 Token Lock Enhanced** | `3WmPLvyFpmQ8yPHh7nLxj6FLSATn2uVeD2ceNpuRKzZH` | ✅ Active | LP token locking with multi-sig unlock |
| **📊 Monitoring System** | `7PT1ubRGFWXFCmZTpsa9gtm9GZf8BaYTkSd7gE8VcXdG` | ✅ Active | Real-time security monitoring and alerting |

## 🔍 Verification

All programs are deployed on the **Analos blockchain** and can be verified at:

🔗 **Explorer**: https://explorer.analos.io  
🔗 **RPC**: https://rpc.analos.io

### Verify Program Deployment

```bash
# Set RPC endpoint
export RPC_URL="https://rpc.analos.io"

# Price Oracle
solana program show 9dEJ2oK4cgDE994FU9za4t2BN7mFwSCfhSsLTGD3a4ym --url $RPC_URL

# Rarity Oracle
solana program show C2YCPD3ZR5mWC7q1TMh2KqN43XWzCsdnbPgswGsFTDr5 --url $RPC_URL

# Token Launch
solana program show Eydws6TzESGgBZyEHy5BYF8sSDcsRXC4tBF9JaVqWCRw --url $RPC_URL

# NFT Launchpad
solana program show 5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT --url $RPC_URL
```

## 🏗️ Architecture

```
┌─────────────────────┐
│  NFT Launchpad      │  Blind mint collections
│  (Foundation)       │  Creates collection_config PDAs
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  Rarity Oracle      │  Determines NFT rarity
│                     │  Provides token multipliers (1x-1000x)
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  Token Launch       │  Distributes tokens based on rarity
│                     │  DLMM bonding curve integration
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  Enhanced Programs  │  OTC, Airdrops, Vesting, Locks
│  (Ecosystem)        │  Advanced DeFi features
└─────────────────────┘
```

## 🔧 Building from Source

### Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI (v1.17+)
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor (v0.29.0)
cargo install --git https://github.com/coral-xyz/anchor --tag v0.29.0 anchor-cli
```

### Build All Programs

```bash
# Clone repository
git clone https://github.com/Dubie-eth/analos-programs.git
cd analos-programs

# Build all programs
anchor build

# Run tests
anchor test
```

### Verify Build Matches Deployment

```bash
# Build the program
anchor build

# Get build hash
solana-verify get-program-hash target/deploy/analos_price_oracle.so

# Compare with deployed program
solana-verify get-executable-hash 9dEJ2oK4cgDE994FU9za4t2BN7mFwSCfhSsLTGD3a4ym \
    --url https://rpc.analos.io
```

## 🛡️ Security

### Security.txt Implementation

Each program includes an embedded security.txt following the [securitytxt.org](https://securitytxt.org/) standard:

```rust
security_txt! {
    name: "Analos [Program Name]",
    project_url: "https://github.com/Dubie-eth/analos-programs",
    contacts: "email:security@analos.io,twitter:@EWildn,telegram:t.me/Dubie_420",
    policy: "https://github.com/Dubie-eth/analos-programs/blob/main/SECURITY.md",
    preferred_languages: "en",
    source_code: "https://github.com/Dubie-eth/analos-programs",
    auditors: "None",
    acknowledgements: "Thank you to all security researchers!"
}
```

### Responsible Disclosure

🔒 **Found a vulnerability?**

1. **DO NOT** open a public GitHub issue
2. Email: security@analos.io
3. Allow 90 days for patch development
4. Coordinate disclosure timing

### Bug Bounty

We offer rewards for responsibly disclosed vulnerabilities:

| Severity | Reward |
|----------|--------|
| Critical | Up to $50,000 |
| High | Up to $25,000 |
| Medium | Up to $10,000 |
| Low | Up to $1,000 |

See [SECURITY.md](./SECURITY.md) for full details.

## 📚 Documentation

- [📐 Architecture Overview](./docs/ARCHITECTURE.md) - Complete system design
- [🔐 Security Audit Report](./docs/SECURITY-AUDIT.md) - Security analysis
- [🚀 Deployment Guide](./docs/DEPLOYMENT-GUIDE.md) - How to deploy
- [🔗 Integration Guide](./docs/INTEGRATION-GUIDE.md) - Frontend integration

## 🔗 Links

- **Website**: https://analos.io
- **App**: https://analos-nft-frontend-minimal.vercel.app
- **Explorer**: https://explorer.analos.io
- **RPC**: https://rpc.analos.io
- **Twitter**: [@EWildn](https://twitter.com/EWildn)
- **Telegram**: [t.me/Dubie_420](https://t.me/Dubie_420)

## 📊 Program Statistics

| Metric | Value |
|--------|-------|
| Total Programs | 9 |
| Lines of Code | ~15,000 |
| Test Coverage | 85%+ |
| Deployment Date | January 2025 |
| Blockchain | Analos |
| Framework | Anchor 0.29.0 |
| Language | Rust |

## 🚀 Deployment Status

| Program | Devnet | Mainnet | Verified |
|---------|--------|---------|----------|
| Price Oracle | ✅ | ✅ | 🔄 Pending |
| Rarity Oracle | ✅ | ✅ | 🔄 Pending |
| NFT Launchpad | ✅ | ✅ | 🔄 Pending |
| Token Launch | ✅ | ✅ | 🔄 Pending |
| OTC Enhanced | ✅ | ✅ | 🔄 Pending |
| Airdrop Enhanced | ✅ | ✅ | 🔄 Pending |
| Vesting Enhanced | ✅ | ✅ | 🔄 Pending |
| Token Lock Enhanced | ✅ | ✅ | 🔄 Pending |
| Monitoring System | ✅ | ✅ | 🔄 Pending |

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests (85%+ coverage required)
5. Update documentation
6. Submit a pull request

### Code Style

- Follow Rust conventions
- Use Anchor best practices
- Add comprehensive comments
- Include security.txt in all programs

## 📄 License

This code is provided for verification and auditing purposes.

## ⚠️ Disclaimer

This code is provided "as is" without warranty of any kind. Always verify program IDs before interacting with smart contracts. Use at your own risk. Never send funds to unverified programs.

---

**Built with ❤️ by the Analos team**

*Last updated: January 2025*

