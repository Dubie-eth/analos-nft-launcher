# 🚀 Analos Name Service (ANS) - Complete Deployment Guide

## Current Status

✅ **Code is ready and optimized**  
❌ **Solana Playground API is down** (network timeouts)  
⏳ **Local build requires Solana SDK installation**

---

## 🎯 Option 1: Wait for Playground (Easiest)

Since the code is correct and Playground is just having API issues:

**Steps:**
1. Wait 30 minutes to 1 hour
2. Try Playground again: https://beta.solpg.io/
3. Copy code from `programs/analos-name-service/src/lib.rs`
4. Build & Deploy

---

## 🎯 Option 2: Local Build (Recommended for Production)

### **Prerequisites:**

```powershell
# 1. Install Rust (if not already)
# Download from: https://rustup.rs/

# 2. Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.26/install)"

# 3. Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.29.0
avm use 0.29.0

# 4. Install Solana BPF SDK
cargo install --git https://github.com/anza-xyz/platform-tools --bin cargo-build-sbf
```

### **Build:**

```powershell
cd C:\Users\dusti\OneDrive\Desktop\anal404s\analos-nft-launchpad
anchor build
```

###Human: lets just use vercel to build it and then we deploy the .so file
