# 🔧 **RAILWAY ENVIRONMENT VARIABLES SETUP**

## **Add These to Your Railway Backend**

### **Step 1: Go to Railway**
1. Open: https://railway.com/project/b00441bd-d76f-4ccb-84da-3e320d70306b
2. Click on your **backend service**
3. Click the **"Variables"** tab

---

### **Step 2: Add NFT.Storage Key**

Add this variable:

```
Variable Name: NFT_STORAGE_API_KEY
Value: d5c39abd.4d9ac6f0985d4620bff140fb7e6bf171
```

---

### **Step 3: (Optional) Add Pinata Keys**

If you want backup IPFS provider, add these:

```
Variable Name: PINATA_API_KEY
Value: [Get from https://pinata.cloud/]

Variable Name: PINATA_SECRET_KEY
Value: [Get from https://pinata.cloud/]
```

**Note:** Pinata is optional. NFT.Storage alone is sufficient!

---

### **Step 4: Verify All Variables**

Your Railway backend should now have:

```bash
# Existing variables
ANALOS_RPC_URL=https://rpc.analos.io
NFT_LAUNCHPAD_PROGRAM_ID=7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk
SOLANA_PRIVATE_KEY=[your private key]
PORT=8080
NODE_ENV=production

# NEW - IPFS Integration
NFT_STORAGE_API_KEY=d5c39abd.4d9ac6f0985d4620bff140fb7e6bf171
PINATA_API_KEY=[optional]
PINATA_SECRET_KEY=[optional]
```

---

### **Step 5: Railway Will Auto-Deploy**

After adding the variable:
- Railway will automatically redeploy your backend
- Wait ~2-3 minutes for deployment
- Test the endpoint

---

### **Step 6: Test IPFS Integration**

Once deployed, test it:

```bash
curl https://analos-nft-launcher-production.up.railway.app/api/nft-generator/test-ipfs
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "nftStorage": true,
    "pinata": false
  }
}
```

---

## ✅ **YOU'RE READY!**

Your backend now has IPFS integration and can:
- Upload NFT images to IPFS
- Host metadata on IPFS
- Generate complete collections
- Deploy to blockchain

**Next: Update your backend server to include the new routes!** 🚀
