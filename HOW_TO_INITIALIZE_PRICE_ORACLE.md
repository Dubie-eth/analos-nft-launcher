# 💰 **HOW TO INITIALIZE THE PRICE ORACLE**

**Program ID:** `ztA5VFYMy29tgWpkAioro4HTfXQTgwpPinv9uSEdCMn`  
**Status:** Deployed ✅ | Not Initialized ⚠️  
**Purpose:** Provides real-time $LOS price data for USD-pegged NFT pricing

---

## 🎯 **QUICK START**

### **Option 1: Use the Web UI** ⭐ (EASIEST)

1. **Start the frontend:**
   ```bash
   cd frontend-minimal
   npm run dev
   ```

2. **Navigate to Admin:**
   - Open: http://localhost:3000/admin
   - Connect your admin wallet
   - Click "Price Oracle" tab
   - Enter LOS price (e.g., 0.10 for $0.10 USD)
   - Click "Initialize Oracle"
   - Sign the transaction in your wallet
   - Done! ✅

### **Option 2: Manual Initialization** (Advanced)

See detailed instructions below

---

## 📋 **WHAT YOU NEED**

1. ✅ **Admin Wallet with Authority**
   - The wallet that deployed the Price Oracle program
   - Or the wallet designated as the authority
   - Must have some SOL for transaction fees (~0.01 SOL)

2. ✅ **Price Oracle Program ID**
   - Already configured: `ztA5VFYMy29tgWpkAioro4HTfXQTgwpPinv9uSEdCMn`

3. ✅ **Initial LOS Price**
   - Default: $0.10 USD
   - You can change this to match market value

---

## 🚀 **STEP-BY-STEP GUIDE**

### **Step 1: Connect Your Admin Wallet**

1. Open the frontend: http://localhost:3000/admin
2. Click "Select Wallet" (top right)
3. Choose your wallet (Backpack, Phantom, etc.)
4. Approve the connection

### **Step 2: Navigate to Price Oracle Tab**

1. In the Admin Dashboard, look for the "Price Oracle" tab
2. If it's not there yet, I'll add it now!

### **Step 3: Enter Initial Price**

1. Input field: "LOS Price in USD"
2. Enter the initial price (e.g., `0.10` for 10 cents)
3. Price will be stored with 6 decimal precision

### **Step 4: Initialize**

1. Click "🚀 Initialize Oracle" button
2. Your wallet will prompt you to sign the transaction
3. Review the transaction details:
   - Program: Price Oracle
   - Action: Initialize
   - Price: Your entered value
4. Approve the transaction
5. Wait for confirmation (~2-5 seconds)

### **Step 5: Verify**

1. Transaction signature will appear
2. Click "View on Explorer" to see on-chain
3. Marketplace will now show your set price instead of fallback
4. Health check will show ✅ instead of ⚠️

---

## 🔄 **UPDATING THE PRICE**

Once initialized, you can update the price anytime:

1. Navigate to Admin → Price Oracle tab
2. Enter new price
3. Click "🔄 Update Price"
4. Sign transaction
5. Done!

**Note:** Only the program authority can update the price.

---

## 🧑‍💻 **MANUAL INITIALIZATION (Advanced Users)**

If you prefer to use the command line or Anchor CLI:

### **Using Anchor CLI:**

```bash
# Navigate to your Price Oracle program directory
cd path/to/price-oracle-program

# Build the program (if needed)
anchor build

# Initialize with Anchor
anchor run initialize --provider.wallet ~/.config/solana/id.json -- --price 0.10
```

### **Using Solana CLI:**

```bash
# Get your program derived address (PDA)
solana address-lookup-table create --program-id ztA5VFYMy29tgWpkAioro4HTfXQTgwpPinv9uSEdCMn

# Send initialize transaction
# (You'll need to construct the instruction data manually)
```

### **Using TypeScript:**

See `frontend-minimal/src/components/PriceOracleInitializer.tsx` for the full implementation.

Key points:
```typescript
// Derive PDA
const [oracleDataPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from('price_oracle')],
  PRICE_ORACLE_PROGRAM_ID
);

// Build instruction data
// First byte: instruction discriminator (0 = initialize)
// Next 8 bytes: price as u64 (6 decimal precision)
const instructionData = Buffer.alloc(9);
instructionData.writeUInt8(0, 0); // initialize
instructionData.writeBigUInt64LE(BigInt(priceInMicroUSD), 1);

// Accounts needed:
// 1. Oracle Data PDA (writable)
// 2. Authority (signer, writable for rent)
// 3. System Program
```

---

## 🔍 **VERIFICATION**

After initialization, verify it worked:

### **Method 1: Health Check**
1. Go to Admin → Health Check
2. Click "Run Complete Health Check"
3. Look for "Price Oracle" result
4. Should show: ✅ "LOS Price: $X.XX"

### **Method 2: Marketplace**
1. Go to Marketplace page
2. Look at LOS price display
3. Should show your set price instead of "0.1 (fallback)"

### **Method 3: Blockchain Explorer**
1. Visit: https://explorer.analos.io/address/ztA5VFYMy29tgWpkAioro4HTfXQTgwpPinv9uSEdCMn
2. Look for "Program Data Accounts"
3. You should see your oracle data PDA

### **Method 4: RPC Call**
```bash
curl https://rpc.analos.io -X POST -H "Content-Type: application/json" -d '
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "getProgramAccounts",
  "params": [
    "ztA5VFYMy29tgWpkAioro4HTfXQTgwpPinv9uSEdCMn",
    {
      "encoding": "base64"
    }
  ]
}
'
```

---

## ⚠️ **TROUBLESHOOTING**

### **Error: "Transaction failed"**
- **Cause:** Usually means you're not the program authority
- **Fix:** Make sure you're using the wallet that deployed the program

### **Error: "Account already exists"**
- **Cause:** Oracle is already initialized
- **Fix:** Use "Update Price" instead of "Initialize"

### **Error: "Insufficient funds"**
- **Cause:** Not enough SOL for transaction fees
- **Fix:** Add at least 0.01 SOL to your wallet

### **Error: "Program error: InvalidAccountData"**
- **Cause:** Wrong instruction data format
- **Fix:** Check that your Price Oracle program matches the instruction format

### **Price not showing in UI**
- **Cause:** Frontend cache or data not refreshed
- **Fix:** Hard refresh (Ctrl+F5) or wait a few seconds

---

## 📊 **PRICE FORMAT**

The Price Oracle stores prices with **6 decimal precision**:

| USD Price | Stored Value | Example |
|-----------|--------------|---------|
| $0.01 | 10,000 | 1 cent |
| $0.10 | 100,000 | 10 cents |
| $1.00 | 1,000,000 | 1 dollar |
| $10.00 | 10,000,000 | 10 dollars |

Formula: `stored_value = usd_price * 1,000,000`

---

## 🎯 **BEST PRACTICES**

1. **Start with a realistic price**
   - Check current market data
   - Consider starting low and increasing

2. **Update regularly**
   - Set up a schedule (daily, weekly)
   - Or integrate with a price feed API

3. **Document changes**
   - Keep a log of price updates
   - Note reasons for changes

4. **Test first**
   - Test on devnet before mainnet
   - Use small transactions

5. **Backup authority**
   - Store authority wallet securely
   - Consider multi-sig for production

---

## 🔗 **USEFUL LINKS**

- **Price Oracle Program:** https://explorer.analos.io/address/ztA5VFYMy29tgWpkAioro4HTfXQTgwpPinv9uSEdCMn
- **Analos RPC:** https://rpc.analos.io
- **Analos Explorer:** https://explorer.analos.io
- **Frontend Admin:** http://localhost:3000/admin (when running locally)
- **Live Admin:** https://analosnftfrontendminimal.vercel.app/admin

---

## 🆘 **NEED HELP?**

1. Check the console logs (F12 in browser)
2. Review transaction on Explorer
3. Verify you're using the authority wallet
4. Check that the program is deployed: `solana program show ztA5VFYMy29tgWpkAioro4HTfXQTgwpPinv9uSEdCMn`

---

## ✅ **AFTER INITIALIZATION**

Once initialized, your Price Oracle will:
- ✅ Provide real-time LOS price data
- ✅ Enable USD-pegged NFT pricing
- ✅ Remove the "fallback price" warning
- ✅ Power dynamic pricing across your launchpad
- ✅ Allow updates by the authority wallet

**Congratulations! Your Price Oracle is now operational!** 🎉

---

**Next Step:** Update the price regularly to reflect market conditions! 📈

