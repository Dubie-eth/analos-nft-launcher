# 🔧 Builder Troubleshooting & Alternative Deployment Guide

## ⚠️ Common Build Issues & Solutions

If you encounter the error: `Can't get home directory path: environment variable not found` or `Solana SDK path does not exist`, follow this guide.

---

## 🎯 OPTION 1: Fix Local Build Environment (Recommended if building locally)

### Step 1: Install/Reinstall Solana CLI

```bash
# Windows (PowerShell as Administrator)
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Or use Windows installer
# Download from: https://github.com/solana-labs/solana/releases

# After installation, restart terminal and verify:
solana --version
```

### Step 2: Set Environment Variables

```bash
# Windows PowerShell
$env:HOME = "C:\Users\dusti"
$env:PATH += ";C:\Users\dusti\.local\share\solana\install\active_release\bin"

# Add to permanent environment:
[System.Environment]::SetEnvironmentVariable("HOME", "C:\Users\dusti", [System.EnvironmentVariableTarget]::User)
```

### Step 3: Install Anchor CLI

```bash
# Install Rust first if needed
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.28.0
avm use 0.28.0
```

### Step 4: Try Building Again

```bash
cd analos-nft-launchpad
anchor build
```

---

## 🚀 OPTION 2: Use Solana Playground (EASIEST - No Local Setup Needed!)

Since the programs are **already deployed** with program IDs, you don't need to rebuild them locally. Here's what to do:

### ✅ Programs Already Deployed:

1. **analos_nft_launchpad** - `5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT`
2. **analos_token_launch** - `CDJZZCSod3YS9crpWAvWSLWEpPyx9QZCRRAcv7xL1FZf`
3. **analos_rarity_oracle** - `3cnHMbD3Y88BZbxEPzv7WZGkN12X2bwKEP4FFtaVd5B2`
4. **analos_price_oracle** - `5ihyquuoRJXTocBhjEA48rGQGsM9ZB6HezYE1dQq8NUD`
5. **analos_otc_enhanced** - `7hnWVgRxu2dNWiNAzNB2jWoubzMcdY6HNysjhLiawXPY`
6. **analos_airdrop_enhanced** - `J2D1LiSGxj9vTN7vc3CUD1LkrnqanAeAoAhE2nvvyXHC`
7. **analos_vesting_enhanced** - `Ae3hXKsHzYPCPUKLtq2mdYZ3E2oKeKrF63ekceGxpHsY`
8. **analos_token_lock_enhanced** - `3WmPLvyFpmQ8yPHh7nLxj6FLSATn2uVeD2ceNpuRKwZH`
9. **analos_monitoring_system** - `7PT1ubRGFWXFCmZTpsa9gtm9GZf8BaYTkSd7gE8VcXdG`

### What You Need: IDL Files

Since programs are deployed, you just need the **IDL (Interface Definition Language)** files for the frontend. Here's how:

#### Method A: Download IDLs from Chain

```typescript
// Create a script: download-idls.ts
import * as anchor from "@project-serum/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import fs from "fs";

const PROGRAM_IDS = {
  nftLaunchpad: "5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT",
  tokenLaunch: "CDJZZCSod3YS9crpWAvWSLWEpPyx9QZCRRAcv7xL1FZf",
  rarityOracle: "3cnHMbD3Y88BZbxEPzv7WZGkN12X2bwKEP4FFtaVd5B2",
  priceOracle: "5ihyquuoRJXTocBhjEA48rGQGsM9ZB6HezYE1dQq8NUD",
  otcEnhanced: "7hnWVgRxu2dNWiNAzNB2jWoubzMcdY6HNysjhLiawXPY",
  airdropEnhanced: "J2D1LiSGxj9vTN7vc3CUD1LkrnqanAeAoAhE2nvvyXHC",
  vestingEnhanced: "Ae3hXKsHzYPCPUKLtq2mdYZ3E2oKeKrF63ekceGxpHsY",
  tokenLockEnhanced: "3WmPLvyFpmQ8yPHh7nLxj6FLSATn2uVeD2ceNpuRKwZH",
  monitoringSystem: "7PT1ubRGFWXFCmZTpsa9gtm9GZf8BaYTkSd7gE8VcXdG",
};

async function downloadIdls() {
  const connection = new Connection("https://api.mainnet-beta.solana.com");

  for (const [name, programId] of Object.entries(PROGRAM_IDS)) {
    try {
      const idl = await anchor.Program.fetchIdl(new PublicKey(programId), {
        connection,
      } as any);

      if (idl) {
        fs.writeFileSync(
          `./idl/${name}.json`,
          JSON.stringify(idl, null, 2)
        );
        console.log(`✅ Downloaded IDL for ${name}`);
      } else {
        console.log(`⚠️  No IDL found for ${name}`);
      }
    } catch (error) {
      console.error(`❌ Error downloading ${name}:`, error.message);
    }
  }
}

downloadIdls();
```

Run it:
```bash
mkdir idl
npm install @project-serum/anchor @solana/web3.js
ts-node download-idls.ts
```

#### Method B: Use Solana Playground to Generate IDLs

1. Go to https://beta.solpg.io
2. Create new project for each program
3. Paste the program code (lib.rs)
4. Click "Build" 
5. Download the generated IDL file
6. Repeat for all 5 enhanced programs

---

## 🎯 OPTION 3: Use Pre-Generated IDLs (FASTEST)

If you have the `.so` files or access to the deployed programs, you can extract IDLs:

```bash
# If you have the .so files
solana program dump <PROGRAM_ID> program.so
anchor idl parse -f program.so > program_idl.json
```

---

## 📦 OPTION 4: Skip Building - Use Frontend Only

Since all programs are **already deployed**, you can skip the build process entirely and just set up the frontend:

### Step 1: Create IDL Directory Structure

```
analos-nft-launchpad/
├── idl/
│   ├── analos_nft_launchpad.json
│   ├── analos_token_launch.json
│   ├── analos_rarity_oracle.json
│   ├── analos_price_oracle.json
│   ├── analos_otc_enhanced.json
│   ├── analos_airdrop_enhanced.json
│   ├── analos_vesting_enhanced.json
│   ├── analos_token_lock_enhanced.json
│   └── analos_monitoring_system.json
└── src/
    └── lib/
        └── programs.ts
```

### Step 2: Create Program Integration File

Create `src/lib/programs.ts`:

```typescript
import * as anchor from "@project-serum/anchor";
import { PublicKey, Connection } from "@solana/web3.js";
import { AnchorProvider, Program } from "@project-serum/anchor";

// Import IDLs
import nftLaunchpadIdl from "../../idl/analos_nft_launchpad.json";
import tokenLaunchIdl from "../../idl/analos_token_launch.json";
import rarityOracleIdl from "../../idl/analos_rarity_oracle.json";
import priceOracleIdl from "../../idl/analos_price_oracle.json";
import otcEnhancedIdl from "../../idl/analos_otc_enhanced.json";
import airdropEnhancedIdl from "../../idl/analos_airdrop_enhanced.json";
import vestingEnhancedIdl from "../../idl/analos_vesting_enhanced.json";
import tokenLockEnhancedIdl from "../../idl/analos_token_lock_enhanced.json";
import monitoringSystemIdl from "../../idl/analos_monitoring_system.json";

export const PROGRAM_IDS = {
  nftLaunchpad: new PublicKey("5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT"),
  tokenLaunch: new PublicKey("CDJZZCSod3YS9crpWAvWSLWEpPyx9QZCRRAcv7xL1FZf"),
  rarityOracle: new PublicKey("3cnHMbD3Y88BZbxEPzv7WZGkN12X2bwKEP4FFtaVd5B2"),
  priceOracle: new PublicKey("5ihyquuoRJXTocBhjEA48rGQGsM9ZB6HezYE1dQq8NUD"),
  otcEnhanced: new PublicKey("7hnWVgRxu2dNWiNAzNB2jWoubzMcdY6HNysjhLiawXPY"),
  airdropEnhanced: new PublicKey("J2D1LiSGxj9vTN7vc3CUD1LkrnqanAeAoAhE2nvvyXHC"),
  vestingEnhanced: new PublicKey("Ae3hXKsHzYPCPUKLtq2mdYZ3E2oKeKrF63ekceGxpHsY"),
  tokenLockEnhanced: new PublicKey("3WmPLvyFpmQ8yPHh7nLxj6FLSATn2uVeD2ceNpuRKwZH"),
  monitoringSystem: new PublicKey("7PT1ubRGFWXFCmZTpsa9gtm9GZf8BaYTkSd7gE8VcXdG"),
};

export class ProgramManager {
  public nftLaunchpad: Program;
  public tokenLaunch: Program;
  public rarityOracle: Program;
  public priceOracle: Program;
  public otcEnhanced: Program;
  public airdropEnhanced: Program;
  public vestingEnhanced: Program;
  public tokenLockEnhanced: Program;
  public monitoringSystem: Program;

  constructor(provider: AnchorProvider) {
    this.nftLaunchpad = new Program(nftLaunchpadIdl as any, PROGRAM_IDS.nftLaunchpad, provider);
    this.tokenLaunch = new Program(tokenLaunchIdl as any, PROGRAM_IDS.tokenLaunch, provider);
    this.rarityOracle = new Program(rarityOracleIdl as any, PROGRAM_IDS.rarityOracle, provider);
    this.priceOracle = new Program(priceOracleIdl as any, PROGRAM_IDS.priceOracle, provider);
    this.otcEnhanced = new Program(otcEnhancedIdl as any, PROGRAM_IDS.otcEnhanced, provider);
    this.airdropEnhanced = new Program(airdropEnhancedIdl as any, PROGRAM_IDS.airdropEnhanced, provider);
    this.vestingEnhanced = new Program(vestingEnhancedIdl as any, PROGRAM_IDS.vestingEnhanced, provider);
    this.tokenLockEnhanced = new Program(tokenLockEnhancedIdl as any, PROGRAM_IDS.tokenLockEnhanced, provider);
    this.monitoringSystem = new Program(monitoringSystemIdl as any, PROGRAM_IDS.monitoringSystem, provider);
  }

  static async initialize(connection: Connection, wallet: any): Promise<ProgramManager> {
    const provider = new AnchorProvider(
      connection,
      wallet,
      { commitment: "confirmed" }
    );
    return new ProgramManager(provider);
  }
}

// Export individual program loaders for selective usage
export const loadNFTLaunchpad = (provider: AnchorProvider) => 
  new Program(nftLaunchpadIdl as any, PROGRAM_IDS.nftLaunchpad, provider);

export const loadOTCEnhanced = (provider: AnchorProvider) => 
  new Program(otcEnhancedIdl as any, PROGRAM_IDS.otcEnhanced, provider);

export const loadAirdropEnhanced = (provider: AnchorProvider) => 
  new Program(airdropEnhancedIdl as any, PROGRAM_IDS.airdropEnhanced, provider);

export const loadVestingEnhanced = (provider: AnchorProvider) => 
  new Program(vestingEnhancedIdl as any, PROGRAM_IDS.vestingEnhanced, provider);

export const loadTokenLockEnhanced = (provider: AnchorProvider) => 
  new Program(tokenLockEnhancedIdl as any, PROGRAM_IDS.tokenLockEnhanced, provider);

export const loadMonitoringSystem = (provider: AnchorProvider) => 
  new Program(monitoringSystemIdl as any, PROGRAM_IDS.monitoringSystem, provider);
```

### Step 3: Use in Your App

```typescript
// In your React/Next.js component
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { ProgramManager } from "./lib/programs";

function MyComponent() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [programs, setPrograms] = useState<ProgramManager | null>(null);

  useEffect(() => {
    if (wallet.publicKey) {
      ProgramManager.initialize(connection, wallet).then(setPrograms);
    }
  }, [connection, wallet]);

  // Use programs
  const mintNFT = async () => {
    if (!programs) return;
    
    await programs.nftLaunchpad.methods
      .mintPlaceholder()
      .accounts({...})
      .rpc();
  };

  const createAirdrop = async () => {
    if (!programs) return;
    
    await programs.airdropEnhanced.methods
      .initializeAirdrop(merkleRoot, totalAmount)
      .accounts({...})
      .rpc();
  };

  return <div>...</div>;
}
```

---

## 🔥 OPTION 5: Contact Original Deployer for IDLs

Since the programs are already deployed, the person who deployed them should have:
- The `.so` files
- The IDL files
- The keypairs

**Ask them to share:**
1. All 9 IDL JSON files
2. Copy them to your `idl/` directory
3. Use the frontend integration code above

---

## 📋 What the Builder Actually Needs

### ✅ Minimal Requirements for Frontend:

1. **IDL Files** - JSON files describing each program's interface
2. **Program IDs** - Already have these in Anchor.toml ✓
3. **Frontend Integration Code** - Provided above ✓

### ❌ What's NOT Required:

- Building the Rust programs locally
- Solana BPF SDK installation
- Anchor build environment
- Program deployment

**Why?** Because the programs are **already deployed on mainnet!**

---

## 🎯 Recommended Workflow for Builder

### Easy Path (No Build Required):

```bash
# 1. Get IDL files (choose one method):
#    - Download from chain (Option 2A)
#    - Use Solana Playground (Option 2B)
#    - Request from deployer (Option 5)

# 2. Place IDL files in correct location
mkdir -p analos-nft-launchpad/idl/
# Copy all .json files to idl/

# 3. Install frontend dependencies only
cd analos-nft-launchpad
npm install @project-serum/anchor @solana/web3.js @solana/wallet-adapter-react

# 4. Add the programs.ts file
# (Copy code from Step 2 above)

# 5. Use in your frontend
# (Copy usage examples from Step 3)

# 6. Test
npm run dev
```

### If Build is Required (Full Setup):

```bash
# 1. Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# 2. Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 3. Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.28.0
avm use 0.28.0

# 4. Set environment variables
export HOME=$HOME
export PATH=$PATH:$HOME/.local/share/solana/install/active_release/bin

# 5. Build
cd analos-nft-launchpad
anchor build

# 6. Extract IDLs
anchor idl parse -f target/deploy/analos_otc_enhanced.so > idl/analos_otc_enhanced.json
# Repeat for each program
```

---

## 💡 Pro Tips

### Tip 1: Use Version Control
```bash
# Commit IDL files to git
git add idl/*.json
git commit -m "Add IDL files for all programs"
```

### Tip 2: Verify Program IDs on Chain
```bash
# Check if program exists
solana program show 7hnWVgRxu2dNWiNAzNB2jWoubzMcdY6HNysjhLiawXPY
```

### Tip 3: Test on Devnet First
```typescript
// Use devnet for testing
const connection = new Connection("https://api.devnet.solana.com");
```

### Tip 4: Create Mock IDLs for Testing
If you can't get real IDLs immediately, create minimal mock IDLs:

```json
{
  "version": "0.1.0",
  "name": "analos_otc_enhanced",
  "instructions": [
    {
      "name": "createOffer",
      "accounts": [],
      "args": []
    }
  ],
  "accounts": [],
  "types": [],
  "errors": []
}
```

---

## 🚨 Critical Information for Builder

### Programs Are Already Deployed ✅

You **DO NOT** need to:
- ❌ Build Rust programs
- ❌ Install Solana BPF SDK
- ❌ Deploy to mainnet
- ❌ Generate new program IDs

You **ONLY** need to:
- ✅ Get IDL files
- ✅ Set up frontend integration
- ✅ Connect to existing programs

### This Saves You:
- Hours of build environment setup
- Deployment costs (already paid)
- Program ID generation
- Testing on mainnet

---

## 📞 Quick Help Commands

```bash
# Check Solana version
solana --version

# Check Anchor version
anchor --version

# Check if program exists on chain
solana program show <PROGRAM_ID>

# Fetch IDL from chain
anchor idl fetch <PROGRAM_ID> -o program.json

# Test connection
solana cluster-version

# Check wallet
solana address
```

---

## ✅ Success Checklist

- [ ] Have all 9 IDL JSON files
- [ ] Created `programs.ts` integration file
- [ ] Can import programs in frontend
- [ ] Tested connection to at least one program
- [ ] Verified program IDs match Anchor.toml
- [ ] Frontend can call program functions
- [ ] Error handling implemented

---

## 🎉 You're Ready!

Once you have the IDL files, you can:
1. Import them in your frontend
2. Call program functions
3. Build your UI
4. Deploy to Railway/Vercel
5. Go live!

**No Rust compilation needed!** 🚀

---

**Last Updated:** October 2025  
**For:** Analos NFT Launchpad Integration  
**Status:** Programs Already Deployed ✅

