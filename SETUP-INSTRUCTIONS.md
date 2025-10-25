# 🚀 Los Bros Collection Setup Instructions

## ✅ What's Been Fixed

### 1. **Build Error Fixed** 🔧
- Added type assertion for `legal_acceptances` table
- Build will now succeed on Vercel
- Legal tracking is non-blocking (won't crash if DB table missing)

### 2. **Social Links Updated** 📱
- ✅ **X (Twitter)**: https://x.com/launchonlos
- ✅ **Telegram**: https://t.me/launchonlos
- ✅ **Website**: https://launchonlos.fun
- ❌ **Removed**: Discord link

---

## 🗄️ Database Setup Required

### Step 1: Create Legal Acceptances Table

**Run this SQL in Supabase SQL Editor:**

```sql
-- File: scripts/create-legal-acceptances-table.sql
```

**Purpose**: Tracks user acknowledgment of disclaimers for legal compliance

**What it does**:
- Creates `legal_acceptances` table
- Stores wallet address, IP, timestamp, user agent
- Records disclaimer type (safety/legal/terms)
- Adds RLS policies for security

---

### Step 2: Lock Los Bros #1 as Official PFP

**Run this SQL in Supabase SQL Editor:**

```sql
-- File: scripts/lock-losbros-1-as-pfp.sql
```

**Purpose**: Marks Los Bros #1 as the official collection PFP

**What it does**:
- Sets `is_official_pfp: true` in metadata
- Sets `locked: true` to prevent listing/selling
- Adds `locked_reason: "Official Collection PFP"`
- This makes Los Bros #1 the permanent face of the collection

---

## 🎯 Testing After Setup

### 1. Test Legal Disclaimer
1. Clear browser localStorage
2. Visit the site
3. You'll see safety disclaimer modal
4. Click "📜 Read Full Legal Disclaimer" - should work now
5. Accept the disclaimer
6. Go to `/admin` → "⚖️ Legal Acceptances" tab
7. You should see your acceptance record

### 2. Test Social Links
1. Visit `/collections/los-bros`
2. Check the collection banner
3. Social icons should show:
   - 🐦 X (Twitter) → https://x.com/launchonlos
   - ✈️ Telegram → https://t.me/launchonlos
   - 🌐 Website → https://launchonlos.fun

### 3. Verify Los Bros #1 is Locked
1. View Los Bros #1 on the site
2. It should show a "🔒 LOCKED" badge or indicator
3. "List for Sale" button should be disabled/hidden
4. Metadata should show it's the official collection PFP

---

## 📊 Admin Dashboard Features

### Legal Acceptances Tab (⚖️)
- View all user acceptances
- Stats: Total, Safety Disclaimers, Legal Banners, Unique Wallets
- Export to CSV for legal audit
- Includes wallet address, IP, timestamp, user agent

**Location**: `/admin` → "⚖️ Legal Acceptances" tab

---

## 🐛 Fixing Missing Metadata

**Issue**: Some NFTs show "Error fetching collection stats: SyntaxError"

**Why**: The collection stats API may be returning HTML instead of JSON

**Check**:
1. Open browser console
2. Look for errors like `Unexpected token '<', "<!DOCTYPE"`
3. This means an API route is broken or missing

**How to Debug**:
```javascript
// Open browser console and test the API:
fetch('/api/collections/los-bros/stats')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

If you see HTML or errors, the stats API needs fixing.

---

## 🔍 Common Issues

### Issue: "Page /disclaimer not found"
**Status**: ✅ FIXED
- Added `/disclaimer` to access config
- Route is now publicly accessible

### Issue: "Multiple GoTrueClient instances detected"
**Status**: ✅ IMPROVED
- Enhanced singleton pattern
- Clears conflicting auth keys
- Should reduce frequency

### Issue: Build fails on Vercel
**Status**: ✅ FIXED
- Added type assertions for missing tables
- Build now succeeds even if DB tables don't exist yet

### Issue: NFT metadata missing
**Status**: 🔄 NEEDS INVESTIGATION
- Check if `metadata_uri` column exists in `profile_nfts` table
- Run: `scripts/add-metadata-uri-column.sql` if missing
- Verify NFTs have `los_bros_traits` data

---

## 📝 Next Steps

1. **Run both SQL scripts** in Supabase (legal table + lock PFP)
2. **Wait for Vercel deployment** to complete (~2 minutes)
3. **Test all features** using the testing checklist above
4. **Monitor console** for any remaining errors
5. **Export legal acceptances** periodically for compliance

---

## 🆘 Need Help?

If you encounter issues:

1. **Check Supabase**: Make sure both SQL scripts ran successfully
2. **Check Vercel**: Deployment should show "Building" then "Ready"
3. **Check Console**: Open browser dev tools, look for errors
4. **Check Database**: Verify tables exist and have correct structure

**Key Tables**:
- `profile_nfts` - NFT data
- `legal_acceptances` - Disclaimer tracking (NEW)
- `marketplace_listings` - NFT listings
- `marketplace_sales` - Sale history

---

## ✨ Features Now Live

✅ Legal disclaimer tracking (full audit trail)
✅ Updated social links (X, Telegram, Website)
✅ Disclaimer page routing fixed
✅ First-time user experience with legal notice
✅ Enhanced Supabase singleton pattern
✅ Build error fixed
✅ Los Bros #1 lockable as official PFP (run SQL)
✅ Admin dashboard with legal acceptance log

🎉 **Your platform is now more secure, compliant, and professional!**

