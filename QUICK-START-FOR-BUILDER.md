# 🚀 Quick Start Guide for Builder

## TL;DR - What You Need to Know

### ✅ Good News: Programs Are Already Deployed!

All 9 programs are **already live on mainnet**. You don't need to build or deploy anything!

**You just need:**
1. IDL files (interface definitions)
2. Frontend integration code
3. That's it!

---

## 📦 What You Have

### 9 Deployed Programs:

| Program | ID | Status |
|---------|----|----|
| NFT Launchpad | `5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT` | ✅ Live |
| Token Launch | `CDJZZCSod3YS9crpWAvWSLWEpPyx9QZCRRAcv7xL1FZf` | ✅ Live |
| Rarity Oracle | `3cnHMbD3Y88BZbxEPzv7WZGkN12X2bwKEP4FFtaVd5B2` | ✅ Live |
| Price Oracle | `5ihyquuoRJXTocBhjEA48rGQGsM9ZB6HezYE1dQq8NUD` | ✅ Live |
| OTC Enhanced | `7hnWVgRxu2dNWiNAzNB2jWoubzMcdY6HNysjhLiawXPY` | ✅ Live |
| Airdrop Enhanced | `J2D1LiSGxj9vTN7vc3CUD1LkrnqanAeAoAhE2nvvyXHC` | ✅ Live |
| Vesting Enhanced | `Ae3hXKsHzYPCPUKLtq2mdYZ3E2oKeKrF63ekceGxpHsY` | ✅ Live |
| Token Lock Enhanced | `3WmPLvyFpmQ8yPHh7nLxj6FLSATn2uVeD2ceNpuRKwZH` | ✅ Live |
| Monitoring System | `7PT1ubRGFWXFCmZTpsa9gtm9GZf8BaYTkSd7gE8VcXdG` | ✅ Live |

---

## 🎯 Your 3-Step Process

### Step 1: Get IDL Files

**Option A: Download from Chain** (Easiest)
```bash
npm install @project-serum/anchor @solana/web3.js
```

Create `download-idls.js`:
```javascript
const anchor = require("@project-serum/anchor");
const { Connection, PublicKey } = require("@solana/web3.js");
const fs = require("fs");

const programs = {
  otcEnhanced: "7hnWVgRxu2dNWiNAzNB2jWoubzMcdY6HNysjhLiawXPY",
  airdropEnhanced: "J2D1LiSGxj9vTN7vc3CUD1LkrnqanAeAoAhE2nvvyXHC",
  vestingEnhanced: "Ae3hXKsHzYPCPUKLtq2mdYZ3E2oKeKrF63ekceGxpHsY",
  tokenLockEnhanced: "3WmPLvyFpmQ8yPHh7nLxj6FLSATn2uVeD2ceNpuRKwZH",
  monitoringSystem: "7PT1ubRGFWXFCmZTpsa9gtm9GZf8BaYTkSd7gE8VcXdG",
};

async function download() {
  const conn = new Connection("https://api.mainnet-beta.solana.com");
  
  if (!fs.existsSync("idl")) fs.mkdirSync("idl");
  
  for (const [name, id] of Object.entries(programs)) {
    try {
      const idl = await anchor.Program.fetchIdl(new PublicKey(id), { connection: conn });
      if (idl) {
        fs.writeFileSync(`idl/${name}.json`, JSON.stringify(idl, null, 2));
        console.log(`✅ ${name}`);
      }
    } catch (e) {
      console.log(`⚠️  ${name}: ${e.message}`);
    }
  }
}

download();
```

Run it:
```bash
node download-idls.js
```

**Option B: Use Solana Playground**
1. Go to https://beta.solpg.io
2. Paste program code
3. Click "Build"
4. Download IDL file

**Option C: Ask Deployer**
Request the IDL files from whoever deployed the programs.

---

### Step 2: Set Up Frontend Integration

Create `src/lib/programs.ts`:

```typescript
import * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";

// Import IDLs
import otcIdl from "../../idl/otcEnhanced.json";
import airdropIdl from "../../idl/airdropEnhanced.json";
import vestingIdl from "../../idl/vestingEnhanced.json";
import tokenLockIdl from "../../idl/tokenLockEnhanced.json";
import monitoringIdl from "../../idl/monitoringSystem.json";

export const PROGRAM_IDS = {
  otc: new PublicKey("7hnWVgRxu2dNWiNAzNB2jWoubzMcdY6HNysjhLiawXPY"),
  airdrop: new PublicKey("J2D1LiSGxj9vTN7vc3CUD1LkrnqanAeAoAhE2nvvyXHC"),
  vesting: new PublicKey("Ae3hXKsHzYPCPUKLtq2mdYZ3E2oKeKrF63ekceGxpHsY"),
  tokenLock: new PublicKey("3WmPLvyFpmQ8yPHh7nLxj6FLSATn2uVeD2ceNpuRKwZH"),
  monitoring: new PublicKey("7PT1ubRGFWXFCmZTpsa9gtm9GZf8BaYTkSd7gE8VcXdG"),
};

export function loadPrograms(provider: anchor.AnchorProvider) {
  return {
    otc: new anchor.Program(otcIdl, PROGRAM_IDS.otc, provider),
    airdrop: new anchor.Program(airdropIdl, PROGRAM_IDS.airdrop, provider),
    vesting: new anchor.Program(vestingIdl, PROGRAM_IDS.vesting, provider),
    tokenLock: new anchor.Program(tokenLockIdl, PROGRAM_IDS.tokenLock, provider),
    monitoring: new anchor.Program(monitoringIdl, PROGRAM_IDS.monitoring, provider),
  };
}
```

---

### Step 3: Use in Your App

```typescript
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@project-serum/anchor";
import { loadPrograms } from "./lib/programs";

function MyApp() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const programs = useMemo(() => {
    if (!wallet.publicKey) return null;
    
    const provider = new AnchorProvider(
      connection,
      wallet as any,
      { commitment: "confirmed" }
    );
    
    return loadPrograms(provider);
  }, [connection, wallet]);

  // Use programs
  const createAirdrop = async () => {
    await programs.airdrop.methods
      .initializeAirdrop(merkleRoot, amount)
      .accounts({...})
      .rpc();
  };

  return <div>Your App</div>;
}
```

---

## 📝 Files You Need

### Required:
- ✅ `Anchor.toml` (already updated)
- ✅ 9 IDL files in `idl/` directory
- ✅ `src/lib/programs.ts` (integration code)

### Not Required:
- ❌ Rust source code (already compiled)
- ❌ Build environment setup
- ❌ Solana BPF SDK
- ❌ Program deployment

---

## 🎓 Documentation Available

1. **IMPLEMENTATION-GUIDE-FOR-BUILDER.md** - Full step-by-step guide
2. **BUILDER-TROUBLESHOOTING-GUIDE.md** - Fix build issues
3. **PROGRAM-UPDATE-GUIDE.md** - NFT Launchpad details
4. **ALL-PROGRAMS-INTEGRATION-GUIDE.md** - Complete ecosystem

---

## ⚡ Quick Commands

```bash
# Install dependencies
npm install @project-serum/anchor @solana/web3.js

# Create IDL directory
mkdir -p idl

# Download IDLs (if using script)
node download-idls.js

# Test program exists
solana program show 7hnWVgRxu2dNWiNAzNB2jWoubzMcdY6HNysjhLiawXPY

# Start your frontend
npm run dev
```

---

## 🔥 Common Issues

### "Can't build programs"
**Solution:** You don't need to! Programs are deployed. Just get IDL files.

### "Missing IDL files"
**Solution:** Use download script or Solana Playground to generate them.

### "Program not found"
**Solution:** Check program ID matches Anchor.toml.

### "Connection error"
**Solution:** Use correct RPC: `https://api.mainnet-beta.solana.com`

---

## ✅ Success Checklist

- [ ] Have 9 IDL files in `idl/` directory
- [ ] Created `programs.ts` file
- [ ] Installed npm packages
- [ ] Can import programs in code
- [ ] Tested connection to one program
- [ ] Ready to build UI!

---

## 🎯 What's Next?

1. Get IDL files (15 minutes)
2. Add integration code (10 minutes)
3. Test connection (5 minutes)
4. Build your UI (ongoing)
5. Deploy frontend (30 minutes)

**Total setup time: ~30 minutes** (no Rust required!)

---

## 💬 Need Help?

1. Check `BUILDER-TROUBLESHOOTING-GUIDE.md`
2. Read full docs in `IMPLEMENTATION-GUIDE-FOR-BUILDER.md`
3. Test individual programs first
4. Use devnet for initial testing

---

## 🎉 You Got This!

Remember: **The hard part is done!** Programs are deployed and working.

You just need to:
1. Get IDL files ← 15 mins
2. Copy integration code ← 10 mins  
3. Start building ← Fun part!

**No Rust. No build. No deployment. Just frontend integration!** 🚀

---

**Quick Reference Card**  
**Last Updated:** October 2025  
**Status:** Programs Live on Mainnet ✅

