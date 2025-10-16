# 🧹 Supabase Schema Cleanup Guide

## 🎯 **Goal**: Clean up 28+ old schemas and keep only the essential ones

## ✅ **KEEP THESE 3 SCHEMAS** (Most Recent & Complete):

1. **"Saved Collections & Creator Rewards Schema"** ⭐ (Our latest - most comprehensive)
2. **"user_profiles Table Fix and RLS Setup"** ⭐ (If it's the most recent user profiles)
3. **"Exclusive NFT Collection Schema"** ⭐ (If you're using exclusive collections)

## 🗑️ **DELETE THESE 25+ OLD SCHEMAS**:

### **Old Social Verification Schemas** (Multiple duplicates):
- ❌ "Social Verification Schema and RLS Setup"
- ❌ "Fixed Social Verification Schema" 
- ❌ "Social Verification Schema with RLS & Audit Logs"
- ❌ "Social Verification Integration" (both instances)

### **Old User Points & Leaderboard Schemas**:
- ❌ "User Points and Leaderboard RPCs"
- ❌ "User Points and Leaderboard Functions"
- ❌ "User Points & Leaderboard RPC Functions"
- ❌ "Points & Leaderboard Management Functions"

### **Old Page Access Schemas**:
- ❌ "Page Access & User Management Schema"
- ❌ "Page Access, Profiles & Leaderboard Schema"
- ❌ "Page Access and User Engagement Schema"

### **Old Airdrop Schemas**:
- ❌ "Airdrop Campaigns and Claims Schema"
- ❌ "Airdrop campaigns and claims schema"
- ❌ "Airdrop Campaigns & Claims Schema"

### **Old Launchpad Schemas**:
- ❌ "Analos NFT Launchpad Schema"

### **Old "Fixed" Schemas** (These are outdated versions):
- ❌ "Fixed Supabase schema with RLS and safe enums"
- ❌ "Fixed Supabase Schema with Idempotent Type Creation"
- ❌ "Fixed Supabase Schema with Safe Enum Creation & RLS"
- ❌ "Fixed Supabase schema with safe enums & RLS"

### **Old Security Schemas**:
- ❌ "Security Monitoring Schema" (unless it's the most recent)

### **Old App-Level Schemas**:
- ❌ "App-Level Encryption Configuration & Functions"

## 🚀 **CLEANUP STEPS**:

### **Step 1: Delete Old Schemas**
1. Go to Supabase SQL Editor
2. In the left sidebar, click the **trash/delete icon** next to each old schema
3. Delete all the schemas marked with ❌ above
4. Keep only the 3 schemas marked with ⭐

### **Step 2: Run the New Schema**
1. Copy the content from `supabase-schema-update.sql`
2. Paste it into a new SQL query in Supabase
3. Click **"Run"** to execute

### **Step 3: Verify Tables Exist**
Run this query to verify all tables are created:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected tables:
- `saved_collections`
- `creator_rewards`
- `collection_sales`
- `user_profiles` (if not already exists)
- `user_points` (if not already exists)

## 🔍 **VERIFICATION QUERIES**:

### Check if tables exist:
```sql
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Check if functions exist:
```sql
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

## ⚠️ **IMPORTANT NOTES**:

1. **Backup First**: If you have important data, export it before cleanup
2. **Test After**: Verify your app still works after cleanup
3. **Keep Recent**: Only keep the most recent versions of each schema type
4. **Document**: Note which schemas you kept for future reference

## 🎉 **AFTER CLEANUP**:

Your Supabase SQL Editor should have only:
- ✅ 3 essential schemas (instead of 28+)
- ✅ Clean, organized structure
- ✅ No conflicts between old/new schemas
- ✅ Better performance
- ✅ Easier maintenance

## 📞 **Need Help?**

If you encounter any issues:
1. Check the error messages in Supabase
2. Verify your environment variables are correct
3. Make sure you're using the right database connection
4. Test with a simple query first

---

**Ready to clean up? Start with deleting the old schemas, then run the new one!** 🚀
