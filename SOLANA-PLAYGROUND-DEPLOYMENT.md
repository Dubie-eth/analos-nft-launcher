# Deploy Price Oracle via Solana Playground (5 Minutes)

## Step 1: Go to Solana Playground
https://beta.solpg.io

## Step 2: Create New Anchor Project
- Click "Create a new project"
- Choose "Anchor" 
- Name it "analos-price-oracle"

## Step 3: Replace lib.rs
Copy the entire contents from:
`programs/analos-price-oracle/src/lib.rs`

Paste into the Playground editor.

## Step 4: Update Anchor.toml in Playground
Find the `[programs.localnet]` section and change it to:
```toml
[programs.mainnet]
analos_price_oracle = "AaKR2YwrRFohmyUnWLhaVt43Ung6CgAeW43A119i94Vw"
```

## Step 5: Build (30 seconds)
- Click the "Build" button (🔨 icon)
- Wait for "Build successful" message

## Step 6: Download the .so file
- After build completes, the `.so` file will be available
- Download it from the file explorer

## Step 7: Deploy to Analos
On your local machine, run:
```bash
solana config set --url https://rpc.analos.io

solana program deploy analos_price_oracle.so \
  --program-id AaKR2YwrRFohmyUnWLhaVt43Ung6CgAeW43A119i94Vw \
  --keypair YOUR_DEPLOYER_KEYPAIR.json \
  --use-rpc
```

## Step 8: Test Initialization
Go back to your website and try initializing the price oracle!

---

**Why this works:**
- Solana Playground has all tools pre-configured
- Builds complete in seconds
- No local installation issues
- You've done this successfully before

