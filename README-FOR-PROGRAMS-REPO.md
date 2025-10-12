# Analos NFT Launchpad - Solana Programs

Official Solana programs for the Analos NFT Launchpad ecosystem.

## 🔐 Verified Builds

All programs are built with [verified builds](https://solana.com/docs/programs/verified-builds) for transparency and security.

## 📦 Programs

### Core Programs

| Program | ID | Status |
|---------|----|----|
| **NFT Launchpad** | `5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT` | ✅ Deployed |
| **Token Launch** | `CDJZZCSod3YS9crpWAvWSLWEpPyx9QZCRRAcv7xL1FZf` | ✅ Deployed |
| **Rarity Oracle** | `3cnHMbD3Y88BZbxEPzv7WZGkN12X2bwKEP4FFtaVd5B2` | ✅ Deployed |
| **Price Oracle** | `5ihyquuoRJXTocBhjEA48rGQGsM9ZB6HezYE1dQq8NUD` | ✅ Deployed |

### Enhanced Programs

| Program | ID | Status |
|---------|----|----|
| **OTC Enhanced** | `7hnWVgRxu2dNWiNAzNB2jWoubzMcdY6HNysjhLiawXPY` | ✅ Deployed |
| **Airdrop Enhanced** | `J2D1LiSGxj9vTN7vc3CUD1LkrnqanAeAoAhE2nvvyXHC` | ✅ Deployed |
| **Vesting Enhanced** | `Ae3hXKsHzYPCPUKLtq2mdYZ3E2oKeKrF63ekceGxpHsY` | ✅ Deployed |
| **Token Lock Enhanced** | `3WmPLvyFpmQ8yPHh7nLxj6FLSATn2uVeD2ceNpuRKwZH` | ✅ Deployed |
| **Monitoring System** | `7PT1ubRGFWXFCmZTpsa9gtm9GZf8BaYTkSd7gE8VcXdG` | ✅ Deployed |

## 🏗️ Building

### Prerequisites

- Rust 1.70+
- Solana CLI 1.16+
- Anchor 0.28.0

### Build

```bash
# Regular build
anchor build

# Verified build (recommended)
cargo install solana-verify
solana-verify build
```

## 🔍 Verification

Verify any program matches the source code:

```bash
solana-verify verify-from-repo \
  --program-id <PROGRAM_ID> \
  --library-name <LIB_NAME> \
  https://github.com/Dubie-eth/analos-nft-launchpad-program \
  --commit-hash <COMMIT_HASH>
```

## 🔐 Security

### Reporting Vulnerabilities

See [SECURITY.md](./SECURITY.md) for our security policy.

**Contact:**
- Email: security@analos.io
- Twitter: [@EWildn](https://twitter.com/EWildn)
- Telegram: [t.me/Dubie_420](https://t.me/Dubie_420)

### Security.txt

Each program contains embedded security contact information:

```bash
cargo install --git https://github.com/neodyme-labs/solana-security-txt query-security-txt
query-security-txt <PROGRAM_ID>
```

## 📚 Documentation

### Program Descriptions

#### NFT Launchpad
Mystery box NFT system with reveal mechanics, bonding curves, and dynamic fee distribution.

#### Token Launch
Fair launch platform with bonding curves, anti-bot protections, and vesting schedules.

#### Rarity Oracle
On-chain NFT rarity scoring and ranking system.

#### Price Oracle
Price feed system for NFT floor prices and token prices.

#### OTC Enhanced
Peer-to-peer trading with escrow, multi-sig support, and rate limiting.

#### Airdrop Enhanced
Merkle tree-based airdrop distribution with security features.

#### Vesting Enhanced
Token vesting with cliff periods and emergency controls.

#### Token Lock Enhanced
Time-locked token escrow with milestone unlocks.

#### Monitoring System
Real-time transaction monitoring and alert system.

## 🔗 Links

- **Website:** https://analos.io
- **Explorer:** https://explorer.analos.io
- **Twitter:** [@EWildn](https://twitter.com/EWildn)
- **Telegram:** [t.me/Dubie_420](https://t.me/Dubie_420)

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines (coming soon).

For security-related contributions, please follow our [Security Policy](./SECURITY.md).

---

**Built with ❤️ by the Analos team**

