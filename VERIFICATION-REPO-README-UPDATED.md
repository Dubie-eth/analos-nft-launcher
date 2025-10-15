# Analos NFT Launchpad - Program Validation Repository

This repository contains the source code for all Analos NFT Launchpad programs for validation and auditing purposes.

## 🚀 **Programs Included**

### Mega Program (Consolidated)

1. **🎯 Mega NFT Launchpad Core** - `BioNVjtSmBSvsVG3Yqn5VHWGDrLD56AvqYhz1LZbWhdr`
   - Complete NFT launchpad platform with all features integrated
   - Includes: NFT minting, token bonding curves, rarity system, staking, governance
   - Deployed on Analos mainnet and fully functional

### Core Programs (Individual)

2. **💰 Price Oracle** - `B26WiDKnjeQtZTGB6BqSyFMaejXJfkxm1CKu1CYQF1D`
3. **🔍 Rarity Oracle** - `C2YCPD3ZR5mWC7q1TMh2KqN43XWzCsdnbPgswGsFTDr5`
4. **🎨 NFT Launchpad** - `5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT`
5. **🚀 Token Launch** - `Eydws6TzESGgBZyEHy5BYF8sSDcsRXC4tBF9JaVqWCRw`

### Enhanced Programs

6. **💼 OTC Enhanced**
7. **🎁 Airdrop Enhanced**
8. **⏰ Vesting Enhanced**
9. **🔒 Token Lock Enhanced**
10. **📊 Monitoring System**

## 📁 **Repository Structure**

```
├── programs/
│   ├── mega-nft-launchpad-core/
│   │   ├── src/
│   │   │   └── lib.rs
│   │   └── Cargo.toml
│   ├── price-oracle/
│   ├── rarity-oracle/
│   ├── nft-launchpad/
│   ├── token-launch/
│   └── enhanced-programs/
├── idl/
│   ├── analos_nft_launchpad_core.json
│   ├── analos_price_oracle.json
│   ├── analos_rarity_oracle.json
│   ├── analos_nft_launchpad.json
│   └── analos_token_launch.json
├── security.txt
├── Anchor.toml
├── Cargo.toml
└── README.md
```

## 🔧 **Building Programs**

```bash
# Install Anchor
sh -c "$(curl -sSfL https://release.anchor-lang.com/install)"

# Build all programs
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Deploy to mainnet (Analos)
anchor deploy --provider.cluster mainnet
```

## 🔍 **Program Validation**

Each program includes:

* ✅ **Source code** with comprehensive comments
* ✅ **IDL files** for frontend integration
* ✅ **Security.txt** for responsible disclosure
* ✅ **Test coverage** for critical functions
* ✅ **Documentation** for each instruction

## 🛡️ **Security**

* All programs include security.txt for responsible disclosure
* Contact: **support@launchonlos.fun**
* Twitter: @EWildn
* Telegram: t.me/Dubie_420

## 📋 **Deployment Status**

| Program                    | Devnet | Analos Mainnet | Status     |
| -------------------------- | ------ | -------------- | ---------- |
| Mega NFT Launchpad Core    | ✅      | ✅             | **ACTIVE** |
| Price Oracle               | ✅      | ✅             | Active     |
| Rarity Oracle              | ✅      | ✅             | Active     |
| NFT Launchpad              | ✅      | ✅             | Active     |
| Token Launch               | ✅      | ✅             | Active     |
| OTC Enhanced               | ✅      | ✅             | Active     |
| Airdrop Enhanced           | ✅      | ✅             | Active     |
| Vesting Enhanced           | ✅      | ✅             | Active     |
| Token Lock Enhanced        | ✅      | ✅             | Active     |
| Monitoring System          | ✅      | ✅             | Active     |

## 🎯 **Frontend Integration**

The frontend is fully integrated with all programs and running on:
- **Production URL**: https://onlyanal.fun
- **Admin Dashboard**: https://onlyanal.fun/admin
- **Analos RPC**: https://rpc.analos.io

## 🔗 **Key Features**

### Mega NFT Launchpad Core
- **NFT-Only Mode**: Simple NFT collections
- **NFT-to-Token Mode**: Full bonding curve integration
- **Rarity System**: On-chain rarity determination
- **Staking**: NFT and token staking with rewards
- **Governance**: CTO (Chief Technology Officer) voting
- **Creator Profiles**: On-chain social verification
- **Referral System**: Built-in referral rewards
- **Platform Fees**: Blockchain-enforced fee structure

### Admin Controls
- **Fee Management**: Adjustable platform fees
- **Revenue Distribution**: Holder rewards and treasury
- **Emergency Pause**: Platform-wide pause functionality
- **Access Management**: Beta user access controls

## 📞 **Support**

* **Email**: support@launchonlos.fun
* **Twitter**: @EWildn
* **Telegram**: t.me/Dubie_420
* **GitHub Issues**: For bug reports and feature requests

## 🔄 **Recent Updates**

- ✅ **Mega NFT Launchpad Core deployed** to Analos mainnet
- ✅ **Platform initialized** and fully functional
- ✅ **Frontend integration** complete
- ✅ **Admin dashboard** operational
- ✅ **Security.txt updated** with correct contact information

---

**⚠️ Important**: This repository is for validation purposes. Always verify program IDs and deployment status before using in production.

**🎉 Status**: All systems operational on Analos mainnet!
