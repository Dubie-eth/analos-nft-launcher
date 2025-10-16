# 🚀 STEP-BY-STEP SETUP - Living Portfolio NFT Launch

## **Current Status: Ready to Begin!**

I found your complete NFT collection in `C:\Users\dusti\OneDrive\Desktop\LosBros` with:
- ✅ Backgrounds (6 variations)
- ✅ Bodies (6 variations)  
- ✅ Clothes (58 variations)
- ✅ Eyes (38 variations)
- ✅ Hats
- ✅ Mouths (9 variations)

This is PERFECT for:
1. **Pre-reveal**: Use one composed image as placeholder
2. **Post-reveal**: Generate unique combinations for each NFT
3. **AI Enhancement**: Use as base, enhance with portfolio data

---

## 📋 **IMMEDIATE NEXT STEPS:**

### **STEP 1: Choose Your Pre-Reveal Image** ⏰ 5 mins

You have two options:

**Option A: Use Existing Composed Image**
- Do you have a single "logo" image representing LosBros?
- If yes, tell me the filename

**Option B: Generate Placeholder Now**
- I'll help you compose a default image from your layers
- This will be what everyone sees before reveal

**Which option do you prefer?**

---

### **STEP 2: Set Up Pinata for IPFS** ⏰ 10 mins

1. Go to https://www.pinata.cloud/
2. Sign up (FREE account is perfect)
3. Get your API keys:
   - Go to "API Keys" in dashboard
   - Click "New Key"
   - Give it a name: "Analos NFT Upload"
   - Select permissions: "pinFileToIPFS" and "pinJSONToIPFS"
   - Copy the API Key and Secret

**Your Pinata Keys:**
```
API Key: ________________________________
Secret: __________________________________
```

4. Add to `.env.local`:
```env
NEXT_PUBLIC_PINATA_API_KEY=your_api_key_here
PINATA_SECRET_API_KEY=your_secret_here
```

---

### **STEP 3: Get LOL Token Info** ⏰ 5 mins

I need your LOL token details:

**LOL Token Information:**
```
Token Mint Address: _______________________________________
Token Decimals: _____ (usually 9)
Current Price: $_____ per LOL
Total Supply: _____
```

**Where to find this:**
- Check your token on Solana Explorer
- Or give me the token name and I'll help find it

---

### **STEP 4: Take LOL Holder Snapshot** ⏰ 20 mins

Once I have your LOL token mint address, I'll create a script to:
1. Scan all LOL token holders
2. Find wallets with 1,000,000+ LOL
3. Take the first 100
4. Store in database
5. Generate whitelist for minting

**Ready to run once you give me the token address.**

---

### **STEP 5: Configure Launch Parameters** ⏰ 10 mins

Confirm these settings:

**Collection Settings:**
```
Collection Name: Living Portfolio Genesis
Symbol: LPGEN
Total Supply: 2,222
Description: World's first auto-investing, self-evolving NFTs on Analos
```

**Pricing Tiers:**
```
✅ Tier 1 (100 NFTs): FREE for 1M+ LOL holders + 4,200.69 LOL platform fee
✅ Tier 2 (900 NFTs): 4,200.69 LOL → 8,000 LOL (linear curve)
✅ Tier 3 (1,222 NFTs): 8,000 LOL → 42,000.69 LOS (logarithmic curve)
```

**Reveal Strategy:**
```
✅ Pre-reveal: Static image (your choice)
✅ Post-reveal: AI-generated based on portfolio performance
✅ Timing: You control when reveal happens
✅ Method: Can reveal all at once or in batches
```

**Are these settings correct?** (yes/no)

---

### **STEP 6: Database Setup** ⏰ 5 mins

Run this SQL in your Supabase SQL Editor:

```sql
-- LOL Token Whitelist Table
CREATE TABLE IF NOT EXISTS lol_whitelist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL UNIQUE,
  lol_balance BIGINT NOT NULL,
  eligible BOOLEAN DEFAULT TRUE,
  snapshot_time TIMESTAMP NOT NULL DEFAULT NOW(),
  claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMP,
  nft_token_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_lol_whitelist_wallet ON lol_whitelist(wallet_address);
CREATE INDEX IF NOT EXISTS idx_lol_whitelist_eligible ON lol_whitelist(eligible) WHERE eligible = TRUE AND claimed = FALSE;

-- NFT Reveal Control Table
CREATE TABLE IF NOT EXISTS nft_reveal_control (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id TEXT NOT NULL,
  total_supply INTEGER NOT NULL,
  revealed_count INTEGER DEFAULT 0,
  reveal_enabled BOOLEAN DEFAULT FALSE,
  pre_reveal_image_url TEXT NOT NULL,
  admin_wallet TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Individual NFT Status Table
CREATE TABLE IF NOT EXISTS nft_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_id TEXT NOT NULL UNIQUE,
  collection_id TEXT NOT NULL,
  owner_wallet TEXT NOT NULL,
  revealed BOOLEAN DEFAULT FALSE,
  ai_generated_url TEXT,
  pre_reveal_url TEXT NOT NULL,
  revealed_at TIMESTAMP,
  portfolio_snapshot JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nft_status_token ON nft_status(token_id);
CREATE INDEX IF NOT EXISTS idx_nft_status_owner ON nft_status(owner_wallet);
CREATE INDEX IF NOT EXISTS idx_nft_status_revealed ON nft_status(revealed);

-- Insert initial reveal control
INSERT INTO nft_reveal_control (collection_id, total_supply, reveal_enabled, pre_reveal_image_url, admin_wallet)
VALUES (
  'living_portfolio_genesis',
  2222,
  FALSE,
  'PLACEHOLDER_URL', -- We'll update this after logo upload
  '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW' -- Replace with your admin wallet
)
ON CONFLICT DO NOTHING;
```

**Status after running SQL:** 
- [ ] ✅ Tables created
- [ ] ✅ Indexes created
- [ ] ✅ Initial data inserted

---

## 🎯 **CHECKLIST - What We Need From You:**

### **Information Needed:**
- [ ] Pre-reveal image choice (existing file or generate new?)
- [ ] Pinata API keys
- [ ] LOL token mint address
- [ ] Confirm launch parameters
- [ ] Admin wallet address

### **Actions to Complete:**
- [ ] Upload logo to Pinata
- [ ] Run Supabase SQL
- [ ] Add environment variables
- [ ] Test LOL holder snapshot
- [ ] Deploy smart contracts

---

## 📊 **Estimated Timeline:**

```
Setup (Today): 1 hour
  - Upload logo: 10 mins
  - Pinata setup: 10 mins
  - Database setup: 5 mins
  - Get LOL info: 10 mins
  - Take snapshot: 20 mins
  - Test everything: 5 mins

Smart Contracts (Tomorrow): 2-3 hours
  - Deploy bonding curve
  - Add LOL verification
  - Test on devnet

Frontend (Day 3): 2-3 hours
  - Add whitelist check
  - Show pricing tiers
  - Display bonding curve

Testing (Day 4-5): Full testing
  - Test all mint scenarios
  - Test reveal system
  - Monitor costs

Marketing (Day 6): Announce
  - Tweet whitelist
  - Discord announcement
  - Community hype

🚀 LAUNCH (Day 7): GO LIVE!
```

---

## 💬 **READY TO START?**

Tell me:
1. **Do you have a single logo image** for pre-reveal, or should I help generate one?
2. **Do you have Pinata API keys** yet, or need to sign up?
3. **What's your LOL token mint address?**
4. **What's your admin wallet address?**

Once you give me this info, we'll move forward FAST! 🚀
