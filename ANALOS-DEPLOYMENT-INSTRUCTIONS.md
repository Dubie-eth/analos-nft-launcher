# 🚀 Deploy Mega Launchpad to Analos - Instructions

## 💰 Current Situation

**Wallet:** `4ea9ktn5Ngb3dUjBBKYe7n87iztyQht8MVxn6EBtEQ4q`  
**Balance on Analos:** 1.96 LOS  
**Needed for deployment:** ~5 LOS  
**Short by:** ~3 LOS

---

## ✅ Option 1: Add More LOS to Wallet (RECOMMENDED)

### Get ~3-5 more LOS:

1. **From Exchange** (if you have LOS)
2. **From another wallet** (transfer)
3. **Buy on Analos DEX**

**Then deploy:**
```bash
solana program deploy mega-launchpad-program.so \
  --program-id mega-launchpad-program-keypair.json \
  --url https://rpc.analos.io
```

---

## ✅ Option 2: Use Your Admin Wallet (BEST)

**Your Admin Wallet:** `86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW`

**Check if it has LOS:**
```bash
solana balance 86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW --url https://rpc.analos.io
```

**If it has LOS, use it to deploy:**
```bash
# Set default wallet to admin wallet
solana config set --keypair .secure-keypairs\deployer-keypair.json

# Deploy with admin wallet
solana program deploy mega-launchpad-program.so \
  --program-id mega-launchpad-program-keypair.json \
  --url https://rpc.analos.io

# This makes admin wallet the upgrade authority (which you want anyway!)
```

**Benefits:**
- ✅ Admin wallet becomes upgrade authority
- ✅ Matches the PLATFORM_ADMIN constant in code
- ✅ Complete control from day 1

---

## ✅ Option 3: Use Playground with Funded Wallet

1. **Add LOS to your Phantom/Solflare wallet**
2. **In Solana Playground:**
   - Set RPC: `https://rpc.analos.io`
   - Connect wallet with LOS
   - Click "Deploy"
   - **IMPORTANT:** Verify RPC is Analos before deploying!

---

## 📋 Recommended Deployment Flow

### Step 1: Check Admin Wallet Balance

```bash
solana balance 86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW --url https://rpc.analos.io
```

**If has 5+ LOS:** ✅ Use admin wallet (Option 2)  
**If low:** Get more LOS first

### Step 2: Set Keypair

```bash
solana config set --keypair .secure-keypairs\deployer-keypair.json
```

### Step 3: Verify Config

```bash
solana config get

# Should show:
# RPC URL: (any - we'll override with --url flag)
# WebSocket URL: (any)
# Keypair Path: .secure-keypairs\deployer-keypair.json
```

### Step 4: Deploy to Analos

```bash
solana program deploy mega-launchpad-program.so \
  --program-id mega-launchpad-program-keypair.json \
  --url https://rpc.analos.io \
  --with-compute-unit-price 1000

# --url https://rpc.analos.io ← CRITICAL: Deploys to Analos!
# --with-compute-unit-price 1000 ← Helps with congestion
```

### Step 5: Verify Deployment

```bash
# Check program on Analos
solana program show BioNVjtSmBSvsVG3Yqn5VHWGDrLD56AvqYhz1LZbWhdr --url https://rpc.analos.io

# Should show:
# Program Id: BioNVjtSmBSvsVG3Yqn5VHWGDrLD56AvqYhz1LZbWhdr
# Owner: BPFLoaderUpgradeable...
# Upgrade Authority: 86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW
# Data Length: [size]
# Executable: true
```

### Step 6: View on Explorer

```
https://explorer.analos.io/address/BioNVjtSmBSvsVG3Yqn5VHWGDrLD56AvqYhz1LZbWhdr
```

---

## 🔒 Security Checklist

- [ ] Using correct keypair (admin wallet or deployer)
- [ ] RPC URL is `https://rpc.analos.io` (not devnet!)
- [ ] Program ID matches: `BioNVjtSmBSvsVG3Yqn5VHWGDrLD56AvqYhz1LZbWhdr`
- [ ] Wallet has sufficient LOS (~5 LOS)
- [ ] security.txt embedded in program
- [ ] Backup program keypair file
- [ ] Understand this is mainnet (real money)

---

## 💡 Quick Solution

**If current wallet (4ea9...EQ4q) has 1.96 LOS:**

Need 3 more LOS options:
1. Transfer from another wallet
2. Buy on exchange
3. Use different wallet with more LOS

**OR use your admin wallet if it has LOS!**

---

## 🆘 Troubleshooting

### "Insufficient funds"
→ Add more LOS to wallet

### "unrecognized signer source"
→ Remove spaces from file paths (done ✓)

### "RPC error"
→ Verify --url https://rpc.analos.io

### "Program already exists"
→ Use --upgrade flag if upgrading

---

## ✅ Once Deployed

1. **Verify on explorer** (Analos, not devnet!)
2. **Initialize platform** with admin wallet
3. **Create test collection**
4. **Launch to production!**

**Ready to deploy once wallet is funded!** 🚀

