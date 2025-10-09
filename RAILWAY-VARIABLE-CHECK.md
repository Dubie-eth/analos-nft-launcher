# 🔍 Railway Variables Review

Based on your Railway Variables tab, here's what I see and what to check:

---

## ✅ **Good Variables You Have:**

### Core Configuration:
- `NODE_ENV` ✅
- `PORT` ✅ 
- `ANALOS_RPC_URL` ✅
- `NFT_LAUNCHPAD_PROGRAM_ID` ✅

### Admin Wallet:
- `ADMIN_PRIVATE_KEY` ✅
- `PAYER_PRIVATE_KEY` ✅ (might be duplicate of ADMIN_PRIVATE_KEY)

### CORS:
- `CORS_ORIGIN` ✅

### Frontend URL:
- `NEXT_PUBLIC_APP_URL` ✅

---

## 🔧 **Variables to Check/Update:**

### 1. **CORS_ORIGIN** - CRITICAL
**Current:** Should be your Vercel URL  
**Should be:** `https://analos-nft-launcher-9cxc.vercel.app`

**Check:** Make sure this is your exact Vercel URL (no trailing slash)

### 2. **NEXT_PUBLIC_APP_URL** - Frontend Variable
**Issue:** This is a frontend variable (`NEXT_PUBLIC_*`) but you're putting it in the backend

**Recommendation:** 
- ❌ Remove `NEXT_PUBLIC_APP_URL` from Railway (backend)
- ✅ Add it to Vercel instead (frontend)

### 3. **Duplicate Keys**
**Check:** You have both `ADMIN_PRIVATE_KEY` and `PAYER_PRIVATE_KEY`
- If they're the same → Remove one (keep `ADMIN_PRIVATE_KEY`)
- If different → Keep both

### 4. **Missing Variables (Optional):**
You might want to add:
```bash
PINATA_API_KEY=your_pinata_key (if you have one)
PINATA_SECRET_API_KEY=your_pinata_secret (if you have one)
PLATFORM_FEE_PERCENTAGE=2.5
PLATFORM_FEE_RECIPIENT=BpPn6H75SaYmHYtxTpLnpkddYviRj5ESaGNwv7iNWZze
```

---

## 🎯 **Action Items:**

### 1. **Verify CORS_ORIGIN**
Make sure it's exactly:
```
https://analos-nft-launcher-9cxc.vercel.app
```

### 2. **Remove Frontend Variable**
Delete `NEXT_PUBLIC_APP_URL` from Railway (it belongs in Vercel)

### 3. **Check for Duplicates**
If `ADMIN_PRIVATE_KEY` and `PAYER_PRIVATE_KEY` are the same, remove one

### 4. **Deploy**
Click **"Apply 6 changes"** to deploy your backend

---

## 📋 **Final Railway Variables Should Be:**

```bash
# Core
NODE_ENV=production
PORT=3001
ANALOS_RPC_URL=https://rpc.analos.io
NFT_LAUNCHPAD_PROGRAM_ID=FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo

# Admin (keep one)
ADMIN_PRIVATE_KEY=[your_keypair_array]

# CORS (VERIFY THIS!)
CORS_ORIGIN=https://analos-nft-launcher-9cxc.vercel.app

# Optional
PINATA_API_KEY=your_key (if you have)
PINATA_SECRET_API_KEY=your_secret (if you have)
```

---

## 🚀 **Next Steps:**

1. **Check CORS_ORIGIN** - Make sure it's your Vercel URL
2. **Remove NEXT_PUBLIC_APP_URL** - It belongs in Vercel, not Railway
3. **Apply changes** - Click the "Apply 6 changes" button
4. **Get Railway URL** - Copy it from Settings → Domains
5. **Configure Vercel** - Use Railway URL in Vercel variables

---

## ❓ **Questions to Answer:**

1. **What is your CORS_ORIGIN value?** (should be your Vercel URL)
2. **Are ADMIN_PRIVATE_KEY and PAYER_PRIVATE_KEY the same?** (if yes, remove one)
3. **Do you have Pinata API keys?** (optional for metadata storage)

Let me know the answers and I'll help you optimize the configuration!
