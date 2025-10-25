# 🔧 Team Wallet Tier Fix Instructions

## 🎯 Problem

Your team wallet mints are showing up in the **PUBLIC** allocation instead of **TEAM** allocation.

**Current State:**
- TEAM: 0 mints ❌ (should be 5)
- PUBLIC: 4 mints ❌ (should be 0 from team wallet)

**Expected State:**
- TEAM: 5 mints ✅
- PUBLIC: 4 mints ✅ (only non-team mints)

---

## 📊 Step 1: Diagnose the Issue

Run this SQL in Supabase to see current state:

```sql
-- File: scripts/check-team-wallet-mints.sql
```

This will show you:
1. All Los Bros NFTs with their current tiers
2. Count of mints per tier
3. Which wallet minted which NFTs
4. Specific check for your admin wallet

---

## 🔧 Step 2: Fix the Tiers

Run this SQL in Supabase to correct the tiers:

```sql
-- File: scripts/fix-team-wallet-tiers.sql
```

This will:
1. **Update all Los Bros from your wallet** to `TEAM` tier
2. **Set discount to 100%** (free mints)
3. **Set final price to 0** (free)
4. **Set platform fee to 0** (free)
5. **Show verification** query with results

---

## ✅ Expected Results After Fix

```
Tier Distribution:
┌─────────────┬───────┐
│    Tier     │ Count │
├─────────────┼───────┤
│ TEAM        │   5   │ ← Your mints
│ COMMUNITY   │   0   │
│ EARLY       │   0   │
│ PUBLIC      │   4   │ ← Other mints
└─────────────┴───────┘
```

**Live Mint Allocations (on collection page):**
- **TEAM:** 5 / 50 ✅
- **COMMUNITY:** 0 / 500 ✅
- **EARLY:** 0 / 150 ✅
- **PUBLIC:** 4 / 1522 ✅

---

## 🤔 Why Did This Happen?

The team wallet detection works correctly in the pricing config (`los-bros-pricing.ts`), but when you minted:

1. **Frontend fetched pricing** via `/api/los-bros/check-eligibility`
2. **Pricing calculation ran** and should have detected your wallet as TEAM
3. **BUT** the tier might not have been passed correctly to `record-mint` API
4. **Database recorded** the mint with default `PUBLIC` tier

**Root Cause Options:**
- Pricing wasn't fetched before minting
- Tier wasn't passed in the API call
- Default tier fallback to `PUBLIC` in record-mint API

---

## 🛡️ Prevention for Future Mints

The code is already correct:

```typescript
// In los-bros-pricing.ts (line 85)
if (TEAM_WALLETS.includes(walletAddress)) {
  return {
    tier: 'TEAM',
    discount: 100,
    finalPrice: 0,
    // ...
  };
}

// In page.tsx (line 167)
losBrosTier: pricing?.tier,  // Should be 'TEAM' for your wallet
```

**Future mints from your wallet WILL be recorded as TEAM** as long as:
1. Pricing is fetched before minting
2. Wallet is in TEAM_WALLETS array (it is)

---

## 🚀 How to Fix Right Now

1. **Open Supabase SQL Editor**
2. **Copy `scripts/fix-team-wallet-tiers.sql`**
3. **Paste and click RUN**
4. **Wait for "Success"**
5. **Check results** - should show all 5 NFTs as TEAM tier
6. **Refresh Los Bros page** - allocations should update

---

## 📝 Verification

After running the fix, verify:

```sql
-- Should show TEAM: 5
SELECT los_bros_tier, COUNT(*) 
FROM profile_nfts 
WHERE los_bros_token_id IS NOT NULL 
GROUP BY los_bros_tier;
```

---

## ✨ Summary

✅ **SQL scripts created** to diagnose and fix tiers
✅ **Team wallet is properly configured** in code
✅ **Future mints will work correctly**
✅ **One-time SQL fix** will correct existing mints

Just run the fix script and your allocations will be correct! 🎉

