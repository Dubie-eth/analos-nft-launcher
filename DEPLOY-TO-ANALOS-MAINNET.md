# 🚀 Deploy Mega Launchpad to Analos Mainnet

## ⚠️ IMPORTANT: Solana Playground Deploys to Devnet by Default!

To deploy to **Analos mainnet**, you need to configure the RPC endpoint.

---

## 📋 Deployment Steps

### Step 1: Configure Analos RPC in Playground

**In Solana Playground:**
1. Click ⚙️ **Settings** icon (top-right)
2. Scroll to "Custom RPC Endpoint"
3. **IMPORTANT:** Enter: `https://rpc.analos.io`
4. Click "Save"
5. **Verify** it shows "Custom RPC" in the settings

### Step 2: Update Code with security.txt

The code is already updated with:
- ✅ security.txt with your contact info
- ✅ Program ID: `BioNVjtSmBSvsVG3Yqn5VHWGDrLD56AvqYhz1LZbWhdr`
- ✅ All security contacts

### Step 3: Copy Updated Code to Playground

1. **Copy ALL code** from `MEGA-NFT-LAUNCHPAD-CORE.rs`
2. In Solana Playground, **replace everything** in `src/lib.rs`
3. The code now has:
   - ✅ Correct program ID
   - ✅ security.txt embedded
   - ✅ All your contact info

### Step 4: Build

1. Click **"Build"** 🔨
2. Should compile successfully (same as before)
3. Check output for program ID: `BioNVjtSmBSvsVG3Yqn5VHWGDrLD56AvqYhz1LZbWhdr`

### Step 5: Connect Wallet for Analos

1. **Disconnect** current wallet
2. **Reconnect** wallet
3. **CRITICAL:** Make sure your wallet has:
   - ✅ LOS tokens (not SOL!)
   - ✅ At least 5-10 LOS for deployment
   - ✅ Connected to Analos network (RPC: https://rpc.analos.io)

**Check wallet on Analos:**
```bash
solana balance 86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW --url https://rpc.analos.io
```

### Step 6: Deploy to Analos

1. **Verify RPC is set** to https://rpc.analos.io
2. Click **"Deploy"** 🚀
3. Approve transaction in your wallet
4. **This will deploy to ANALOS MAINNET!**

### Step 7: Verify Deployment on Analos

**Check on Analos Explorer:**
```
https://explorer.analos.io/address/BioNVjtSmBSvsVG3Yqn5VHWGDrLD56AvqYhz1LZbWhdr
```

**Verify:**
- ✅ Program shows as "Executable"
- ✅ Owner: BPFLoaderUpgradeable
- ✅ Upgrade Authority: 86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW
- ✅ Network: Analos (not devnet!)

### Step 8: Export IDL

1. In Solana Playground, export IDL
2. Save as: `analos_nft_launchpad_core_mainnet.json`
3. This is your production IDL

---

## 🔐 Security.txt Verification

**Your program now has embedded security.txt:**

```
Contact: email:security@analos.io
Contact: twitter:@EWildn
Contact: telegram:t.me/Dubie_420
Policy: https://github.com/Dubie-eth/analos-nft-launcher/blob/master/SECURITY.md
Source Code: https://github.com/Dubie-eth/analos-nft-launcher
Source Revision: BioNVjtSmBSvsVG3Yqn5VHWGDrLD56AvqYhz1LZbWhdr
```

**Verify it's embedded:**
```bash
solana program show BioNVjtSmBSvsVG3Yqn5VHWGDrLD56AvqYhz1LZbWhdr --url https://rpc.analos.io
```

---

## ⚠️ CRITICAL CHECKLIST

Before deploying to mainnet:

- [ ] RPC set to `https://rpc.analos.io` ✓
- [ ] Wallet has enough LOS (5-10 LOS) 
- [ ] Wallet is `86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW`
- [ ] Code has security.txt ✓
- [ ] Program ID is correct ✓
- [ ] Understand this is MAINNET (real LOS, real money)

---

## 🆘 If Deployment Fails

### Error: "Insufficient Funds"
```bash
# Check LOS balance
solana balance 86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW --url https://rpc.analos.io

# Need at least 5 LOS
# Get more LOS from:
# - Exchange
# - Swap
# - Bridge
```

### Error: "RPC Error"
- Verify RPC is `https://rpc.analos.io`
- Try again (network might be busy)
- Check https://status.analos.io

### Error: "Program Already Deployed"
- This program ID exists on devnet
- On Analos mainnet it will be fresh
- Should work fine

---

## ✅ POST-DEPLOYMENT

### Verify on Analos Explorer:

1. Go to: https://explorer.analos.io
2. Paste: `BioNVjtSmBSvsVG3Yqn5VHWGDrLD56AvqYhz1LZbWhdr`
3. Should show:
   - ✅ Executable: Yes
   - ✅ Network: Analos (not devnet)
   - ✅ Upgrade Authority: Your wallet
   - ✅ Security.txt visible

### Initialize Platform:

```typescript
// FIRST TRANSACTION ON MAINNET
const program = new Program(
  idl,
  new PublicKey('BioNVjtSmBSvsVG3Yqn5VHWGDrLD56AvqYhz1LZbWhdr'),
  provider
);

const [platformConfig] = PublicKey.findProgramAddressSync(
  [Buffer.from('platform_config')],
  program.programId
);

const tx = await program.methods
  .initializePlatform()
  .accounts({
    platformConfig,
    admin: wallet.publicKey, // 86oK6fa5...
    systemProgram: SystemProgram.programId,
  })
  .rpc();

console.log('Platform initialized on Analos mainnet!', tx);
```

---

## 🎉 SUCCESS CRITERIA

**You'll know deployment to Analos succeeded when:**

1. ✅ Transaction confirms on Analos network
2. ✅ Program visible on https://explorer.analos.io
3. ✅ Can call `initialize_platform()` successfully
4. ✅ security.txt is embedded
5. ✅ Upgrade authority is your wallet

**Then you have a PRODUCTION-READY NFT launchpad on Analos mainnet!** 🚀

---

## 📝 DEPLOYMENT COMMAND (If using CLI)

```bash
# Alternative: Deploy via Solana CLI
solana program deploy \
  "C:\Users\dusti\Downloads\analos-mega-launchpad.so" \
  --program-id "C:\Users\dusti\Downloads\program-keypair (7).json" \
  --url https://rpc.analos.io \
  --keypair "C:\Users\dusti\.secure-keypairs\deployer-keypair.json"

# This deploys directly to Analos mainnet
```

**Playground is easier, but CLI gives you more control!**

