# ⚡ QUICK REFERENCE CARD

## 🎯 **Program ID**
```
7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk
```

## 🔗 **Essential URLs**

| Service | URL |
|---------|-----|
| **Frontend** | https://analos-nft-launcher-9cxc.vercel.app |
| **Backend** | https://analos-nft-launcher-backend-production.up.railway.app |
| **Explorer** | https://explorer.analos.io/address/7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk |
| **RPC** | https://rpc.analos.io |
| **Railway** | https://railway.com/project/b00441bd-d76f-4ccb-84da-3e320d70306b |
| **Vercel** | https://vercel.com/dubie-eths-projects/analos-nft-launcher-9cxc |

## 💰 **Fee Wallets**

| Type | Percentage | Address |
|------|------------|---------|
| **Platform** | 2.5% | `3gWTQDuyYaWDRo2LWCvrzU2dCKfcL5zBQ1UWUx9J9vRL` |
| **Buyback** | 1.5% | `9tNaYj8izZGf4X4k1ywWYDHQd3z3fQpJBg6XhXUK4cEy` |
| **Developer** | 1.0% | `FCH5FYz6uCsKsyqvDY8BdqisvK4dqLpV5RGTRsRXTd3K` |
| **Creator** | 95.0% | (Collection creator address) |

## 🔧 **Environment Variables**

### Railway (Backend)
```bash
NFT_LAUNCHPAD_PROGRAM_ID=7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk
ANALOS_RPC_URL=https://rpc.analos.io
```

### Vercel (Frontend)
```bash
NEXT_PUBLIC_ANALOS_PROGRAM_ID=7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk
NEXT_PUBLIC_ANALOS_RPC_URL=https://rpc.analos.io
NEXT_PUBLIC_BACKEND_URL=https://analos-nft-launcher-backend-production.up.railway.app
```

## 🧪 **Quick Test Commands**

### Backend Health
```bash
curl https://analos-nft-launcher-backend-production.up.railway.app/health
```

### Mint Stats
```bash
curl https://analos-nft-launcher-backend-production.up.railway.app/api/mint-stats/Los%20Bros
```

### Ticker Check
```bash
curl https://analos-nft-launcher-backend-production.up.railway.app/api/ticker/check/TEST
```

## 📚 **Documentation Files**

| File | Purpose |
|------|---------|
| **DEPLOYMENT_READY.md** | ⭐ Start here - Complete deployment guide |
| **FINAL_HANDOFF_PACKAGE.md** | 📦 Everything in one place |
| **VERIFICATION_COMPLETE.md** | ✅ Code verification results |
| **BUILDER-QUICKSTART.md** | ⚡ 5-minute integration guide |
| **INTEGRATION-PACKAGE.md** | 📖 Complete API reference |
| **example-client.ts** | 💻 Ready-to-use code |

## ✨ **Key Features**

- ✅ On-chain ticker collision prevention
- ✅ Automatic fee distribution (5% total)
- ✅ Real-time supply tracking (30s updates)
- ✅ Blind mint & reveal
- ✅ 4-tier rarity system
- ✅ Admin controls
- ✅ 5% royalties

## 🚀 **Deploy in 3 Steps**

1. **Update Railway Variable**: `NFT_LAUNCHPAD_PROGRAM_ID`
2. **Update Vercel Variable**: `NEXT_PUBLIC_ANALOS_PROGRAM_ID`
3. **Test**: Visit frontend and try minting

## ✅ **Success Check**

```bash
# Should return new program ID
curl https://analos-nft-launcher-backend-production.up.railway.app/health

# Should show v4.2.0
# Visit: https://analos-nft-launcher-9cxc.vercel.app
```

---

**Status**: 🟢 READY FOR PRODUCTION  
**Version**: 4.2.1  
**Updated**: October 10, 2025

