# 🚀 Implementation Guide: Adding 5 Enhanced Programs

## 👋 Hey Builder!

This guide will help you add the **5 new enhanced programs** to the Analos ecosystem. Follow these steps carefully!

---

## 📦 What We're Adding

We have **5 enhanced programs** with advanced security features that need to be integrated:

1. **Analos OTC Enhanced** - P2P trading with multi-sig
2. **Analos Airdrop Enhanced** - Merkle airdrops with rate limiting
3. **Analos Vesting Enhanced** - Token vesting with emergency controls
4. **Analos Token Lock Enhanced** - Time-locked tokens with multi-sig
5. **Analos Monitoring System** - Real-time monitoring and alerts

---

## ✅ STEP 1: Verify Program Files

First, make sure you have all the program files in your workspace:

### Check These Directories Exist:

```
C:\Users\dusti\OneDrive\Desktop\anal404s\
├── analos-otc-enhanced/
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs
│
├── analos-airdrop-enhanced/
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs
│
├── analos-vesting-enhanced/
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs
│
├── analos-token-lock-enhanced/
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs
│
└── analos-monitoring-system/
    ├── Cargo.toml
    └── src/
        └── lib.rs
```

**✅ If you see all 5 directories with their files, you're good!**

---

## ✅ STEP 2: Update Anchor.toml (ALREADY DONE!)

I've already updated the `Anchor.toml` file to include all 5 programs:

```toml
[programs.mainnet]
analos_nft_launchpad = "5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT"
analos_token_launch = "CDJZZCSod3YS9crpWAvWSLWEpPyx9QZCRRAcv7xL1FZf"
analos_rarity_oracle = "3cnHMbD3Y88BZbxEPzv7WZGkN12X2bwKEP4FFtaVd5B2"
analos_price_oracle = "5ihyquuoRJXTocBhjEA48rGQGsM9ZB6HezYE1dQq8NUD"
analos_otc_enhanced = "7hnWVgRxu2dNWiNAzNB2jWoubzMcdY6HNysjhLiawXPY"
analos_airdrop_enhanced = "J2D1LiSGxj9vTN7vc3CUD1LkrnqanAeAoAhE2nvvyXHC"
analos_vesting_enhanced = "Ae3hXKsHzYPCPUKLtq2mdYZ3E2oKeKrF63ekceGxpHsY"
analos_token_lock_enhanced = "3WmPLvyFpmQ8yPHh7nLxj6FLSATn2uVeD2ceNpuRKwZH"
analos_monitoring_system = "7PT1ubRGFWXFCmZTpsa9gtm9GZf8BaYTkSd7gE8VcXdG"
```

**✓ This step is complete!**

---

## ✅ STEP 3: Move Programs to Workspace (IF NEEDED)

If the 5 enhanced programs are currently **outside** the `analos-nft-launchpad/programs/` directory, you need to move them:

### Option A: If Programs Are in Root Directory

```bash
# Move each program into the programs folder
mv analos-otc-enhanced analos-nft-launchpad/programs/
mv analos-airdrop-enhanced analos-nft-launchpad/programs/
mv analos-vesting-enhanced analos-nft-launchpad/programs/
mv analos-token-lock-enhanced analos-nft-launchpad/programs/
mv analos-monitoring-system analos-nft-launchpad/programs/
```

### Option B: They're Already in Programs Folder

If they're already in `analos-nft-launchpad/programs/`, skip to Step 4!

---

## ✅ STEP 4: Update Root Cargo.toml

Open the **root** `Cargo.toml` file (located at `analos-nft-launchpad/Cargo.toml`) and add the 5 new programs to the workspace:

### Find this section:
```toml
[workspace]
members = [
    "programs/analos-nft-launchpad",
    "programs/analos-token-launch",
    "programs/analos-rarity-oracle",
    "programs/analos-price-oracle",
]
```

### Update it to:
```toml
[workspace]
members = [
    "programs/analos-nft-launchpad",
    "programs/analos-token-launch",
    "programs/analos-rarity-oracle",
    "programs/analos-price-oracle",
    "programs/analos-otc-enhanced",
    "programs/analos-airdrop-enhanced",
    "programs/analos-vesting-enhanced",
    "programs/analos-token-lock-enhanced",
    "programs/analos-monitoring-system",
]
```

**Save the file!**

---

## ✅ STEP 5: Verify Each Program's Cargo.toml

Each of the 5 programs should have a `Cargo.toml` that looks like this:

### Example: `programs/analos-otc-enhanced/Cargo.toml`

```toml
[package]
name = "analos-otc-enhanced"
version = "0.1.0"
description = "Enhanced OTC marketplace with security features"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "analos_otc_enhanced"

[features]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
cpi = ["no-entrypoint"]
default = []

[dependencies]
anchor-lang = "0.28.0"
anchor-spl = "0.28.0"

[dev-dependencies]
solana-program-test = "1.16.0"
tokio = "1.0"
```

**Check each of the 5 programs has this structure!**

---

## ✅ STEP 6: Build All Programs

Now let's build everything to make sure it works:

### From the `analos-nft-launchpad` directory, run:

```bash
cd analos-nft-launchpad
anchor build
```

### Expected Output:
```
Building analos-nft-launchpad...
Building analos-token-launch...
Building analos-rarity-oracle...
Building analos-price-oracle...
Building analos-otc-enhanced...
Building analos-airdrop-enhanced...
Building analos-vesting-enhanced...
Building analos-token-lock-enhanced...
Building analos-monitoring-system...

✅ Build successful!
```

**If you see errors, check Step 7 below!**

---

## ✅ STEP 7: Troubleshooting Build Errors

### Error: "failed to read manifest"
**Problem:** Cargo.toml is missing or malformed  
**Fix:** Check each program has a proper Cargo.toml (see Step 5)

### Error: "cannot find program_name in workspace"
**Problem:** Program not added to root Cargo.toml  
**Fix:** Make sure you updated the `[workspace] members` list (Step 4)

### Error: "duplicate program name"
**Problem:** Two programs with same name  
**Fix:** Make sure each program has a unique name in its Cargo.toml

### Error: "anchor-lang version mismatch"
**Problem:** Different Anchor versions  
**Fix:** All programs should use `anchor-lang = "0.28.0"`

---

## ✅ STEP 8: Generate IDLs

After successful build, generate the IDL files for the frontend:

```bash
# Generate all IDLs
anchor idl init 7hnWVgRxu2dNWiNAzNB2jWoubzMcdY6HNysjhLiawXPY -f target/idl/analos_otc_enhanced.json
anchor idl init J2D1LiSGxj9vTN7vc3CUD1LkrnqanAeAoAhE2nvvyXHC -f target/idl/analos_airdrop_enhanced.json
anchor idl init Ae3hXKsHzYPCPUKLtq2mdYZ3E2oKeKrF63ekceGxpHsY -f target/idl/analos_vesting_enhanced.json
anchor idl init 3WmPLvyFpmQ8yPHh7nLxj6FLSATn2uVeD2ceNpuRKwZH -f target/idl/analos_token_lock_enhanced.json
anchor idl init 7PT1ubRGFWXFCmZTpsa9gtm9GZf8BaYTkSd7gE8VcXdG -f target/idl/analos_monitoring_system.json
```

**These IDL files are needed for the frontend to interact with the programs!**

---

## ✅ STEP 9: Deploy Programs (If Not Already Deployed)

If these programs aren't deployed yet, deploy them:

```bash
# Deploy to devnet first for testing
anchor deploy --provider.cluster devnet

# Once tested, deploy to mainnet
anchor deploy --provider.cluster mainnet
```

**Note:** The program IDs in Anchor.toml are already set, so these should match the existing deployments.

---

## ✅ STEP 10: Update Frontend Integration

### Create a new file: `src/lib/programs.ts`

```typescript
import * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";

// Program IDs
export const PROGRAM_IDS = {
  nftLaunchpad: new PublicKey("5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT"),
  tokenLaunch: new PublicKey("CDJZZCSod3YS9crpWAvWSLWEpPyx9QZCRRAcv7xL1FZf"),
  rarityOracle: new PublicKey("3cnHMbD3Y88BZbxEPzv7WZGkN12X2bwKEP4FFtaVd5B2"),
  priceOracle: new PublicKey("5ihyquuoRJXTocBhjEA48rGQGsM9ZB6HezYE1dQq8NUD"),
  
  // NEW ENHANCED PROGRAMS
  otcEnhanced: new PublicKey("7hnWVgRxu2dNWiNAzNB2jWoubzMcdY6HNysjhLiawXPY"),
  airdropEnhanced: new PublicKey("J2D1LiSGxj9vTN7vc3CUD1LkrnqanAeAoAhE2nvvyXHC"),
  vestingEnhanced: new PublicKey("Ae3hXKsHzYPCPUKLtq2mdYZ3E2oKeKrF63ekceGxpHsY"),
  tokenLockEnhanced: new PublicKey("3WmPLvyFpmQ8yPHh7nLxj6FLSATn2uVeD2ceNpuRKwZH"),
  monitoringSystem: new PublicKey("7PT1ubRGFWXFCmZTpsa9gtm9GZf8BaYTkSd7gE8VcXdG"),
};

// Load programs
export async function loadPrograms(provider: anchor.AnchorProvider) {
  // Import IDLs
  const otcIdl = await import("../../target/idl/analos_otc_enhanced.json");
  const airdropIdl = await import("../../target/idl/analos_airdrop_enhanced.json");
  const vestingIdl = await import("../../target/idl/analos_vesting_enhanced.json");
  const tokenLockIdl = await import("../../target/idl/analos_token_lock_enhanced.json");
  const monitoringIdl = await import("../../target/idl/analos_monitoring_system.json");

  return {
    otcEnhanced: new anchor.Program(otcIdl, PROGRAM_IDS.otcEnhanced, provider),
    airdropEnhanced: new anchor.Program(airdropIdl, PROGRAM_IDS.airdropEnhanced, provider),
    vestingEnhanced: new anchor.Program(vestingIdl, PROGRAM_IDS.vestingEnhanced, provider),
    tokenLockEnhanced: new anchor.Program(tokenLockIdl, PROGRAM_IDS.tokenLockEnhanced, provider),
    monitoringSystem: new anchor.Program(monitoringIdl, PROGRAM_IDS.monitoringSystem, provider),
  };
}
```

---

## ✅ STEP 11: Test the Integration

Create a test file to verify everything works:

### `tests/enhanced-programs.ts`

```typescript
import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { assert } from "chai";

describe("Enhanced Programs Integration", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  it("Loads all 5 enhanced programs", async () => {
    // Load IDLs
    const otcIdl = require("../target/idl/analos_otc_enhanced.json");
    const airdropIdl = require("../target/idl/analos_airdrop_enhanced.json");
    const vestingIdl = require("../target/idl/analos_vesting_enhanced.json");
    const tokenLockIdl = require("../target/idl/analos_token_lock_enhanced.json");
    const monitoringIdl = require("../target/idl/analos_monitoring_system.json");

    // Initialize programs
    const otcProgram = new Program(otcIdl, "7hnWVgRxu2dNWiNAzNB2jWoubzMcdY6HNysjhLiawXPY", provider);
    const airdropProgram = new Program(airdropIdl, "J2D1LiSGxj9vTN7vc3CUD1LkrnqanAeAoAhE2nvvyXHC", provider);
    const vestingProgram = new Program(vestingIdl, "Ae3hXKsHzYPCPUKLtq2mdYZ3E2oKeKrF63ekceGxpHsY", provider);
    const tokenLockProgram = new Program(tokenLockIdl, "3WmPLvyFpmQ8yPHh7nLxj6FLSATn2uVeD2ceNpuRKwZH", provider);
    const monitoringProgram = new Program(monitoringIdl, "7PT1ubRGFWXFCmZTpsa9gtm9GZf8BaYTkSd7gE8VcXdG", provider);

    // Verify programs loaded
    assert.ok(otcProgram);
    assert.ok(airdropProgram);
    assert.ok(vestingProgram);
    assert.ok(tokenLockProgram);
    assert.ok(monitoringProgram);

    console.log("✅ All 5 enhanced programs loaded successfully!");
  });
});
```

### Run the test:

```bash
anchor test
```

---

## 📊 STEP 12: What Each Program Does

### 1. **Analos OTC Enhanced**
- **Purpose:** Peer-to-peer trading with escrow
- **Use Case:** Users can trade NFTs and tokens directly
- **Key Feature:** Multi-sig approval for large trades

### 2. **Analos Airdrop Enhanced**
- **Purpose:** Merkle tree-based airdrops
- **Use Case:** Distribute tokens to many wallets efficiently
- **Key Feature:** Rate limiting to prevent spam claims

### 3. **Analos Vesting Enhanced**
- **Purpose:** Token vesting with schedules
- **Use Case:** Team/investor token locks with time-based release
- **Key Feature:** Emergency pause for security

### 4. **Analos Token Lock Enhanced**
- **Purpose:** Time-locked token escrow
- **Use Case:** Lock LP tokens or team tokens
- **Key Feature:** Multi-sig unlock for security

### 5. **Analos Monitoring System**
- **Purpose:** Real-time system monitoring
- **Use Case:** Track all transactions, events, and errors
- **Key Feature:** Alert system for anomalies

---

## 🔧 STEP 13: Frontend Usage Examples

### Example 1: Create OTC Trade
```typescript
import { PROGRAM_IDS, loadPrograms } from "./lib/programs";

const programs = await loadPrograms(provider);

await programs.otcEnhanced.methods
  .createOffer(offerItems, requestedItems)
  .accounts({
    offer: offerPda,
    creator: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### Example 2: Initialize Airdrop
```typescript
await programs.airdropEnhanced.methods
  .initializeAirdrop(merkleRoot, totalAmount)
  .accounts({
    airdrop: airdropPda,
    authority: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### Example 3: Create Vesting Schedule
```typescript
await programs.vestingEnhanced.methods
  .createVestingSchedule(totalTokens, startTime, endTime, cliffDuration)
  .accounts({
    vestingSchedule: schedulePda,
    beneficiary: beneficiaryWallet,
    authority: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

---

## 🎯 STEP 14: Verification Checklist

Go through this checklist to make sure everything is set up:

- [ ] All 5 program directories exist with lib.rs files
- [ ] Anchor.toml has all 9 programs listed
- [ ] Root Cargo.toml workspace includes all 9 programs
- [ ] Each program's Cargo.toml is properly configured
- [ ] `anchor build` completes successfully
- [ ] IDL files generated in `target/idl/`
- [ ] Frontend can import and load all programs
- [ ] Tests pass (`anchor test`)
- [ ] Programs deployed (or ready to deploy)

---

## 🚨 Common Issues & Solutions

### Issue 1: "Program not found in workspace"
**Solution:** Add the program to root Cargo.toml `[workspace] members`

### Issue 2: "IDL file not found"
**Solution:** Run `anchor build` first, then generate IDLs

### Issue 3: "Program address mismatch"
**Solution:** Make sure program IDs in Anchor.toml match deployed programs

### Issue 4: "Cannot import program in frontend"
**Solution:** Make sure IDL files are in `target/idl/` and properly exported

### Issue 5: "Build fails with dependency errors"
**Solution:** Ensure all programs use same Anchor version (0.28.0)

---

## 📞 Need Help?

If you run into issues:

1. **Check the logs:** `anchor build --verbose`
2. **Verify file structure:** All programs in `programs/` directory
3. **Check program IDs:** Match between Anchor.toml and actual deployments
4. **Test individually:** Build each program separately to isolate issues
5. **Review documentation:** Check `PROGRAM-UPDATE-GUIDE.md` and `ALL-PROGRAMS-INTEGRATION-GUIDE.md`

---

## ✅ Success Criteria

You'll know the integration is successful when:

1. ✅ `anchor build` completes without errors
2. ✅ All 9 programs show in `target/deploy/`
3. ✅ All 9 IDL files generated in `target/idl/`
4. ✅ Frontend can load and call all programs
5. ✅ Tests pass for all programs

---

## 🎉 You're Done!

Once you've completed all steps, your ecosystem will have:

- **4 Core Programs** (NFT Launchpad, Token Launch, Rarity Oracle, Price Oracle)
- **5 Enhanced Programs** (OTC, Airdrop, Vesting, Token Lock, Monitoring)

**Total: 9 programs working together!**

---

## 📚 Additional Resources

- **Full Program Details:** See `ALL-PROGRAMS-INTEGRATION-GUIDE.md`
- **NFT Launchpad Updates:** See `PROGRAM-UPDATE-GUIDE.md`
- **Program Source Code:** All in `analos-nft-launchpad/programs/`

---

**Good luck with the integration! 🚀**

**Last Updated:** October 2025  
**Version:** 1.0

