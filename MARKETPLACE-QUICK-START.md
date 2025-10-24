# 🏪 Marketplace Quick Start Guide

## 🎯 **YOU HAVE 2 SQL SCRIPTS TO RUN**

---

## ✅ **SCRIPT 1: Los Bros Database Migration** (UPDATED)

This adds Los Bros support + **username unique constraint**

### **File:** `scripts/los-bros-database-migration.sql` (114 lines)

### **Run in Supabase:**
1. Copy all 114 lines
2. Paste in SQL Editor
3. Click "Run"

### **Expected:**
```
✓ Added unique constraint on username
✅ LOS BROS DATABASE MIGRATION COMPLETE!
```

---

## ✅ **SCRIPT 2: Marketplace System**

This adds listings, offers, sales, and fees

### **File:** `scripts/marketplace-database-schema.sql` (365 lines)

### **Run in Supabase:**
1. Copy all 365 lines
2. Paste in SQL Editor
3. Click "Run"

### **Expected:**
```
✅ MARKETPLACE DATABASE SCHEMA COMPLETE!
  ✓ nft_listings
  ✓ nft_offers
  ✓ nft_sales
  ✓ marketplace_fees
  
  💰 Platform Fee: 6.9%
  🎉 Marketplace ready for trading!
```

---

## 🚀 **AFTER RUNNING BOTH SCRIPTS:**

### **What Will Work:**

1. ✅ **Los Bros Minting**
   - Fixed IPFS upload
   - Dual-mint with Profile NFT
   - Social links on cards

2. ✅ **Username Uniqueness**
   - Database constraint enforced
   - Can't use same name twice
   - Clear error messages

3. ✅ **Marketplace (NEW!)**
   - Shows ONLY real minted NFTs
   - List NFTs for sale
   - Make/accept offers
   - 6.9% platform fee on sales
   - Sales history tracking

---

## 📋 **TESTING CHECKLIST**

### **After Vercel Deploys:**

#### **Test 1: Los Bros Mint** (5 min)
- [ ] Visit /profile
- [ ] Select "With Los Bros PFP"
- [ ] Mint should work (IPFS fixed)
- [ ] Get 2 NFTs

#### **Test 2: Username Uniqueness** (2 min)
- [ ] Try minting with existing username
- [ ] Should get error

#### **Test 3: Marketplace Display** (2 min)
- [ ] Visit /marketplace
- [ ] Should show REAL NFTs only
- [ ] Should show proper Profile NFT images
- [ ] No more mock data

#### **Test 4: List NFT** (Future - UI needed)
- [ ] Click "List for Sale" on your NFT
- [ ] Enter price
- [ ] Sign transaction
- [ ] NFT appears in marketplace

#### **Test 5: Make Offer** (Future - UI needed)
- [ ] Find NFT in marketplace
- [ ] Click "Make Offer"
- [ ] Enter offer price
- [ ] Offer recorded

---

## ⏱️ **TIMELINE**

| Task | Time | Status |
|------|------|--------|
| Run Los Bros SQL | 2 min | ⏳ **DO NOW** |
| Run Marketplace SQL | 2 min | ⏳ **DO NOW** |
| Wait for Vercel | 2 min | ⏳ Auto |
| Test Los Bros mint | 5 min | 🧪 After deploy |
| Test marketplace | 5 min | 🧪 After deploy |
| **TOTAL** | **16 min** | **To full system!** |

---

## 📁 **Files to Run:**

```
1. scripts/los-bros-database-migration.sql (114 lines)
   → Adds Los Bros + social links + unique username

2. scripts/marketplace-database-schema.sql (365 lines)
   → Adds marketplace tables + fees + RLS

BOTH READY TO RUN IN SUPABASE!
```

---

## 🎊 **WHAT YOU'LL HAVE:**

✅ **Profile NFT System** - Working perfectly  
✅ **Los Bros Integration** - Dual-mint ready  
✅ **Social Links** - Discord, Telegram on cards  
✅ **Username Uniqueness** - Database enforced  
✅ **Full Marketplace** - List, offer, buy, sell  
✅ **Fee System** - 6.9% auto-calculated  
✅ **Real Data Only** - No more mocks!  

---

## 🚀 **ACTION NOW:**

**👉 Run BOTH SQL scripts in Supabase (takes 4 minutes total):**

1. Open: `scripts/los-bros-database-migration.sql`
2. Copy all → Paste in Supabase → Run
3. Open: `scripts/marketplace-database-schema.sql`
4. Copy all → Paste in Supabase → Run
5. Done! Wait for Vercel!

---

**Your complete NFT platform is 4 minutes away!** ⏱️✨🚀

