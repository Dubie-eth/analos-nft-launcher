# 🛠️ Command Reference - Analos NFT Launchpad

Complete reference of all commands for building, testing, deploying, and managing your NFT launchpad.

## 🚀 Quick Start Commands

```bash
# Clone/navigate to project
cd analos-nft-launchpad

# Run quick setup (checks environment, installs deps, builds, tests)
chmod +x scripts/quickstart.sh
./scripts/quickstart.sh

# Generate Analos wallet
solana-keygen new --outfile ~/.config/analos/id.json

# Configure Solana CLI for Analos
solana config set --url https://rpc.analos.io
solana config set --keypair ~/.config/analos/id.json

# Check balance
solana balance
```

## 🔨 Build Commands

```bash
# Build Anchor program
anchor build

# Build for specific cluster
anchor build --provider.cluster mainnet

# Clean build
anchor clean && anchor build

# Build with verbose output
anchor build -v

# Check program size
ls -lh target/deploy/analos_nft_launchpad.so
```

## 🧪 Testing Commands

```bash
# Run all tests (local validator)
anchor test

# Run tests with existing validator
anchor test --skip-local-validator

# Run specific test file
anchor test tests/analos-nft-launchpad.ts

# Run with logs enabled
ANCHOR_LOG=true anchor test

# Skip build before testing
anchor test --skip-build

# Run TypeScript tests only
npm test
```

## 📦 Deployment Commands

### Automated Deployment
```bash
# Full deployment (recommended)
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### Manual Deployment Steps
```bash
# 1. Build program
anchor build --provider.cluster mainnet

# 2. Deploy to Analos
anchor deploy \
  --provider.cluster mainnet \
  --provider.url https://rpc.analos.io \
  --provider.wallet ~/.config/analos/id.json

# 3. Get program ID
solana-keygen pubkey target/deploy/analos_nft_launchpad-keypair.json

# 4. Update program ID in code
# Edit Anchor.toml and lib.rs with new program ID

# 5. Rebuild with updated ID
anchor build --provider.cluster mainnet

# 6. Redeploy
anchor deploy --provider.cluster mainnet

# 7. Initialize IDL
anchor idl init <PROGRAM_ID> \
  --provider.cluster mainnet \
  --provider.url https://rpc.analos.io \
  --filepath target/idl/analos_nft_launchpad.json
```

## 🎨 Collection Management

### Initialize Collection
```bash
# Run initialization script
ts-node scripts/initialize-collection.ts

# Or manually with Anchor
anchor run initialize-collection
```

### Mint NFTs
```bash
# Mint via TypeScript (example)
ts-node -e "
const anchor = require('@coral-xyz/anchor');
// ... mint logic
"

# Or use frontend UI
npm run dev
```

### Reveal Collection
```bash
# Check if threshold met
anchor run check-threshold

# Trigger reveal
ts-node scripts/reveal-collection.ts

# Or manually
anchor run reveal-collection
```

### Admin Functions
```bash
# Pause minting
anchor run pause-collection

# Unpause minting
anchor run unpause-collection

# Update mint price (in lamports)
anchor run update-price -- --new-price 200000000

# Withdraw funds (in lamports)
anchor run withdraw-funds -- --amount 10000000000

# Force reveal (if threshold met)
anchor run force-reveal
```

## 🔍 Verification & Monitoring

### Check Program
```bash
# Get program info
solana program show <PROGRAM_ID> --url https://rpc.analos.io

# Get program data size
solana program dump <PROGRAM_ID> program.so --url https://rpc.analos.io
ls -lh program.so

# Verify deployment
solana account <PROGRAM_ID> --url https://rpc.analos.io --output json
```

### Monitor Collection
```bash
# View collection config account
solana account <COLLECTION_CONFIG_PDA> --url https://rpc.analos.io

# Watch program logs (real-time)
solana logs <PROGRAM_ID> --url https://rpc.analos.io

# Get recent transactions
solana transaction-history <COLLECTION_CONFIG_PDA> \
  --url https://rpc.analos.io

# Check Merkle tree account
solana account <MERKLE_TREE_PUBKEY> --url https://rpc.analos.io
```

### Fetch Collection Stats
```typescript
// Using Anchor
const config = await program.account.collectionConfig.fetch(configPDA);
console.log({
  currentSupply: config.currentSupply.toNumber(),
  maxSupply: config.maxSupply.toNumber(),
  isRevealed: config.isRevealed,
  isPaused: config.isPaused,
});
```

## 🎭 Metadata Management

### Generate Metadata
```bash
# Generate all metadata files
ts-node app/metadata-generator.ts

# Output will be in metadata/ directory
ls -la metadata/placeholder/
ls -la metadata/revealed/
```

### Upload to IPFS (Pinata)
```bash
# Install Pinata CLI
npm install -g @pinata/cli

# Login
pinata login

# Upload placeholder
pinata upload metadata/placeholder/mystery-box.json

# Upload revealed metadata
pinata upload metadata/revealed/

# Get URIs
pinata list
```

### Upload to Arweave (Bundlr)
```bash
# Install Bundlr CLI
npm install -g @bundlr-network/client

# Fund Bundlr
bundlr fund 1000000000 --wallet ~/.config/analos/id.json

# Upload files
bundlr upload metadata/placeholder/mystery-box.json \
  --wallet ~/.config/analos/id.json

# Batch upload
bundlr upload-dir metadata/revealed/ \
  --wallet ~/.config/analos/id.json
```

## 🎯 IDL Management

```bash
# Initialize IDL
anchor idl init <PROGRAM_ID> \
  --provider.cluster mainnet \
  --provider.url https://rpc.analos.io \
  --filepath target/idl/analos_nft_launchpad.json

# Update IDL
anchor idl upgrade <PROGRAM_ID> \
  --provider.cluster mainnet \
  --provider.url https://rpc.analos.io \
  --filepath target/idl/analos_nft_launchpad.json

# Fetch IDL
anchor idl fetch <PROGRAM_ID> \
  --provider.cluster mainnet \
  --provider.url https://rpc.analos.io

# Close IDL account (recover rent)
anchor idl close <PROGRAM_ID> \
  --provider.cluster mainnet \
  --provider.url https://rpc.analos.io
```

## 💻 Frontend Commands

### Development
```bash
# Install dependencies
npm install

# Start development server (Next.js)
npm run dev

# Start with specific port
npm run dev -- -p 3001

# Build for production
npm run build

# Preview production build
npm run start
```

### Deploy Frontend

#### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

#### GitHub Pages
```bash
# Build static site
npm run build

# Deploy to gh-pages
npm run deploy
```

## 🔐 Wallet Commands

```bash
# Generate new wallet
solana-keygen new --outfile ~/.config/analos/id.json

# Recover from seed phrase
solana-keygen recover --outfile ~/.config/analos/id.json

# Get public key
solana-keygen pubkey ~/.config/analos/id.json

# Verify keypair
solana-keygen verify <PUBKEY> ~/.config/analos/id.json

# Check balance
solana balance --url https://rpc.analos.io

# Airdrop (devnet only)
solana airdrop 2 --url https://api.devnet.solana.com
```

## 💰 Fund Management

```bash
# Transfer LOS
solana transfer <RECIPIENT> <AMOUNT> \
  --url https://rpc.analos.io \
  --keypair ~/.config/analos/id.json

# Check transaction
solana confirm <SIGNATURE> --url https://rpc.analos.io

# Get transaction details
solana transaction <SIGNATURE> \
  --url https://rpc.analos.io \
  --output json
```

## 🐛 Debugging Commands

```bash
# View detailed program logs
RUST_LOG=debug anchor test

# Dump program to binary
solana program dump <PROGRAM_ID> dump.so \
  --url https://rpc.analos.io

# Decode transaction
solana transaction <SIGNATURE> \
  --url https://rpc.analos.io \
  --output json-compact

# Simulate transaction
solana transfer <RECIPIENT> <AMOUNT> --simulate \
  --url https://rpc.analos.io

# Check RPC health
curl https://rpc.analos.io -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1, "method":"getHealth"}'
```

## 📊 Analytics Commands

```bash
# Get transaction count
solana transaction-count --url https://rpc.analos.io

# Get slot
solana slot --url https://rpc.analos.io

# Get block time
solana block-time <SLOT> --url https://rpc.analos.io

# Get cluster info
solana cluster-version --url https://rpc.analos.io

# Get performance samples
solana ping --url https://rpc.analos.io --count 10
```

## 🔄 Upgrade & Maintenance

```bash
# Upgrade program (deploy new version)
anchor upgrade <PROGRAM_ID> \
  target/deploy/analos_nft_launchpad.so \
  --provider.cluster mainnet \
  --provider.url https://rpc.analos.io

# Set new upgrade authority
solana program set-upgrade-authority <PROGRAM_ID> \
  --new-upgrade-authority <NEW_AUTHORITY> \
  --url https://rpc.analos.io

# Make program immutable
solana program set-upgrade-authority <PROGRAM_ID> \
  --final \
  --url https://rpc.analos.io

# Close program (recover rent - irreversible!)
solana program close <PROGRAM_ID> \
  --url https://rpc.analos.io
```

## 📝 Utility Commands

```bash
# Format code
cargo fmt

# Lint Rust code
cargo clippy --all-targets --all-features

# Format TypeScript
npm run lint:fix

# Generate documentation
cargo doc --open

# Count lines of code
find programs/ -name '*.rs' | xargs wc -l

# Check project size
du -sh .

# Clean all build artifacts
cargo clean && rm -rf target/ node_modules/
```

## 🎓 Learning & Help

```bash
# Anchor help
anchor --help

# Solana CLI help
solana --help

# Get help for specific command
anchor deploy --help
solana program --help

# View Anchor version
anchor --version

# View Solana version
solana --version

# Check Rust version
rustc --version
cargo --version
```

## 🌐 Analos-Specific

```bash
# Set custom RPC
export ANALOS_RPC="https://rpc.analos.io"
solana config set --url $ANALOS_RPC

# Check Analos explorer
open "https://explorer.analos.io/address/<PROGRAM_ID>"

# Verify Analos network
solana cluster-version --url https://rpc.analos.io

# Get Analos epoch info
solana epoch-info --url https://rpc.analos.io
```

## 📋 Common Workflows

### Full Deployment Flow
```bash
./scripts/quickstart.sh              # Setup
anchor build --provider.cluster mainnet
./scripts/deploy.sh                  # Deploy
ts-node scripts/initialize-collection.ts
npm run build                        # Frontend
vercel --prod                        # Deploy UI
```

### Testing Flow
```bash
anchor build
anchor test
npm test
ANCHOR_LOG=true anchor test
```

### Maintenance Flow
```bash
solana logs <PROGRAM_ID>            # Monitor
anchor run check-collection-stats    # Stats
anchor run withdraw-funds            # Withdraw
```

---

**Tip**: Save frequently used commands as shell aliases:
```bash
# Add to ~/.bashrc or ~/.zshrc
alias analos-deploy='cd ~/analos-nft-launchpad && ./scripts/deploy.sh'
alias analos-test='cd ~/analos-nft-launchpad && anchor test'
alias analos-logs='solana logs <PROGRAM_ID> --url https://rpc.analos.io'
```

