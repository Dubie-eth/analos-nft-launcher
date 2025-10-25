# 🎯 Analos Name Service (ANS) - Quick Start

## ✨ What You Have

**Analos Name Service (ANS)** - A professional, SNS-style username registry for Analos blockchain!

---

## 🚀 Deploy in 3 Steps

### **STEP 1: Open Solana Playground**
Go to: **https://beta.solpg.io/**

### **STEP 2: Copy Code**
Open `programs/analos-name-service/src/lib.rs` in this repo and copy the entire file into Playground's `lib.rs`

### **STEP 3: Build & Deploy**
1. Click **Build** button
2. Click **Deploy** (Devnet first)
3. Copy the Program ID
4. Download IDL and binary

---

## 📁 Files Ready for You

```
programs/analos-name-service/
├── src/lib.rs          ← Copy this to Playground!
├── Cargo.toml          ← Package config
├── Anchor.toml         ← Anchor config
└── README.md           ← Full documentation
```

---

## 📖 Full Guides

- **Playground Deployment**: `SOLANA-PLAYGROUND-DEPLOYMENT.md` (step-by-step with screenshots)
- **Program Documentation**: `programs/analos-name-service/README.md` (technical details)

---

## 🎯 What ANS Does

✅ **On-chain username registry** (like SNS for Solana)  
✅ **Blockchain-enforced uniqueness** (impossible to duplicate)  
✅ **Atomic registration** (username + NFT in one transaction)  
✅ **PDA-based lookups** (instant verification)  
✅ **Transferable** (trade usernames later)

---

## 💡 Key Features

### **Username Rules:**
- 3-20 characters
- Alphanumeric + underscore
- Must start with letter
- Case-insensitive

### **PDA Seeds:**
- Profile: `[b"profile", wallet_pubkey]`
- Username: `[b"username", username_bytes]`

### **Instructions:**
1. `register_profile` - Register username + create profile
2. `update_profile` - Update Los Bros or tier
3. `burn_profile` - Release username
4. `transfer_username` - Trade username

---

## 🔗 After Deployment

1. **Get Program ID** from Playground
2. **Deploy to Analos**:
   ```bash
   solana config set --url https://rpc.analos.io
   solana program deploy ./analos_name_service.so
   ```
3. **Update Your Code**:
   ```typescript
   export const ANS_PROGRAM_ID = new PublicKey('YOUR_PROGRAM_ID_HERE');
   ```

---

## 💰 Costs

- **Deployment**: ~8-10 SOL (one-time)
- **Registration**: ~0.004 SOL (rent, reclaimable)
- **Updates**: ~0.00001 SOL (transaction fee)

---

## 🎨 Integration Example

```typescript
// Find PDAs
const [profilePDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("profile"), wallet.toBuffer()],
  ANS_PROGRAM_ID
);

const [usernamePDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("username"), Buffer.from("myusername")],
  ANS_PROGRAM_ID
);

// Register username
await program.methods
  .registerProfile("myusername", profileNftMint, null, 1)
  .accounts({
    userWallet: wallet.publicKey,
    profileRegistry: profilePDA,
    usernameRegistry: usernamePDA,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

---

## 🌟 Why "ANS" is Perfect

✅ **Professional** (follows industry standard like SNS, ENS)  
✅ **Memorable** (ANS = Analos Name Service)  
✅ **Scalable** (can add features later)  
✅ **Clear** (instantly understood purpose)

---

## 📞 Resources

- **Solana Playground**: https://beta.solpg.io/
- **Analos RPC**: https://docs.analos.io/developers/rpc
- **Anchor Docs**: https://www.anchor-lang.com/

---

## 🎉 Ready to Deploy!

Everything is set up for you. Just:
1. Open Solana Playground
2. Copy `programs/analos-name-service/src/lib.rs`
3. Build & Deploy
4. Get your Program ID

**Your username system is ready to go live!** 🚀✨

---

**Built with ❤️ for Analos**

