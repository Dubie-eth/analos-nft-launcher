# Analos Program Deployment Guide

## 🚀 **Quick Start**

### Prerequisites
- Rust 1.70+
- Solana CLI 1.16+
- Anchor Framework 0.29+

### Installation
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.16.0/install)"

# Install Anchor
sh -c "$(curl -sSfL https://release.anchor-lang.com/install)"
```

## 🔧 **Building Programs**

### Build All Programs
```bash
anchor build
```

### Build Individual Program
```bash
anchor build --program-name <program-name>
```

### Verify Build
```bash
anchor verify
```

## 🌐 **Network Configuration**

### Devnet (Recommended for Testing)
```bash
solana config set --url https://api.devnet.solana.com
```

### Mainnet
```bash
solana config set --url https://api.mainnet-beta.solana.com
```

### Analos Network
```bash
solana config set --url https://rpc.analos.io
```

## 📋 **Deployment Steps**

### 1. Setup Wallet
```bash
# Generate new keypair
solana-keygen new --outfile ~/analos-deployer.json

# Set as default
solana config set --keypair ~/analos-deployer.json

# Fund wallet (devnet)
solana airdrop 10
```

### 2. Deploy Programs

#### Deploy to Devnet
```bash
anchor deploy --provider.cluster devnet
```

#### Deploy to Mainnet
```bash
anchor deploy --provider.cluster mainnet
```

#### Deploy to Analos
```bash
anchor deploy --provider.cluster https://rpc.analos.io
```

### 3. Update Program IDs

After deployment, update the program IDs in:
- `Anchor.toml`
- Frontend configuration files
- IDL files

## 🎯 **Program-Specific Deployment**

### Price Oracle
```bash
anchor deploy --program-name analos_price_oracle
```

### Rarity Oracle
```bash
anchor deploy --program-name analos_rarity_oracle
```

### NFT Launchpad
```bash
anchor deploy --program-name analos_nft_launchpad
```

### Token Launch
```bash
anchor deploy --program-name analos_token_launch
```

## 🔍 **Verification**

### Verify Deployment
```bash
# Check program exists
solana program show <PROGRAM_ID>

# Verify program data
solana program dump <PROGRAM_ID> program.so

# Compare with built program
sha256sum program.so target/deploy/analos_program.so
```

### Test Instructions
```bash
# Run tests
anchor test

# Test specific program
anchor test --program-name <program-name>
```

## 📊 **Post-Deployment**

### 1. Initialize Programs
Use the frontend admin panel to initialize:
- Price Oracle with market cap data
- Rarity Oracle configuration
- NFT Launchpad collections

### 2. Update Frontend
- Update program IDs in configuration
- Deploy updated frontend
- Test all functionality

### 3. Monitor
- Check program accounts
- Monitor for errors
- Verify all instructions work

## 🛡️ **Security Checklist**

### Before Deployment
- [ ] Code review completed
- [ ] Tests passing
- [ ] Security audit done
- [ ] Program IDs verified
- [ ] Authority keys secured

### After Deployment
- [ ] Programs deployed successfully
- [ ] Initialization completed
- [ ] Frontend updated
- [ ] Monitoring active
- [ ] Documentation updated

## 🚨 **Emergency Procedures**

### Pause Programs
```bash
# Use program-specific pause instructions
# or update program authority to pause account
```

### Upgrade Programs
```bash
# Deploy new version
anchor deploy

# Update program data
solana program deploy --program-id <PROGRAM_ID> target/deploy/program.so
```

### Recovery
```bash
# Restore from backup
solana program deploy --program-id <PROGRAM_ID> backup/program.so
```

## 📞 **Support**

### Issues
- GitHub Issues for bug reports
- security@analos.io for security issues

### Documentation
- Program documentation in `/docs`
- IDL files in `/idl`
- Tests in `/tests`

---

**⚠️ Important**: Always test on devnet before mainnet deployment. Keep backup keys secure and never share private keys.