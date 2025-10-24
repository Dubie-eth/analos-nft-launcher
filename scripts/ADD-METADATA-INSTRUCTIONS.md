# 📝 Add Metadata to Your Existing Profile NFT

Your Profile NFT (`5rink7q3ejuzguX53QGgUzMwLnf5RAQJSLhC9nyNrqio`) was minted successfully but is missing on-chain metadata. This makes it show as "Unknown Token" in explorers.

This script will add the metadata so your NFT displays properly!

---

## 🎯 What This Will Do

After running this script, your NFT will show in explorers as:
- ✅ **Name:** @Dubie
- ✅ **Symbol:** APROFILE
- ✅ **Image:** Your profile avatar from IPFS
- ✅ **Attributes:** Username, Tier, Price Paid, etc.

---

## 🚀 How To Run

### **Step 1: Export Your Wallet Private Key**

**From Backpack Wallet:**
1. Open Backpack wallet
2. Click Settings → Export Private Key
3. Copy the private key (base58 encoded string)
4. **KEEP THIS SECRET!** Never share it!

### **Step 2: Set Environment Variable**

**In PowerShell:**
```powershell
$env:WALLET_PRIVATE_KEY="your-private-key-here"
```

**Or create a `.env.local` file:**
```env
WALLET_PRIVATE_KEY=your-private-key-here
```

### **Step 3: Install Dependencies (if needed)**

```bash
npm install bs58
```

### **Step 4: Run the Script**

```bash
npx ts-node scripts/add-metadata-to-nft.ts
```

---

## ⚠️ IMPORTANT SECURITY NOTES

1. **NEVER commit your private key to git!**
2. **Delete the environment variable after running the script:**
   ```powershell
   $env:WALLET_PRIVATE_KEY=""
   ```
3. **Remove it from `.env.local` after use**
4. This script is **safe** - it only creates metadata, doesn't transfer tokens

---

## 💰 Cost

- **Rent for metadata account:** ~0.0056 LOS
- **Rent for master edition:** ~0.0014 LOS
- **Transaction fee:** ~0.00001 LOS
- **Total:** ~0.007 LOS (less than $0.001)

---

## 🔍 Verification

After running the script:

1. **Check the explorer:**
   ```
   https://explorer.analos.io/address/5rink7q3ejuzguX53QGgUzMwLnf5RAQJSLhC9nyNrqio
   ```

2. **You should see:**
   - Name: @Dubie
   - Symbol: APROFILE
   - Image from IPFS
   - All attributes visible

3. **Refresh your profile page** - the NFT image should now load!

---

## 🐛 Troubleshooting

### **Error: "Metadata account already exists"**
- Good news! This means it worked (or was already there)
- Just refresh the explorer and profile page

### **Error: "Insufficient balance"**
- Add at least 0.01 LOS to your wallet for fees

### **Error: "Invalid private key"**
- Make sure you copied the full base58 private key from Backpack
- It should be a long string starting with letters/numbers

### **Error: "Transaction failed"**
- Check if you still have mint authority
- Verify the metadata program ID is correct for Analos

---

## ✅ Success Indicators

When it works, you'll see:
```
✅ Metadata added successfully!
📝 Transaction signature: [signature]
🔗 View on explorer: https://explorer.analos.io/tx/[signature]
🎉 Your NFT now has on-chain metadata!
```

---

**Need help?** Share any error messages and I'll troubleshoot!

