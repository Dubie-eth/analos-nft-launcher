# Deploy Price Oracle via Solana Playground (FASTEST METHOD)

## ✅ New Program ID: H1D51xLreqzot34KkeuA4K3hwAGM7w7PBhtTukBdtrx6

All source code has been updated with this ID!

## Step 1: Go to Solana Playground
https://beta.solpg.io

## Step 2: Create New Project
- Click "Create a new project"
- Choose "Anchor (Rust)" 
- Name it "analos-price-oracle"

## Step 3: Replace lib.rs
Delete the default code and paste the contents from:
`programs/analos-price-oracle/src/lib.rs`

The file already has the correct program ID:
```rust
declare_id!("H1D51xLreqzot34KkeuA4K3hwAGM7w7PBhtTukBdtrx6");
```

## Step 4: Update Anchor.toml
In Playground, find `Anchor.toml` and change to:
```toml
[programs.mainnet]
analos_price_oracle = "H1D51xLreqzot34KkeuA4K3hwAGM7w7PBhtTukBdtrx6"
```

## Step 5: Build (takes 30 seconds)
- Click the Build button (🔨 icon)
- Wait for "Build successful" message

## Step 6: Deploy
Two options:

### Option A: Direct Deploy from Playground
- Connect your wallet in Playground
- Select "Mainnet" or "Custom RPC" (https://rpc.analos.io)
- Click "Deploy"
- Confirm transaction

### Option B: Download and Deploy Locally
- After build, find the .so file in the file explorer
- Download it
- On your machine run:
```bash
solana config set --url https://rpc.analos.io

solana program deploy analos_price_oracle.so \
  --program-id H1D51xLreqzot34KkeuA4K3hwAGM7w7PBhtTukBdtrx6 \
  --keypair YOUR_DEPLOYER_KEYPAIR.json \
  --use-rpc
```

## Step 7: Initialize the Oracle
Go to https://www.onlyanal.fun and:
1. Connect your wallet
2. Go to Admin Panel
3. Find "Price Oracle Initializer"
4. Set market cap (e.g., $1,000,000)
5. Click "Initialize Price Oracle"

Done! 🎉

---

**Why this works:**
- Solana Playground has zero dependency issues
- Builds in 30 seconds
- You've successfully used this before
- All program IDs are already updated

