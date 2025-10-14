# 🚀 Deploy NFT Launchpad to Analos via Solana Playground

## ⚠️ IMPORTANT: This is the Core Program
The NFT Launchpad creates `collection_config` PDAs that the Rarity Oracle depends on. **Deploy this before initializing Rarity Oracle!**

## 📋 Prerequisites
- Wallet with LOS tokens for deployment (~2-3 LOS)
- Access to https://beta.solpg.io
- Analos RPC endpoint: `https://rpc.analos.io`

## 🎯 Step-by-Step Deployment

### Step 1: Prepare Solana Playground
1. Go to https://beta.solpg.io
2. Click "Create a new project"
3. Select "Anchor" as the framework
4. Name it: `analos-nft-launchpad`

### Step 2: Copy the Program Code
1. Open the file: `programs/analos-nft-launchpad/lib-for-playground.rs`
2. **Copy the ENTIRE contents**
3. In Solana Playground, replace the contents of `src/lib.rs` with the copied code

### Step 3: First Build (Get Program ID)
1. In Solana Playground, click **"Build"** (hammer icon)
2. Wait for build to complete
3. Look for a message like: "Program ID: XxXxXxXx..."
4. **COPY THIS PROGRAM ID**

### Step 4: Update Program ID
1. In the code, find line 23:
   ```rust
   declare_id!("11111111111111111111111111111111");
   ```
2. Replace it with your actual program ID:
   ```rust
   declare_id!("YOUR_PROGRAM_ID_FROM_BUILD");
   ```
3. Click **"Build"** again to rebuild with correct ID

### Step 5: Configure Analos RPC
1. In Solana Playground, click the ⚙️ **Settings** icon
2. Find "Custom RPC Endpoint"
3. Enter: `https://rpc.analos.io`
4. Click "Save"

### Step 6: Connect Wallet
1. Click "Connect Wallet" in top-right
2. Select your wallet (Phantom, Solflare, etc.)
3. Approve the connection
4. **Verify you have at least 2-3 LOS for deployment**

### Step 7: Deploy!
1. Click **"Deploy"** (rocket icon)
2. Approve the transaction in your wallet
3. Wait for confirmation (30-60 seconds)
4. **SAVE THE PROGRAM ID FROM THE CONFIRMATION!**

### Step 8: Verify Deployment
1. Go to https://explorer.analos.io
2. Paste your program ID in the search
3. Verify the program is marked as "Executable"
4. Check that the owner is "BPFLoaderUpgradeable"

### Step 9: Export IDL
1. In Solana Playground, look for the "IDL" tab or export option
2. Download or copy the IDL JSON
3. Save it as: `analos-nft-launchpad-idl.json`

### Step 10: Update Frontend Config
1. Open: `minimal-repo/src/config/analos-programs.ts`
2. Add the NFT Launchpad program ID:
   ```typescript
   export const ANALOS_PROGRAMS = {
     // ... existing programs ...
     NFT_LAUNCHPAD: new PublicKey('YOUR_NFT_LAUNCHPAD_PROGRAM_ID'),
   };
   ```
3. Save and commit the changes

## 📊 Program Features

### Core Instructions:
1. **`initialize_collection`** - Create a new NFT collection
   - Sets max supply, mint price, reveal threshold
   - Creates collection config PDA
   - This is what Rarity Oracle needs!

2. **`mint_placeholder`** - Mint mystery box NFT
   - Users pay LOS to mint
   - Receives placeholder NFT
   - Index stored for later reveal

3. **`reveal_nft`** - Reveal final NFT metadata
   - Called after reveal threshold reached
   - Assigns actual metadata
   - Determines rarity tier

4. **`pause_collection`** - Emergency pause
   - Admin only
   - Stops new mints

5. **`resume_collection`** - Resume minting
   - Admin only
   - Re-enables mints

6. **`withdraw_funds`** - Claim proceeds
   - Admin only
   - Withdraws LOS from sales

## 🔍 Important Constants

```rust
pub const ROYALTY_BASIS_POINTS: u16 = 500;  // 5% royalties
```

## 📝 Collection Config PDA Seeds

The collection config PDA is derived using:
```rust
seeds = [b"collection_config", authority.key().as_ref()]
```

**This PDA is required for Rarity Oracle initialization!**

## ✅ Post-Deployment Checklist

- [ ] Program deployed successfully to Analos
- [ ] Program ID saved and backed up
- [ ] Program verified on Analos Explorer
- [ ] IDL exported and saved
- [ ] Frontend config updated with program ID
- [ ] Frontend changes committed to GitHub
- [ ] Vercel deployment triggered
- [ ] **Ready to initialize Rarity Oracle** (now has collection_config)

## 🔗 Dependencies

**Depends on:**
- Analos blockchain
- SPL Token Program
- System Program

**Required by:**
- 🎲 **Rarity Oracle** - Needs collection_config PDA
- 💰 Token Launch - Uses NFT mint data
- 🏪 OTC Marketplace - NFT trading

## 🚨 Security Notes

1. **Keep your deployer wallet secure** - It has upgrade authority
2. **The program is immutable after deployment** (unless upgradeable)
3. **Test on devnet first if possible**
4. **Authority key controls all admin functions**

## 🆘 Troubleshooting

### Build Fails
- Check for syntax errors
- Ensure all dependencies are available in Playground
- Try refreshing the page and rebuilding

### Deployment Fails
- Check wallet has enough LOS (need ~2-3 LOS)
- Verify RPC endpoint is set correctly
- Try again - network might be congested

### Program Not Showing on Explorer
- Wait 1-2 minutes for indexing
- Verify you're on Analos explorer, not Solana mainnet
- Check the transaction signature instead

## 📞 Need Help?

1. Check the deployment logs in Solana Playground
2. Verify RPC is responding: `https://rpc.analos.io`
3. Confirm wallet is connected to Analos network
4. Check GitHub issues for known problems

## 🎉 Success Criteria

You'll know deployment succeeded when:
1. ✅ Transaction confirms with signature
2. ✅ Program appears on Analos Explorer
3. ✅ Program marked as "Executable"
4. ✅ IDL generated successfully
5. ✅ Can call `initialize_collection` instruction

**Once deployed, you can initialize your first collection and then initialize the Rarity Oracle!**

