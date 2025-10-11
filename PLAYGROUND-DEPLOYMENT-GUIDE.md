# 🚀 **SOLANA PLAYGROUND DEPLOYMENT GUIDE**

## **Deploy All 4 Programs to Analos**

---

## 📋 **PROGRAMS & SIZES**

1. **analos-nft-launchpad** - 4,772 lines (Main program)
2. **analos-token-launch** - Token launch system
3. **analos-rarity-oracle** - Rarity calculation
4. **analos-price-oracle** - Price feeds

---

## 🎯 **DEPLOYMENT PROCESS**

### **Phase 1: Deploy to Devnet (Testing)**
### **Phase 2: Download Compiled .so Files**
### **Phase 3: Deploy to Analos**

---

## 🚀 **PROGRAM 1: analos-nft-launchpad**

### **Step 1: Open Solana Playground**
Go to: https://beta.solpg.io

### **Step 2: Setup**
1. Create new Anchor project (or use existing)
2. Make sure you're on **Devnet**
3. Ensure you have enough SOL (request airdrop if needed)

### **Step 3: Copy Program Code**
The program file is ready at:
`programs/analos-nft-launchpad/src/lib.rs`

**Copy the entire file contents to Playground's `lib.rs`**

### **Step 4: Update Cargo.toml in Playground**
```toml
[package]
name = "analos-nft-launchpad"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "analos_nft_launchpad"

[features]
no-entrypoint = []
no-idl = []
cpi = ["no-entrypoint"]
default = []

[dependencies]
anchor-lang = "0.28.0"
anchor-spl = "0.28.0"
mpl-token-metadata = "4.1.3"
```

### **Step 5: Build in Playground**
```bash
build
```

**Wait for build to complete (~30 seconds)**

### **Step 6: Deploy to Devnet**
```bash
deploy
```

**Copy the Program ID that appears!**
Example: `2DpzahxCmfQDt87wxHagAnBDa82MeCrZAr22Lhss7NMh`

### **Step 7: Download Compiled Program**
On your local machine:
```bash
solana program dump 2DpzahxCmfQDt87wxHagAnBDa82MeCrZAr22Lhss7NMh analos-nft-launchpad.so --url https://api.devnet.solana.com
```

---

## 🚀 **PROGRAM 2: analos-token-launch**

### **Repeat Same Process:**

1. **Open new Playground tab** or clear current project
2. **Copy** `programs/analos-token-launch/src/lib.rs`
3. **Update Cargo.toml**:
```toml
[package]
name = "analos-token-launch"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "analos_token_launch"

[dependencies]
anchor-lang = "0.28.0"
anchor-spl = "0.28.0"
```

4. **Build** → `build`
5. **Deploy** → `deploy`
6. **Copy Program ID**
7. **Download**: `solana program dump [PROGRAM_ID] analos-token-launch.so --url https://api.devnet.solana.com`

---

## 🚀 **PROGRAM 3: analos-rarity-oracle**

### **Repeat Same Process:**

1. **Open new Playground tab**
2. **Copy** `programs/analos-rarity-oracle/src/lib.rs`
3. **Update Cargo.toml**:
```toml
[package]
name = "analos-rarity-oracle"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "analos_rarity_oracle"

[dependencies]
anchor-lang = "0.28.0"
```

4. **Build** → `build`
5. **Deploy** → `deploy`
6. **Copy Program ID**
7. **Download**: `solana program dump [PROGRAM_ID] analos-rarity-oracle.so --url https://api.devnet.solana.com`

---

## 🚀 **PROGRAM 4: analos-price-oracle**

### **Repeat Same Process:**

1. **Open new Playground tab**
2. **Copy** `programs/analos-price-oracle/src/lib.rs`
3. **Update Cargo.toml**:
```toml
[package]
name = "analos-price-oracle"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "analos_price_oracle"

[dependencies]
anchor-lang = "0.28.0"
```

4. **Build** → `build`
5. **Deploy** → `deploy`
6. **Copy Program ID**
7. **Download**: `solana program dump [PROGRAM_ID] analos-price-oracle.so --url https://api.devnet.solana.com`

---

## 🎯 **PHASE 3: DEPLOY ALL TO ANALOS**

### **After you have all 4 .so files:**

```bash
# Deploy Program 1: Main NFT Launchpad
solana program deploy analos-nft-launchpad.so --use-rpc --url https://rpc.analos.io --keypair ~/.config/solana/id.json

# Deploy Program 2: Token Launch
solana program deploy analos-token-launch.so --use-rpc --url https://rpc.analos.io --keypair ~/.config/solana/id.json

# Deploy Program 3: Rarity Oracle
solana program deploy analos-rarity-oracle.so --use-rpc --url https://rpc.analos.io --keypair ~/.config/solana/id.json

# Deploy Program 4: Price Oracle
solana program deploy analos-price-oracle.so --use-rpc --url https://rpc.analos.io --keypair ~/.config/solana/id.json
```

### **Save All Program IDs:**
```
ANALOS_NFT_LAUNCHPAD_PROGRAM_ID=...
ANALOS_TOKEN_LAUNCH_PROGRAM_ID=...
ANALOS_RARITY_ORACLE_PROGRAM_ID=...
ANALOS_PRICE_ORACLE_PROGRAM_ID=...
```

---

## 📝 **TRACKING SHEET**

| Program | Devnet ID | .so Downloaded | Analos ID | Status |
|---------|-----------|----------------|-----------|--------|
| nft-launchpad | | ❌ | | ⏳ |
| token-launch | | ❌ | | ⏳ |
| rarity-oracle | | ❌ | | ⏳ |
| price-oracle | | ❌ | | ⏳ |

---

## ⚠️ **IMPORTANT NOTES**

### **Before Deploying:**
1. Make sure you have enough $LOS in your wallet (~5 $LOS per program)
2. Keep track of all Program IDs
3. Test each program on Devnet first

### **Common Issues:**
- **"Account already exists"** → Use `--upgrade` or new keypair
- **"Insufficient funds"** → Add more $LOS to wallet
- **"Connection refused"** → Make sure using `--use-rpc` flag

### **After Deployment:**
Update these files with new Program IDs:
- `LosLauncher/backend/.env`
- Railway environment variables
- Frontend configuration files

---

## 🎯 **READY TO START?**

1. Open Solana Playground: https://beta.solpg.io
2. Start with Program 1 (Main NFT Launchpad)
3. Follow steps above
4. Track your progress in the table

**Let me know when you're ready to start, and I'll guide you through each program!** 🚀
