# 🎨 Los Bros NFT Integration - Complete Guide

## 🚀 **What We Built**

A **dual-mint system** where users can:
1. **Option A:** Mint a Profile NFT with a fresh Los Bros PFP (2 NFTs in one experience)
2. **Option B:** Mint just a Profile NFT with default Matrix style

---

## 📋 **Current Status**

### ✅ **Completed**
- ✅ Los Bros NFT detection API
- ✅ Los Bros minting service with trait generation
- ✅ Rarity calculation system (LEGENDARY, EPIC, RARE, COMMON)
- ✅ IPFS metadata upload for Los Bros
- ✅ Profile card updated with social links (Discord, Telegram)
- ✅ Profile card updated to display Los Bros token ID
- ✅ LosBrosSelector component for choosing PFPs

### 🔨 **In Progress** 
- Profile page UI integration (add Los Bros mint option)
- Dual-mint transaction builder
- Social links input fields

---

## 🎯 **How It Works**

### **User Flow:**

```
1. User visits /profile page
   ↓
2. Chooses username
   ↓
3. CHOICE:
   ├─→ Option A: "Mint with Los Bros PFP" (NEW!)
   │   ├─ Generates random traits
   │   ├─ Calculates rarity (Legendary/Epic/Rare/Common)
   │   ├─ Mints Los Bros NFT
   │   └─ Mints Profile NFT (with Los Bros ID + image)
   │
   └─→ Option B: "Mint Standard Profile"
       └─ Mints Profile NFT (Matrix style)
   ↓
4. Both options include:
   - Username (unique)
   - Social links (Twitter, Discord, Telegram)
   - Referral code
   - Free for 1M+ $LOL holders
```

---

## 🎨 **Los Bros Trait System**

### **Trait Categories:**
```typescript
- Background: 8 options (Matrix, Galaxy, Neon City, etc.)
- Hat: 8 options (Crown, Sombrero, Fedora, etc.)
- Eyes: 7 options (Laser Eyes, VR Headset, Sunglasses, etc.)
- Mouth: 8 options (Gold Teeth, Cigar, Mustache, etc.)
- Accessory: 7 options (Diamond Ring, Gold Chain, Watch, etc.)
- Body: 7 options (Suit, Hoodie, Muscular, etc.)
- Special: 8 options (Lightning, Fire, Aura, etc.)
```

### **Rarity Distribution:**
```
LEGENDARY: 4.5%   (Score 90-100)  - 10x multiplier
EPIC:      22.5%  (Score 70-89)   - 5x multiplier
RARE:      36%    (Score 40-69)   - 2x multiplier
COMMON:    37%    (Score 1-39)    - 1x multiplier
```

---

## 💻 **Technical Implementation**

### **1. Los Bros Minting Service** (`src/lib/los-bros-minting.ts`)

```typescript
// Generate random traits based on rarity weights
const traits = generateRandomTraits();

// Calculate rarity score
const rarityScore = calculateRarityScore(traits);
const rarityTier = getRarityTier(rarityScore); // LEGENDARY/EPIC/RARE/COMMON

// Mint Los Bros NFT
const result = await losBrosMintingService.mintLosBros({
  wallet: userWallet,
  signTransaction,
  sendTransaction
});

// Result includes:
// - mintAddress
// - traits
// - rarityScore
// - rarityTier
// - metadataUri
```

### **2. Profile Card with Los Bros ID**

Updated `generate-image` API to include:
```typescript
// New parameters:
- losBrosTokenId: string    // "Los Bros #1234"
- discordHandle: string      // "username#1234"
- telegramHandle: string     // "@username"

// Card displays:
- Los Bros image (if owned)
- Token ID badge
- All social links
- Rarity tier
```

### **3. Dual-Mint Transaction**

```typescript
// TODO: Implement dual-mint in profile page
const dualMint = async () => {
  // Step 1: Mint Los Bros NFT
  const losBrosResult = await losBrosMintingService.mintLosBros(...);
  
  // Step 2: Mint Profile NFT (with Los Bros data)
  const profileResult = await profileNFTMintingService.mintProfileNFT({
    ...normalParams,
    losBrosTokenId: losBrosResult.mintAddress,
    losBrosImage: losBrosResult.metadataUri,
    losBrosRarity: losBrosResult.rarityTier
  });
};
```

---

## 🎯 **Next Steps to Complete**

### **Step 1: Add Social Links Input** (Profile Page)
```tsx
// Add these state variables:
const [discordHandle, setDiscordHandle] = useState('');
const [telegramHandle, setTelegramHandle] = useState('');

// Add input fields in profile page UI:
<input 
  placeholder="Discord (username#1234)"
  value={discordHandle}
  onChange={(e) => setDiscordHandle(e.target.value)}
/>
<input 
  placeholder="Telegram (@username)"
  value={telegramHandle}
  onChange={(e) => setTelegramHandle(e.target.value)}
/>
```

### **Step 2: Add Los Bros Mint Option** (Profile Page)
```tsx
// Add toggle for Los Bros mint:
<div className="flex items-center space-x-4">
  <button
    onClick={() => setMintWithLosBros(false)}
    className={!mintWithLosBros ? 'active' : ''}
  >
    Standard Profile
  </button>
  
  <button
    onClick={() => setMintWithLosBros(true)}
    className={mintWithLosBros ? 'active' : ''}
  >
    🎨 Mint with Los Bros PFP
  </button>
</div>

{mintWithLosBros && (
  <div className="bg-purple-900/30 p-4 rounded-lg">
    <p>✨ You'll mint a Los Bros NFT AND Profile NFT together!</p>
    <p>🎲 Random traits will be generated</p>
    <p>🏆 Rarity: Legendary/Epic/Rare/Common</p>
  </div>
)}
```

### **Step 3: Update Mint Handler**
```tsx
const handleMint = async () => {
  if (mintWithLosBros) {
    // Dual mint: Los Bros + Profile
    const losBrosResult = await losBrosMintingService.mintLosBros({
      wallet: publicKey.toString(),
      signTransaction,
      sendTransaction
    });
    
    if (losBrosResult.success) {
      // Mint profile with Los Bros data
      await profileNFTMintingService.mintProfileNFT({
        ...normalParams,
        losBrosTokenId: losBrosResult.mintAddress,
        losBrosRarity: losBrosResult.rarityTier,
        discordHandle,
        telegramHandle
      });
    }
  } else {
    // Standard mint: Profile only
    await profileNFTMintingService.mintProfileNFT({
      ...normalParams,
      discordHandle,
      telegramHandle
    });
  }
};
```

---

## 📊 **Database Schema Updates Needed**

### **Add to `profile_nfts` table:**
```sql
ALTER TABLE profile_nfts ADD COLUMN los_bros_token_id VARCHAR(255);
ALTER TABLE profile_nfts ADD COLUMN los_bros_rarity VARCHAR(20);
ALTER TABLE profile_nfts ADD COLUMN discord_handle VARCHAR(255);
ALTER TABLE profile_nfts ADD COLUMN telegram_handle VARCHAR(255);
```

### **Create `los_bros_nfts` table:**
```sql
CREATE TABLE los_bros_nfts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mint_address VARCHAR(255) UNIQUE NOT NULL,
  wallet_address VARCHAR(255) NOT NULL,
  token_id INTEGER NOT NULL,
  traits JSONB NOT NULL,
  rarity_score DECIMAL(5,2) NOT NULL,
  rarity_tier VARCHAR(20) NOT NULL,
  metadata_uri TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_los_bros_wallet ON los_bros_nfts(wallet_address);
CREATE INDEX idx_los_bros_rarity ON los_bros_nfts(rarity_tier);
```

---

## 🎨 **Profile Card Design**

### **With Los Bros:**
```
┌─────────────────────────────────┐
│  [Los Bros PFP Image]          │
│                                 │
│  @username                      │
│  🎨 Los Bros #1234              │
│  🏆 LEGENDARY                   │
│                                 │
│  🐦 @twitter                    │
│  💬 discord#1234                │
│  ✈️ @telegram                   │
│                                 │
│  📊 Score: 95.3                 │
│  🎫 Referral: ABCD1234          │
└─────────────────────────────────┘
```

### **Standard (No Los Bros):**
```
┌─────────────────────────────────┐
│  [Matrix Style Background]      │
│                                 │
│  @username                      │
│  🎭 Profile NFT                 │
│                                 │
│  🐦 @twitter                    │
│  💬 discord#1234                │
│  ✈️ @telegram                   │
│                                 │
│  🎫 Referral: ABCD1234          │
└─────────────────────────────────┘
```

---

## 🎯 **User Benefits**

### **Minting with Los Bros PFP:**
✅ Get 2 NFTs in one experience  
✅ Los Bros becomes your profile picture  
✅ Rarity inherited (Legendary/Epic/Rare/Common)  
✅ Future utility for Los Bros holders  
✅ Unique traits (7 categories)  
✅ All social links displayed  

### **Standard Mint:**
✅ Matrix-style profile card  
✅ Faster mint (1 NFT)  
✅ All social links displayed  
✅ Still get unique username  
✅ Still FREE for 1M+ $LOL holders  

---

## 💰 **Pricing**

Both options follow same pricing:
- **1M+ $LOL holders:** FREE ✨
- **100k+ $LOL holders:** 50% discount
- **Everyone else:** Standard pricing by username length

---

## 🚀 **Launch Strategy**

### **Phase 1: Soft Launch** (Current)
- Los Bros minting service ready
- Profile NFTs working
- Integrate UI components

### **Phase 2: Full Launch**
- Los Bros + Profile dual mint live
- Social links on all cards
- Rarity leaderboard
- Los Bros marketplace integration

### **Phase 3: Utility**
- Los Bros staking
- Rarity multipliers for rewards
- Special perks for Legendary holders
- Profile picture verification

---

## 📝 **Marketing Copy**

### **Twitter Thread:**
```
1/ 🎨 HUGE UPDATE: Profile NFTs x Los Bros Integration!

Now when you mint your Profile NFT, you can ALSO mint a Los Bros PFP!

Two NFTs. One experience. Infinite possibilities. 🧵👇

2/ What are Los Bros?
→ Unique PFP collection
→ 7 trait categories
→ 4 rarity tiers (Legendary/Epic/Rare/Common)
→ Your identity on Analos

3/ How it works:
✅ Choose username
✅ Add social links (Twitter, Discord, Telegram)
✅ Mint with or without Los Bros PFP
✅ Show off your profile!

4/ 🪙 $LOL Holders:
Hold 1M+ $LOL tokens?
→ Mint BOTH NFTs for FREE! 🎉

5/ Launch: [DATE]
Get ready: [LINK]

#AnalosNFT #LosBros #ProfileNFT
```

---

## 🎊 **Summary**

**What's Ready:**
✅ Los Bros minting service  
✅ Trait generation system  
✅ Rarity calculation  
✅ Profile card updates  
✅ Social links support  

**What's Needed:**
🔨 Profile page UI integration  
🔨 Dual-mint transaction builder  
🔨 Database schema updates  
🔨 Social links input fields  

**Estimate:** 2-3 hours to complete full integration

---

**Los Bros x Profile NFTs = The ultimate identity system on Analos!** 🎨✨🚀

