# 🚀 STREAMFLOW-INSPIRED PROGRAMS DEPLOYMENT GUIDE

## 📊 PROGRAM STATUS

### ✅ DEPLOYED (1/5):
| Program | Status | Analos ID | Devnet ID |
|---------|--------|-----------|-----------|
| **Metadata** | ✅ LIVE | `8ESkxgw28xsZgbeaTbVngduUk3zzWGMwccmUaSjSLYUL` | `6eAebmkAjU4Cv25xpoiXDtyCBELdJrpNRCUUZhuqEu5f` |

### ⏳ TO DEPLOY (4/5):
| Program | Status | Files Ready | Purpose |
|---------|--------|-------------|---------|
| **Vesting** | 📝 Ready | ✅ | Token vesting schedules |
| **Token Lock** | 📝 Ready | ✅ | Time-locked token escrow |
| **Airdrop** | 📝 Ready | ✅ | Batch token distributions |
| **OTC Marketplace** | 📝 Ready | ✅ | P2P token swaps |

---

## 📁 FILE LOCATIONS

All Playground-ready files are in: `C:\Users\dusti\OneDrive\Desktop\anal404s\`

### **1. Metadata Program** ✅ DEPLOYED
- `METADATA-SIMPLE.rs` (lib.rs)
- `METADATA-Cargo.toml`
- **Analos ID:** `8ESkxgw28xsZgbeaTbVngduUk3zzWGMwccmUaSjSLYUL`

### **2. Vesting Program** 📝 Ready
- `VESTING-SIMPLE.rs` (lib.rs)
- `VESTING-Cargo.toml`

### **3. Token Lock Program** 📝 Ready
- `LOCK-SIMPLE.rs` (lib.rs)
- `LOCK-Cargo.toml`

### **4. Airdrop Program** 📝 Ready
- `AIRDROP-SIMPLE.rs` (lib.rs)
- `AIRDROP-Cargo.toml`

### **5. OTC Marketplace Program** 📝 Ready
- `OTC-SIMPLE.rs` (lib.rs)
- `OTC-Cargo.toml`

---

## 🎯 DEPLOYMENT STEPS FOR EACH PROGRAM

### **IMPORTANT: Use This Exact Process (It Works!)**

We successfully deployed Metadata using this method. Repeat for each remaining program:

---

### **STEP 1: Open Solana Playground**
```
https://beta.solpg.io
```

---

### **STEP 2: Create New Anchor Project**
1. Click **"+"** (Create new project)
2. Select **"Anchor"** framework
3. Name it: `analos-[program-name]`
   - Example: `analos-vesting`, `analos-token-lock`, etc.

---

### **STEP 3: Copy Program Files**

**For lib.rs:**
1. Open `src/lib.rs` in Playground
2. Delete all existing code
3. Copy from the corresponding `-SIMPLE.rs` file
4. Paste into Playground
5. Save (Ctrl+S)

**For Cargo.toml:**
1. Open `Cargo.toml` in Playground (at root level)
2. Delete all existing code
3. Copy from the corresponding `-Cargo.toml` file
4. Paste into Playground
5. Save (Ctrl+S)

---

### **STEP 4: Build on Devnet**

**Connect to Devnet:**
1. Bottom left: Select **"Devnet"**
2. Click **wallet icon**
3. Connect your wallet
4. Get SOL: `solana airdrop 2` (if needed)

**Build:**
```bash
build
```

Wait for success message (~30-60 seconds)

---

### **STEP 5: Deploy to Devnet**

```bash
deploy
```

**✅ Note the Program ID!** Example:
```
Program Id: 7jK9mNpQrXyZv4Lb2RsH3wF8dT6cX5nM9pQ1rS2tU3vW
```

---

### **STEP 6: Download from Devnet**

**In PowerShell on your PC:**

```powershell
cd C:\Users\dusti\OneDrive\Desktop\anal404s

# Set to Devnet
solana config set --url https://api.devnet.solana.com

# Download the program (replace DEVNET_PROGRAM_ID)
solana program dump DEVNET_PROGRAM_ID analos-[program-name].so
```

**Example for Vesting:**
```powershell
solana program dump 7jK9mNpQrXyZv4Lb2RsH3wF8dT6cX5nM9pQ1rS2tU3vW analos-vesting.so
```

---

### **STEP 7: Generate Analos Keypair**

```powershell
solana-keygen new --no-bip39-passphrase -o analos-[program-name]-keypair.json
```

**✅ Note the Pubkey!** This is your Analos Program ID!

---

### **STEP 8: Deploy to Analos**

```powershell
# Switch to Analos
solana config set --url https://rpc.analos.io

# Deploy (use --use-rpc flag!)
solana program deploy --program-id analos-[program-name]-keypair.json --use-rpc analos-[program-name].so
```

---

### **STEP 9: Verify on Analos**

```powershell
solana program show ANALOS_PROGRAM_ID
```

You should see:
```
Program Id: [Your Program ID]
Owner: BPFLoaderUpgradeab1e11111111111111111111111
ProgramData Address: ...
Authority: ...
Balance: ~3.2 SOL
```

---

## 🎬 DEPLOYMENT CHECKLIST

Use this to track your progress:

### **Metadata** ✅
- [x] Build on Devnet
- [x] Deploy to Devnet
- [x] Download .so file
- [x] Generate Analos keypair
- [x] Deploy to Analos
- [x] Verify on Analos
- **Analos ID:** `8ESkxgw28xsZgbeaTbVngduUk3zzWGMwccmUaSjSLYUL`

### **Vesting** ⏳
- [ ] Build on Devnet
- [ ] Deploy to Devnet (note Devnet ID)
- [ ] Download .so file
- [ ] Generate Analos keypair (note Analos ID)
- [ ] Deploy to Analos with `--use-rpc`
- [ ] Verify on Analos
- **Analos ID:** `________________`

### **Token Lock** ⏳
- [ ] Build on Devnet
- [ ] Deploy to Devnet (note Devnet ID)
- [ ] Download .so file
- [ ] Generate Analos keypair (note Analos ID)
- [ ] Deploy to Analos with `--use-rpc`
- [ ] Verify on Analos
- **Analos ID:** `________________`

### **Airdrop** ⏳
- [ ] Build on Devnet
- [ ] Deploy to Devnet (note Devnet ID)
- [ ] Download .so file
- [ ] Generate Analos keypair (note Analos ID)
- [ ] Deploy to Analos with `--use-rpc`
- [ ] Verify on Analos
- **Analos ID:** `________________`

### **OTC Marketplace** ⏳
- [ ] Build on Devnet
- [ ] Deploy to Devnet (note Devnet ID)
- [ ] Download .so file
- [ ] Generate Analos keypair (note Analos ID)
- [ ] Deploy to Analos with `--use-rpc`
- [ ] Verify on Analos
- **Analos ID:** `________________`

---

## 💡 IMPORTANT TIPS

### **✅ DO:**
- Use `--use-rpc` flag when deploying to Analos
- Save all Program IDs immediately
- Test on Devnet first
- Keep keypair files safe

### **❌ DON'T:**
- Skip the `--use-rpc` flag (it will fail!)
- Forget to download from Devnet first
- Lose your keypair files
- Deploy without testing build

---

## 🚨 TROUBLESHOOTING

### **Build Error in Playground:**
- Check file names are correct
- Verify Cargo.toml has correct dependencies
- Try `rustfmt src/lib.rs` first

### **Deploy Fails to Analos:**
- **Did you use `--use-rpc`?** This is required!
- Check you have enough LOS in wallet
- Verify you're on Analos: `solana config get`

### **"Used HTTP Method is not allowed":**
- **You forgot `--use-rpc` flag!**
- Add it: `solana program deploy --use-rpc ...`

---

## 📊 FINAL PROGRAM ECOSYSTEM

Once all 5 are deployed, you'll have:

```
CORE PROGRAMS (Already Deployed):
├── NFT Launchpad: 5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT
├── Price Oracle: ztA5VFYMy29tgWpkAioro4HTfXQTgwpPinv9uSEdCMn
├── Rarity Oracle: H6sAs9Ewx6BNSF3NkPEEtwZo3kfFw4Y71us5U6D5rvW6
└── Token Launch: HLkjxfp8eonnKdLMoN7otZBHetRMoRaQmHvyDvGjnzVx

STREAMFLOW PROGRAMS (New):
├── Metadata: 8ESkxgw28xsZgbeaTbVngduUk3zzWGMwccmUaSjSLYUL ✅
├── Vesting: [To be deployed]
├── Token Lock: [To be deployed]
├── Airdrop: [To be deployed]
└── OTC Marketplace: [To be deployed]
```

**Total: 9 Programs on Analos!** 🎉

---

## 🔗 NEXT STEPS AFTER DEPLOYMENT

1. **Update Configuration Files**
   - Backend: `ANALOS-PROGRAMS-CONFIG.env`
   - Frontend: `analos-programs.ts`

2. **Create Integration Services**
   - Vesting service for backend
   - Token lock service for backend
   - Airdrop scheduler
   - OTC marketplace UI

3. **Test Everything**
   - Create vesting schedule
   - Lock tokens
   - Run airdrop
   - Create OTC offer

4. **Security Audit**
   - Review all program permissions
   - Test edge cases
   - Verify authority controls

---

## 📞 WHEN YOU'RE READY

Just tell me when you want to start deploying the remaining 4 programs! I'll guide you through each one step-by-step, just like we did with Metadata! 🚀

**Current Progress: 1/5 (20%) Complete**

