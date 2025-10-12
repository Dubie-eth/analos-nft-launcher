# 🚀 Price Oracle Quick Start Guide

## ⚡ TL;DR - Initialize in 5 Steps

1. **Start the frontend:**
   ```bash
   cd minimal-repo
   npm run dev
   ```

2. **Open admin panel:** http://localhost:3000/admin

3. **Navigate to:** "Price Oracle" tab (💰 icon)

4. **Enter market cap:** e.g., `1000000` for $1M USD

5. **Click "Initialize"** → Sign transaction → Done! ✅

---

## 📊 What Was Fixed

### ✅ **Fixed Issues:**

1. **PDA Derivation** - Now uses correct seeds: `[b"price_oracle"]` only
2. **Market Cap Format** - Clarified: value in USD (not nano LOS)
3. **Discriminator** - Uses proper Anchor method discriminator
4. **UI Labels** - Updated to show correct format and examples

### ✅ **What Works Now:**

- ✅ Correct on-chain account creation
- ✅ Proper instruction format matching deployed program
- ✅ Transaction confirmation with preview
- ✅ Explorer links for verification
- ✅ LocalStorage caching for UI
- ✅ WebSocket-disabled connection (handles Analos quirks)

---

## 🎯 Current Status

| Component | Status | Location |
|-----------|--------|----------|
| **Program** | ✅ Deployed | `v9RBPUoi4tVRpxrwv4xuS5LgGXsSXdRvcbw5PkeCt62` |
| **Initialization** | ⚠️ Pending | Use admin panel to initialize |
| **UI Component** | ✅ Fixed | `minimal-repo/src/components/PriceOracleInitializer.tsx` |
| **Test Script** | ✅ Created | `tests/test-price-oracle-init.ts` |
| **Documentation** | ✅ Complete | `PRICE-ORACLE-INITIALIZATION-FIXED.md` |

---

## 🔍 Verify Installation

Run the test script to check current status:

```bash
npx ts-node tests/test-price-oracle-init.ts
```

**Expected Output (if not initialized):**
```
✅ Price Oracle program is deployed!
⚠️  Price Oracle is NOT initialized yet
```

**Expected Output (if initialized):**
```
✅ Price Oracle program is deployed!
✅ Price Oracle is INITIALIZED!
📊 Market Cap: $1,000,000
```

---

## 💡 Common Questions

### Q: What value should I enter for market cap?

**A:** Enter the total USD value you want to set for the entire LOS token supply.

Examples:
- `100000` = $100K USD
- `1000000` = $1M USD  ← **Recommended starting point**
- `5000000` = $5M USD
- `10000000` = $10M USD

### Q: How does the program calculate individual LOS price?

**A:** The program uses this formula:
```
LOS Price = Market Cap USD ÷ Circulating Supply
```

You'll provide both values when updating the price later.

### Q: Can I change the market cap later?

**A:** Yes! Use the `update_los_market_cap` instruction after initialization.

### Q: What wallet do I need?

**A:** The wallet that deployed the Price Oracle program, or the designated authority wallet.

### Q: How much LOS do I need?

**A:** ~0.001 LOS for transaction fees

---

## 🛠️ Files Changed

| File | Status | Description |
|------|--------|-------------|
| `minimal-repo/src/components/PriceOracleInitializer.tsx` | ✅ Fixed | Main component - corrected PDA & discriminator |
| `tests/test-price-oracle-init.ts` | ✅ New | Test script to verify status |
| `PRICE-ORACLE-INITIALIZATION-FIXED.md` | ✅ New | Detailed fix documentation |
| `PRICE-ORACLE-QUICK-START.md` | ✅ New | This file |

---

## 🔗 Quick Links

- **Admin Panel:** http://localhost:3000/admin
- **Program Explorer:** https://explorer.analos.io/address/v9RBPUoi4tVRpxrwv4xuS5LgGXsSXdRvcbw5PkeCt62
- **Analos RPC:** https://rpc.analos.io

---

## 🎬 Next Steps After Initialization

Once you've initialized the Price Oracle:

1. **Verify** with test script
2. **Set up automation** to update prices regularly (see `PRICE_ORACLE_AUTOMATION_GUIDE.md`)
3. **Test** with NFT minting to verify USD-pegged pricing works
4. **Monitor** the oracle account for updates

---

## 🆘 Need Help?

### Check These First:

1. **Console logs** (F12 in browser) - detailed error messages
2. **Transaction on explorer** - view on-chain details
3. **Test script output** - diagnostic information
4. **Component working?** - Should see "Price Oracle Initializer" in admin panel

### Common Solutions:

| Problem | Solution |
|---------|----------|
| Can't connect wallet | Make sure wallet has some LOS |
| Transaction fails | Check you're using authority wallet |
| "Account exists" | Already initialized, use update instead |
| WebSocket errors | Already handled by component |

---

## ✅ Success Checklist

After initialization, you should see:

- ✅ Success message with transaction signature
- ✅ Explorer link (clickable)
- ✅ Test script shows "Initialized: ✅"
- ✅ PDA account visible on explorer
- ✅ Market cap value stored correctly

---

**Ready to initialize? Let's go!** 🚀

1. `cd minimal-repo && npm run dev`
2. Open http://localhost:3000/admin
3. Click "Price Oracle" tab
4. Enter market cap
5. Click "Initialize"
6. Sign and done! 🎉

---

**For detailed technical information, see:** `PRICE-ORACLE-INITIALIZATION-FIXED.md`

