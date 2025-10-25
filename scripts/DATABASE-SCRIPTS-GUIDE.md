# 📚 Database Scripts Guide - What to Use & When

## 🎯 **Quick Reference**

### **For Fresh Setup (New Database):**
Use: `MASTER-DATABASE-SETUP.sql`  
→ Creates ALL tables in correct order with all columns

### **For Adding Los Bros to Existing Setup:**
Use: `los-bros-migration-simple.sql`  
→ Adds Los Bros columns to existing profile_nfts table

### **For Health Checks:**
Use: `check-table-structure.sql`  
→ Verifies all tables and columns exist

---

## 📋 **The ONLY Scripts You Need**

### **1️⃣ PRIMARY SCRIPT (Use This for New Setup)**
**File:** `MASTER-DATABASE-SETUP.sql`  
**When:** Setting up database from scratch  
**What it does:**
- Creates ALL tables in proper dependency order
- Includes Los Bros columns from the start
- Sets up RLS policies
- Creates database functions
- Grants permissions
- Includes verification queries

**Order of Operations:**
1. Extensions (uuid-ossp, pgcrypto)
2. Core tables (admin_users, user_profiles)
3. Profile NFT tables (profile_nfts, mint_counter)
4. Los Bros tables (allocations)
5. Whitelist tables (registry, free_mint_usage)
6. Marketplace tables (listings, offers, sales)
7. System tables (feature_flags, page_access, etc.)
8. Database functions
9. RLS policies
10. Permissions

---

### **2️⃣ MIGRATION SCRIPT (Use This for Existing Database)**
**File:** `los-bros-migration-simple.sql`  
**When:** You already have profile_nfts table  
**What it does:**
- Adds Los Bros columns to existing profile_nfts
- Creates los_bros_allocations table
- Creates database functions
- Sets up RLS policies
- Inserts tier allocations

**Use this if:**
- ✅ You already have profile_nfts table with data
- ✅ You don't want to drop existing data
- ✅ You just need to add Los Bros functionality

---

### **3️⃣ HEALTH CHECK SCRIPT (Use Anytime)**
**File:** `check-table-structure.sql`  
**When:** Verify database is correctly set up  
**What it does:**
- Lists all tables
- Shows all columns for each table
- Verifies indexes exist
- Checks RLS policies
- Validates functions

---

## 🗑️ **Scripts You Can DELETE (Duplicates/Old)**

These are redundant or superseded by MASTER-DATABASE-SETUP.sql:

### **Duplicates:**
- ❌ `setup-all-tables.sql` (superseded by MASTER)
- ❌ `complete-database-setup.sql` (superseded by MASTER)
- ❌ `safe-database-setup.sql` (superseded by MASTER)
- ❌ `create-tables-manually.sql` (superseded by MASTER)
- ❌ `setup-profile-nfts.sql` (included in MASTER)
- ❌ `add-missing-tables-only.sql` (superseded by MASTER)

### **Old Migrations:**
- ❌ `los-bros-database-migration.sql` (superseded by los-bros-migration-simple.sql)
- ❌ `final-database-fix.sql` (old troubleshooting)
- ❌ `fix-missing-columns.sql` (old fixes)

### **Marketplace Duplicates:**
- ❌ `marketplace-database-schema.sql` (included in MASTER)

### **Social Verification:**
- ❌ `setup-social-verification.sql` (included in MASTER)

---

## 🎯 **Decision Tree**

### **Scenario 1: Brand New Database**
```bash
Run: MASTER-DATABASE-SETUP.sql
✅ Done! Everything is set up.
```

### **Scenario 2: Existing Database WITHOUT Los Bros**
```bash
Step 1: Run check-table-structure.sql (verify what you have)
Step 2: Run los-bros-migration-simple.sql (add Los Bros)
✅ Done!
```

### **Scenario 3: Existing Database WITH Los Bros**
```bash
Run: check-table-structure.sql
✅ Verify everything is correct
```

### **Scenario 4: Something's Wrong**
```bash
Step 1: Run check-table-structure.sql (see what's broken)
Step 2: Fix specific issues OR
Step 3: Drop everything and run MASTER-DATABASE-SETUP.sql (nuclear option)
```

---

## 📊 **Table Dependencies (Order Matters!)**

```
1. Extensions (uuid-ossp, pgcrypto)
   ↓
2. admin_users (no dependencies)
   ↓
3. user_profiles (no dependencies)
   ↓
4. profile_nfts (references user_profiles via wallet)
   ↓
5. profile_nft_mint_counter (tracks profile_nfts)
   ↓
6. los_bros_allocations (independent)
   ↓
7. whitelist_registry (independent)
   ↓
8. free_mint_usage (independent)
   ↓
9. Marketplace tables (listings, offers, sales)
   ↓
10. System tables (feature_flags, page_access, etc.)
```

---

## ✅ **Current Database State (As of Oct 25, 2025)**

Based on your Supabase screenshot, you have:

### **Active Tables:**
- ✅ `los_bros_allocations` (with 4 tiers configured)
- ✅ `profile_nfts` (with Los Bros columns added)
- ✅ (Other core tables)

### **What You DON'T Need to Run:**
- ❌ MASTER-DATABASE-SETUP.sql (you already have tables)
- ✅ Your database is already set up!

### **What You SHOULD Do:**
1. Run `check-table-structure.sql` to verify everything
2. Keep using your existing database
3. Delete the duplicate SQL scripts from Supabase editor (cosmetic cleanup)

---

## 🎊 **Summary**

### **Keep These 3 Scripts:**
1. ✅ `MASTER-DATABASE-SETUP.sql` - For fresh installs
2. ✅ `los-bros-migration-simple.sql` - For adding Los Bros to existing DB
3. ✅ `check-table-structure.sql` - For verification

### **Delete Everything Else:**
- All the duplicates and old migrations cluttering your Supabase editor

### **Your Database:**
- ✅ Already properly configured
- ✅ Has Los Bros allocations working
- ✅ Ready for production

---

**Next:** Just clean up your Supabase SQL editor by deleting duplicate queries. Your actual database is fine! 🎉

