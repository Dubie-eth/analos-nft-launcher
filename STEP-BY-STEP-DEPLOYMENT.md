# 🚀 **STEP-BY-STEP DEPLOYMENT GUIDE**

## **Deploy All 4 Programs to Analos - With Me!**

---

## 📋 **PROGRAM 1: analos-price-oracle**

### **Why Start Here?**
- Smallest program (308 lines)
- No dependencies on other programs
- Quick to build and test

---

### **STEP 1: Open Solana Playground**

1. Go to: **https://beta.solpg.io**
2. Click "**New Project**"
3. Select "**Anchor**"
4. Name it: `analos-price-oracle`

**✅ Tell me when you're ready and I'll give you the code!**

---

### **STEP 2: Switch to Devnet**

1. Look at the bottom-left of Playground
2. Click where it says "**Localnet**" or "**Mainnet**"
3. Select "**Devnet**"

**✅ Confirm you're on Devnet!**

---

### **STEP 3: Get Some SOL**

In the Playground terminal, type:
```bash
solana airdrop 2
```

Wait for confirmation, then check balance:
```bash
solana balance
```

You should see ~2 SOL.

**✅ Confirm you have SOL!**

---

### **STEP 4: Copy the Program Code**

I'll give you the complete code to paste. Replace everything in `lib.rs` with:

**[I'll provide the code when you're ready]**

**✅ Tell me when code is pasted!**

---

### **STEP 5: Build the Program**

In the Playground terminal, type:
```bash
build
```

Wait ~15-30 seconds for it to compile.

**Expected output:**
```
Build successful. Completed in XX.XXs.
```

**✅ Tell me if build succeeds!**

---

### **STEP 6: Deploy to Devnet**

In the Playground terminal, type:
```bash
deploy
```

Wait for deployment (~10-20 seconds).

**Expected output:**
```
Program Id: ABC123...XYZ789
```

**✅ COPY THAT PROGRAM ID AND SEND IT TO ME!**

---

### **STEP 7: Download the Compiled Program**

On your local computer (PowerShell), run:
```bash
solana program dump [PROGRAM_ID] analos-price-oracle.so --url https://api.devnet.solana.com
```

Replace `[PROGRAM_ID]` with the ID from step 6.

**✅ Confirm you have the .so file!**

---

### **STEP 8: Deploy to Analos**

On your local computer, run:
```bash
solana program deploy analos-price-oracle.so --use-rpc --url https://rpc.analos.io
```

**✅ COPY THE ANALOS PROGRAM ID AND SEND IT TO ME!**

---

## ✅ **PROGRAM 1 COMPLETE!**

**Progress: 1/4 programs deployed (25%)**

**Ready for Program 2?** 🚀

---

# 📋 **TRACKING YOUR PROGRESS**

| Program | Status | Devnet ID | Analos ID |
|---------|--------|-----------|-----------|
| 1. Price Oracle | ⏳ | | |
| 2. Rarity Oracle | ⏳ | | |
| 3. Token Launch | ⏳ | | |
| 4. NFT Launchpad | ⏳ | | |

---

**I'll update this as we go. Ready to start? Tell me when Playground is open!** 🎯
