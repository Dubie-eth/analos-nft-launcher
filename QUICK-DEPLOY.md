# 🚀 Quick Deployment Checklist for Windows

## Current Status
✅ Wallet configured: `4ea9ktn5Ngb3dUjBBKYe7n87iztyQht8MVxn6EBtEQ4q`
✅ Balance: 100 SOL
✅ Network: Analos (https://rpc.analos.io)
✅ Program ID: `FAS9AgPy9SbyBeHCyiF5YBUYt7HbAwRF5Kie9CzBXtwJ`
⏳ Building program... (10-20 minutes)

## After Build Completes

### Step 1: Deploy Program
```powershell
cd c:\Users\dusti\OneDrive\Desktop\anal404s\analos-nft-launchpad
anchor deploy --provider.cluster mainnet --provider.url https://rpc.analos.io
```

### Step 2: Initialize IDL
```powershell
anchor idl init FAS9AgPy9SbyBeHCyiF5YBUYt7HbAwRF5Kie9CzBXtwJ `
  --provider.cluster mainnet `
  --provider.url https://rpc.analos.io `
  --filepath target/idl/analos_nft_launchpad.json
```

### Step 3: Initialize Your Collection
```powershell
# Install Node dependencies first
npm install

# Run initialization script
npx ts-node scripts/initialize-collection.ts
```

### Step 4: Verify Deployment
```powershell
# Check program on explorer
start https://explorer.analos.io/address/FAS9AgPy9SbyBeHCyiF5YBUYt7HbAwRF5Kie9CzBXtwJ
```

## Troubleshooting

### If build fails:
```powershell
# Clean and retry
anchor clean
anchor build
```

### If out of memory:
```powershell
# Close other apps and retry with more resources
$env:CARGO_BUILD_JOBS = "2"  # Limit parallel builds
anchor build
```

### If RPC connection fails:
```powershell
# Check RPC is accessible
curl https://rpc.analos.io -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'
```

## Estimated Timeline
- ⏳ Build: 10-20 minutes (one time)
- 🚀 Deploy: 2-3 minutes
- 📝 Initialize: 1-2 minutes
- ✅ **Total: 15-25 minutes**

## Next Steps After Deployment
1. Build frontend UI
2. Generate metadata for 10K NFTs
3. Upload to IPFS/Arweave
4. Launch! 🎉

