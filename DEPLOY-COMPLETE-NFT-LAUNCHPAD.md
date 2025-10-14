# 🚀 Deploy COMPLETE NFT Launchpad - Step by Step

## 🎯 What You're Deploying

**COMPLETE-NFT-LAUNCHPAD.rs** with full integration:
- ✅ NFT tracking with NftRecord PDAs
- ✅ Rarity Oracle integration
- ✅ Token Launch integration
- ✅ Burn/buyback mechanism
- ✅ Complete NFT→Rarity→Token flow

---

## 📋 Option 1: Solana Playground Deployment (Recommended)

### Step 1: Prepare the Code

1. Open `COMPLETE-NFT-LAUNCHPAD.rs`
2. **Copy the ENTIRE contents** (all 700+ lines)
3. The program ID is currently: `AoWUv3isoKUFbcoBCSWPoTEJhUVP1TPyXgmYuMUxkA7h`

### Step 2: Open Solana Playground

1. Go to: https://beta.solpg.io
2. **IF** you still have your previous project:
   - Open it
   - Skip to Step 3
3. **IF** starting fresh:
   - Click "Create a new project"
   - Select "Anchor"
   - Name it: `analos-nft-launchpad-complete`

### Step 3: Replace Code

1. In Solana Playground, open `src/lib.rs`
2. **DELETE ALL** existing code
3. **PASTE** the complete code from `COMPLETE-NFT-LAUNCHPAD.rs`
4. The `declare_id!` should show: `AoWUv3isoKUFbcoBCSWPoTEJhUVP1TPyXgmYuMUxkA7h`

### Step 4: Build

1. Click **"Build"** (hammer icon) in Solana Playground
2. Wait for build to complete (~30-60 seconds)
3. Check for any errors
4. If build succeeds, you'll see: "Build successful ✅"

### Step 5: Configure Analos RPC

1. Click ⚙️ **Settings** icon
2. Find "Custom RPC Endpoint"
3. Enter: `https://rpc.analos.io`
4. Click "Save"

### Step 6: Connect Wallet

1. Click "Connect Wallet" (top-right)
2. Select your wallet (Phantom, Solflare, etc.)
3. Approve the connection
4. **IMPORTANT**: Make sure this is the SAME wallet that deployed the original program
   - The upgrade authority must match!

### Step 7: Check if Upgradeable

```bash
# Check if program is upgradeable
solana program show AoWUv3isoKUFbcoBCSWPoTEJhUVP1TPyXgmYuMUxkA7h \
  --url https://rpc.analos.io

# Look for:
# - "ProgramData Address": If present, it's upgradeable
# - "Upgrade Authority": Should show your wallet address
```

### Step 8: Deploy (Upgrade)

**IF PROGRAM IS UPGRADEABLE:**

1. In Solana Playground, click **"Deploy"** (rocket icon)
2. Approve the transaction in your wallet
3. Wait for confirmation (~30-60 seconds)
4. You'll see: "Program deployed successfully!"

**IF PROGRAM IS NOT UPGRADEABLE:**

You'll need to deploy as a NEW program:

1. In the code, change line 9:
   ```rust
   // OLD:
   declare_id!("AoWUv3isoKUFbcoBCSWPoTEJhUVP1TPyXgmYuMUxkA7h");
   
   // NEW:
   declare_id!("11111111111111111111111111111111");
   ```

2. Click **"Build"** to get new program ID
3. Copy the new program ID from build output
4. Update `declare_id!` with the new ID
5. Click **"Build"** again
6. Click **"Deploy"**
7. **SAVE THE NEW PROGRAM ID!**

### Step 9: Export IDL

1. In Solana Playground, find the IDL tab or export option
2. Download/copy the IDL JSON
3. Save it as: `analos_nft_launchpad_complete.json`

### Step 10: Verify Deployment

```bash
# Check program is deployed
solana program show [YOUR_PROGRAM_ID] --url https://rpc.analos.io

# Should show:
# - Executable: Yes
# - Owner: BPFLoaderUpgradeable
# - Data Length: [size]
```

---

## 📋 Option 2: Local Build & Deploy

### Prerequisites

```bash
# Ensure Anchor is installed
anchor --version  # Should be 0.29.0

# Ensure Solana CLI is configured for Analos
solana config set --url https://rpc.analos.io
```

### Step 1: Create Program Directory

```bash
cd ~/analos-nft-launchpad/programs
mkdir -p analos-nft-launchpad-complete/src
cd analos-nft-launchpad-complete
```

### Step 2: Copy Files

```bash
# Copy the complete code
cp ../../COMPLETE-NFT-LAUNCHPAD.rs ./src/lib.rs

# Create Cargo.toml
cat > Cargo.toml << 'EOF'
[package]
name = "analos-nft-launchpad-complete"
version = "1.0.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "analos_nft_launchpad"

[features]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
cpi = ["no-entrypoint"]
default = []

[dependencies]
anchor-lang = "0.29.0"
anchor-spl = "0.29.0"
EOF
```

### Step 3: Update Anchor.toml

```bash
cd ~/analos-nft-launchpad

# Add to Anchor.toml under [programs.localnet]
[programs.localnet]
analos_nft_launchpad = "AoWUv3isoKUFbcoBCSWPoTEJhUVP1TPyXgmYuMUxkA7h"
```

### Step 4: Build

```bash
anchor build -p analos-nft-launchpad-complete
```

### Step 5: Deploy/Upgrade

**IF PROGRAM IS UPGRADEABLE:**

```bash
anchor upgrade \
  target/deploy/analos_nft_launchpad.so \
  --program-id AoWUv3isoKUFbcoBCSWPoTEJhUVP1TPyXgmYuMUxkA7h \
  --provider.cluster https://rpc.analos.io
```

**IF DEPLOYING NEW:**

```bash
anchor deploy \
  --provider.cluster https://rpc.analos.io \
  --program-name analos_nft_launchpad
```

### Step 6: Generate IDL

```bash
anchor idl init \
  --filepath target/idl/analos_nft_launchpad.json \
  AoWUv3isoKUFbcoBCSWPoTEJhUVP1TPyXgmYuMUxkA7h \
  --provider.cluster https://rpc.analos.io
```

---

## 🔍 Post-Deployment Verification

### Check Program Exists

```bash
solana program show AoWUv3isoKUFbcoBCSWPoTEJhUVP1TPyXgmYuMUxkA7h \
  --url https://rpc.analos.io
```

### View on Explorer

https://explorer.analos.io/address/AoWUv3isoKUFbcoBCSWPoTEJhUVP1TPyXgmYuMUxkA7h

### Test Basic Function

Try calling `get_nft_details()` (read-only, no tx needed):

```bash
# This will fail if NFT doesn't exist, but proves program is callable
solana program show AoWUv3isoKUFbcoBCSWPoTEJhUVP1TPyXgmYuMUxkA7h \
  --url https://rpc.analos.io
```

---

## 📝 Update Frontend Config

### Step 1: Update Program ID (if new)

If you deployed as a NEW program, update:

`minimal-repo/src/config/analos-programs.ts`:
```typescript
export const ANALOS_PROGRAMS = {
  // ... other programs
  NFT_LAUNCHPAD: new PublicKey('YOUR_NEW_PROGRAM_ID'),
};
```

### Step 2: Copy IDL File

```bash
# Copy the IDL to frontend
cp analos_nft_launchpad_complete.json \
  minimal-repo/src/idl/analos_nft_launchpad.json
```

### Step 3: Commit Changes

```bash
cd minimal-repo
git add src/idl/analos_nft_launchpad.json
git add src/config/analos-programs.ts  # If program ID changed
git commit -m "✅ Update NFT Launchpad with complete integration"
git push origin master
```

---

## 🔗 Update Other Programs

### Rarity Oracle

Update to call `set_nft_rarity()` after determining rarity:

```rust
// In Rarity Oracle after determining rarity
let cpi_program = ctx.accounts.nft_launchpad_program.to_account_info();
let cpi_accounts = SetNftRarity {
    nft_record: ctx.accounts.nft_record.to_account_info(),
    collection_config: ctx.accounts.collection_config.to_account_info(),
    rarity_oracle_authority: ctx.accounts.authority.to_account_info(),
};
let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
nft_launchpad::set_nft_rarity(cpi_ctx, rarity_tier, rarity_multiplier)?;
```

### Token Launch

Update to call `mark_tokens_claimed()` after distributing:

```rust
// In Token Launch after transferring tokens
let cpi_program = ctx.accounts.nft_launchpad_program.to_account_info();
let cpi_accounts = MarkTokensClaimed {
    nft_record: ctx.accounts.nft_record.to_account_info(),
    token_launch_authority: ctx.accounts.authority.to_account_info(),
};
let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
nft_launchpad::mark_tokens_claimed(cpi_ctx)?;
```

---

## 🎉 Success Checklist

After deployment:

- [ ] Program deployed successfully
- [ ] Program shows as executable on explorer
- [ ] IDL exported and saved
- [ ] Frontend config updated
- [ ] Changes committed to GitHub
- [ ] Vercel deployment triggered
- [ ] Rarity Oracle updated for CPI calls
- [ ] Token Launch updated for CPI calls
- [ ] Test complete flow: mint → register → reveal → rarity → tokens

---

## 🆘 Troubleshooting

### Build Fails

**Error**: "InitSpace not found"
- Make sure you're using Anchor 0.29.0+
- `anchor --version`
- Update if needed: `cargo install --git https://github.com/coral-xyz/anchor --tag v0.29.0 anchor-cli`

### Deploy Fails: "Unauthorized"

- Check wallet has upgrade authority
- `solana program show [PROGRAM_ID] | grep "Upgrade Authority"`
- If wrong wallet, cannot upgrade

### RPC Errors

- Try again - Analos RPC might be busy
- Check RPC is responding: `curl https://rpc.analos.io -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'`

---

## 📞 Need Help?

1. Check build logs in Solana Playground
2. Verify wallet has enough LOS (~2-3 LOS for deployment)
3. Confirm RPC endpoint is correct
4. Check program ID matches in all files

**You're deploying the COMPLETE NFT Launchpad that actually ties everything together!** 🚀

