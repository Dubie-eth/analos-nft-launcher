# 🎯 Solana Playground Walkthrough - DO THIS NOW

## Step 1: Open Solana Playground
Click this link: **https://beta.solpg.io**

You should see a code editor interface.

## Step 2: Create New Project
1. Click **"+ Create a new project"** (top left)
2. Select **"Anchor (Rust)"** 
3. Name it: **`analos-price-oracle`**
4. Click Create

You'll see some default Anchor code appear.

## Step 3: Replace lib.rs Code

1. In the file tree on the left, click on **`src/lib.rs`**
2. **Delete ALL the default code** (select all and delete)
3. **Copy this ENTIRE file from your project**:
   - Location: `programs/analos-price-oracle/src/lib.rs`
   - **OR** use the code I'm showing you below

The code already has the correct program ID on line 21:
```rust
declare_id!("H1D51xLreqzot34KkeuA4K3hwAGM7w7PBhtTukBdtrx6");
```

## Step 4: Update Cargo.toml (Dependencies)

In Playground's file tree, click on **`Cargo.toml`** and make sure it has:

```toml
[package]
name = "analos-price-oracle"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "analos_price_oracle"

[features]
no-entrypoint = []
no-idl = []
cpi = ["no-entrypoint"]
default = []

[dependencies]
anchor-lang = "0.28.0"
solana-security-txt = "1.1.1"
default-env = "0.1.1"
```

## Step 5: Update Anchor.toml

Click on **`Anchor.toml`** in the file tree and update it to:

```toml
[toolchain]
anchor_version = "0.29.0"

[features]
resolution = true
skip-lint = false

[programs.mainnet]
analos_price_oracle = "H1D51xLreqzot34KkeuA4K3hwAGM7w7PBhtTukBdtrx6"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "mainnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
```

## Step 6: Build the Program

1. Click the **Build** button (🔨 hammer icon) at the bottom left
2. You'll see build output in the terminal at the bottom
3. Wait for **"Build successful ✅"** message (takes ~30 seconds)

If you see any errors:
- Make sure you copied ALL the code from lib.rs
- Make sure Cargo.toml and Anchor.toml are correct
- Check that the program ID matches: `H1D51xLreqzot34KkeuA4K3hwAGM7w7PBhtTukBdtrx6`

## Step 7: Download the Binary

After successful build:
1. Look in the file explorer (left side)
2. Find **`target/deploy/analos_price_oracle.so`**
3. **Right-click** on it
4. Select **"Download"**
5. Save it to your Desktop (easy to find)

## Step 8: Deploy to Analos Blockchain

Open your terminal (Windows Terminal/PowerShell) and run:

```bash
# Navigate to where you saved the file
cd Desktop

# Set Solana to use Analos RPC
solana config set --url https://rpc.analos.io

# Check your balance (should show ~32 SOL)
solana balance

# Deploy the program
solana program deploy analos_price_oracle.so \
  --program-id H1D51xLreqzot34KkeuA4K3hwAGM7w7PBhtTukBdtrx6 \
  --keypair C:\Users\dusti\OneDrive\Desktop\anal404s\analos-nft-launchpad\price-oracle-program-id.json \
  --use-rpc
```

**Important:** Use the full path to your keypair file!

## Step 9: Verify Deployment

After deployment completes, check it:

```bash
solana program show H1D51xLreqzot34KkeuA4K3hwAGM7w7PBhtTukBdtrx6
```

You should see:
- Program Id: H1D51xLreqzot34KkeuA4K3hwAGM7w7PBhtTukBdtrx6
- Owner: BPFLoaderUpgradeab1e...
- ProgramData Address: ...
- Authority: (your wallet)
- Last Deployed Slot: ...
- Data Length: ...

## Step 10: Initialize the Oracle

1. Go to **https://www.onlyanal.fun**
2. **Connect your wallet** (top right)
3. Go to **Admin Panel**
4. Find **"Price Oracle Initializer"**
5. Enter market cap: **1000000** (for $1M)
6. Click **"Initialize Price Oracle"**
7. **Approve the transaction** in your wallet

You should see:
- ✅ Transaction successful
- Counter increments
- Oracle is initialized!

## 🎉 Done!

Your Price Oracle is now:
- ✅ Deployed to Analos blockchain
- ✅ Using correct program ID
- ✅ Ready to be initialized
- ✅ Fully functional for USD-pegged pricing

## 🔍 Verify on Explorer

Visit: https://explorer.analos.io/address/H1D51xLreqzot34KkeuA4K3hwAGM7w7PBhtTukBdtrx6

You should see your program with all transactions!

---

## 🆘 Troubleshooting

**Build fails in Playground:**
- Check that you copied the ENTIRE lib.rs file
- Make sure Cargo.toml has all dependencies
- Verify program ID matches everywhere

**Deploy fails:**
- Check you have enough SOL: `solana balance`
- Verify you're using the right keypair file
- Make sure RPC is set: `solana config get`

**Can't initialize:**
- Make sure you're connected to the right wallet
- Check program is deployed: `solana program show H1D51xLreqzot34KkeuA4K3hwAGM7w7PBhtTukBdtrx6`
- Verify you're on Analos network in your wallet

---

## 📝 Key Files Reference

- **Program source**: `programs/analos-price-oracle/src/lib.rs`
- **Keypair file**: `price-oracle-program-id.json` (project root)
- **Frontend config**: `minimal-repo/src/config/analos-programs.ts` (already updated!)
- **Program ID**: `H1D51xLreqzot34KkeuA4K3hwAGM7w7PBhtTukBdtrx6`

Everything is ready - just follow the steps above! 🚀

