# 🔗 ANALOS PROFILE REGISTRY PROGRAM

## ✅ SNS-Style Username System for Profile NFTs

Like Solana Name Service (SNS), this program provides **on-chain username uniqueness** and **collision prevention** for your Profile NFT platform!

---

## 🎯 **Why We Need This:**

### **Problem:**
- Database-only username checking can fail
- Race conditions during minting
- Usernames can be duplicated if database is down
- No blockchain-enforced uniqueness

### **Solution:**
- **On-chain username registry** (like SNS domains)
- **PDA-based lookups** (instant, always available)
- **Blockchain-enforced uniqueness** (impossible to duplicate)
- **No database dependency** for core functionality

---

## 🏗️ **Architecture:**

### **Two PDA Types:**

#### **1. Profile Registry PDA**
```
Seeds: [b"profile", wallet_pubkey]
```

Stores:
- Wallet address
- Username
- Profile NFT mint
- Los Bros NFT mint (optional)
- Tier
- Timestamps
- Active status

#### **2. Username Registry PDA**
```
Seeds: [b"username", username.lowercase()]
```

Stores:
- Username (lowercase)
- Current owner wallet
- Profile registry link
- Registration timestamp
- Availability status

---

## 📦 **Program Structure:**

### **Files Created:**
```
programs/analos-profile-registry/
├── Cargo.toml                    ← Rust dependencies
├── src/
│   └── lib.rs                    ← Program code
└── tests/
    └── integration.rs            ← Tests (TODO)

src/lib/
└── analos-profile-registry-sdk.ts ← JavaScript SDK
```

### **Instructions:**
1. **RegisterProfile** - Mint profile + reserve username
2. **UpdateProfile** - Update Los Bros or tier
3. **TransferUsername** - Transfer username to new wallet
4. **BurnProfile** - Release username back to pool

---

## 🔐 **Security Features:**

### **Username Validation:**
```rust
✅ Length: 3-20 characters
✅ Chars: a-z, A-Z, 0-9, _ only
✅ Start: Must begin with letter
✅ Case: Stored lowercase
✅ Unique: One owner per username
```

### **Collision Prevention:**
```rust
// Check username PDA before creating
if username_registry.is_available == false {
    return Err("Username already taken");
}

// Atomic creation = impossible to duplicate
invoke_signed(create_account(...));
```

### **Ownership Verification:**
```rust
// All updates require wallet signature
if profile.wallet != *user_wallet.key {
    return Err("Not the profile owner");
}
```

---

## 🚀 **Deployment Steps:**

### **1. Build Program:**
```bash
cd programs/analos-profile-registry
cargo build-bpf
```

### **2. Deploy to Analos:**
```bash
solana program deploy \
  --url https://rpc.analos.io \
  --keypair ~/.config/solana/deployer.json \
  target/deploy/analos_profile_registry.so
```

**Cost:** ~5-10 SOL on Analos

### **3. Update Program ID:**
```rust
// programs/analos-profile-registry/src/lib.rs
declare_id!("YOUR_DEPLOYED_PROGRAM_ID_HERE");
```

```typescript
// src/lib/analos-profile-registry-sdk.ts
export const PROFILE_REGISTRY_PROGRAM_ID = new PublicKey('YOUR_DEPLOYED_PROGRAM_ID_HERE');
```

### **4. Test on Devnet First:**
```bash
# Deploy to devnet
solana program deploy \
  --url https://api.devnet.solana.com \
  target/deploy/analos_profile_registry.so

# Test registration
node test-profile-registry.js
```

---

## 💻 **JavaScript Integration:**

### **Check Username Availability:**
```typescript
import { profileRegistrySDK } from '@/lib/analos-profile-registry-sdk';

const available = await profileRegistrySDK.isUsernameAvailable('dubie');
console.log('Available:', available); // false if taken
```

### **Register Profile (During Mint):**
```typescript
const registerIx = await profileRegistrySDK.createRegisterProfileInstruction(
  wallet.publicKey,
  'dubie',
  profileNftMint,
  losBrosMint, // or null
  3 // tier: 0=basic, 1=common, 2=rare, 3=epic, 4=legendary
);

// Add to transaction with NFT mint
transaction.add(registerIx);
```

### **Get Profile by Wallet:**
```typescript
const profile = await profileRegistrySDK.getProfileByWallet(walletPublicKey);
console.log('Username:', profile.username);
console.log('Tier:', profile.tier);
```

### **Get Wallet by Username:**
```typescript
const wallet = await profileRegistrySDK.getWalletByUsername('dubie');
console.log('Owner:', wallet.toString());
```

---

## 🔧 **Integration with Minting:**

### **Current Flow:**
```typescript
// 1. Mint NFT
const result = await profileNFTMintingService.mintProfileNFT(...);

// 2. Record in database (can fail)
await fetch('/api/profile-nft/record-mint', {...});
```

### **With On-Chain Program:**
```typescript
// 1. Check username on-chain
const available = await profileRegistrySDK.isUsernameAvailable(username);
if (!available) {
  alert('Username taken!');
  return;
}

// 2. Build combined transaction
const transaction = new Transaction();

// Add NFT mint instructions
transaction.add(...nftMintInstructions);

// Add profile registration
const registerIx = await profileRegistrySDK.createRegisterProfileInstruction(
  wallet.publicKey,
  username,
  mintAddress,
  losBrosMint,
  tier
);
transaction.add(registerIx);

// 3. Send as atomic transaction
const signature = await sendTransaction(transaction);

// 4. Database is now just a cache (optional)
await fetch('/api/profile-nft/record-mint', {...}); // Can fail, doesn't matter
```

**✅ Username is reserved on-chain atomically with NFT mint!**

---

## 📊 **Benefits Over Database:**

| Feature | Database Only | On-Chain Program |
|---------|---------------|------------------|
| **Uniqueness** | ⚠️  Can fail | ✅ Guaranteed |
| **Availability** | ⚠️  Can be down | ✅ Always available |
| **Race Conditions** | ❌ Possible | ✅ Impossible |
| **Verification** | ⚠️  Trust required | ✅ Blockchain proof |
| **Composability** | ❌ Isolated | ✅ Other programs can use |
| **Cost** | 💰 Free | 💰 ~0.002 SOL rent/profile |
| **Speed** | ⚡⚡⚡ Very fast | ⚡⚡ Fast |

---

## 🎯 **Recommended Approach:**

### **Phase 1: Launch with Current System** (Immediate)
- ✅ Token-2022 NFTs
- ✅ IPFS metadata
- ✅ Blockchain-first fetching (just implemented!)
- ✅ Database as cache
- ✅ Launch NOW

### **Phase 2: Deploy Profile Registry** (Next Week)
- Build and test Rust program
- Deploy to Analos mainnet
- Integrate with minting flow
- Migrate existing usernames
- Enable on-chain lookups

### **Phase 3: Advanced Features** (Future)
- Username marketplace (trade usernames)
- Social graph (followers on-chain)
- Reputation system
- Cross-program integration

---

## 🔧 **Development Checklist:**

### **✅ Completed:**
- [x] Rust program structure (`lib.rs`)
- [x] Profile Registry account design
- [x] Username Registry account design
- [x] RegisterProfile instruction
- [x] UpdateProfile instruction
- [x] BurnProfile instruction
- [x] Username validation logic
- [x] JavaScript SDK (`analos-profile-registry-sdk.ts`)
- [x] PDA derivation helpers
- [x] Availability checking

### **🔄 TODO:**
- [ ] Build program (`cargo build-bpf`)
- [ ] Deploy to Analos devnet (testing)
- [ ] Deploy to Analos mainnet
- [ ] Update program IDs in code
- [ ] Write integration tests
- [ ] Add borsh deserialization to SDK
- [ ] Integrate with minting flow
- [ ] Add username search API
- [ ] Create migration script for existing users
- [ ] Add program to `analos-programs.ts` config

---

## 💰 **Cost Breakdown:**

### **Deployment:**
- Program deployment: ~5-10 SOL (one-time)
- Program upgrade authority rent: ~0.01 SOL/year

### **Per User:**
- Profile Registry rent: ~0.002 SOL (reclaimable)
- Username Registry rent: ~0.002 SOL (reclaimable)
- Transaction fee: ~0.000005 SOL
- **Total per profile**: ~0.004 SOL (~$0.50 USD)

---

## 🎨 **Example Usage:**

### **Register Profile:**
```typescript
// During mint
const username = 'dubie';
const tier = 4; // 5-plus tier

// Check availability on-chain
const available = await profileRegistrySDK.isUsernameAvailable(username);
if (!available) {
  throw new Error('Username taken on-chain!');
}

// Create combined transaction
const tx = new Transaction();

// 1. Mint Profile NFT
tx.add(...profileMintInstructions);

// 2. Register on-chain
const registerIx = await profileRegistrySDK.createRegisterProfileInstruction(
  wallet.publicKey,
  username,
  profileNftMint,
  losBrosMint,
  tier
);
tx.add(registerIx);

// Send atomically
const signature = await sendTransaction(tx);

// ✅ Username is now reserved on-chain!
```

### **Lookup Profile:**
```typescript
// By wallet
const profile = await profileRegistrySDK.getProfileByWallet(walletPublicKey);
console.log(`@${profile.username} - Tier ${profile.tier}`);

// By username
const wallet = await profileRegistrySDK.getWalletByUsername('dubie');
console.log(`@dubie is owned by ${wallet.toString()}`);
```

---

## 🚀 **Next Steps:**

### **Option A: Deploy Now** (Recommended)
1. Build the program
2. Deploy to Analos mainnet
3. Update minting flow
4. Test with new mints
5. Keep database as optional cache

### **Option B: Launch Without, Add Later**
1. Launch with current system
2. Build program in background
3. Deploy when ready
4. Migrate existing users
5. Enable on-chain checks

---

## 🎉 **Summary:**

You're 100% right - an on-chain program like SNS is the **proper solution** for username uniqueness! 

**What's Ready:**
- ✅ Rust program code
- ✅ JavaScript SDK
- ✅ PDA structure
- ✅ Instructions designed
- ✅ Security features

**What's Needed:**
- [ ] Build and deploy (~1-2 hours)
- [ ] Testing (~1 hour)
- [ ] Integration (~2 hours)
- [ ] Migration script (~1 hour)

**Total Time:** ~4-6 hours to full on-chain profile registry!

This will make your platform **truly decentralized** and **collision-proof** like SNS! 🚀

---

## 📞 **Files to Review:**
- `programs/analos-profile-registry/src/lib.rs` - Rust program
- `programs/analos-profile-registry/Cargo.toml` - Dependencies
- `src/lib/analos-profile-registry-sdk.ts` - JavaScript SDK

Ready to build and deploy when you are! 🎯

