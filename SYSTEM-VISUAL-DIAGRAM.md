# 📊 LOSLAUNCHER - VISUAL SYSTEM DIAGRAMS

## 🏛️ ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────┐
│                         LOSLAUNCHER PLATFORM                         │
└─────────────────────────────────────────────────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐         ┌───────────────┐        ┌──────────────┐
│   FRONTEND    │         │    BACKEND    │        │  BLOCKCHAIN  │
│   (Next.js)   │◄───────►│   (Node.js)   │◄──────►│   (Analos)   │
│               │  HTTP   │               │  RPC   │              │
│  - UI/UX      │         │  - API Routes │        │ - 4 Programs │
│  - Web3 Calls │         │  - IPFS       │        │ - On-chain   │
│  - Wallet     │         │  - Rarity     │        │   Data       │
└───────────────┘         └───────────────┘        └──────────────┘
```

---

## 🔗 PROGRAM HIERARCHY (Grandparent → Parent → Child)

```
                    ╔════════════════════════════════════════╗
                    ║     NFT LAUNCHPAD (GRANDPARENT)        ║
                    ║  5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b  ║
                    ║                                        ║
                    ║  • Orchestrates entire NFT lifecycle   ║
                    ║  • Manages collections                 ║
                    ║  • Controls minting & revealing        ║
                    ║  • Community governance                ║
                    ╚════════════════════════════════════════╝
                              │      │      │
          ┌───────────────────┼──────┼──────┼───────────────────┐
          │                   │      │      │                   │
          ▼                   ▼      ▼      ▼                   ▼
    ╔═══════════╗       ╔═════════╗╔═════════╗       ╔═══════════╗
    ║   PRICE   ║       ║ RARITY  ║║  TOKEN  ║       ║ WHITELIST ║
    ║  ORACLE   ║       ║ ORACLE  ║║ LAUNCH  ║       ║  MANAGER  ║
    ║ (PARENT)  ║       ║(PARENT) ║║(PARENT) ║       ║ (PARENT)  ║
    ╚═══════════╝       ╚═════════╝╚═════════╝       ╚═══════════╝
          │                   │          │                  │
    ┌─────┴─────┐       ┌─────┴─────┐  │            ┌─────┴─────┐
    ▼           ▼       ▼           ▼  │            ▼           ▼
┌────────┐ ┌────────┐┌────────┐┌────────┐         ┌───┐      ┌───┐
│USD→LOS │ │ Price  ││ Trait  ││ Rarity ││         │Add│      │Del│
│Convert │ │ Update ││ Track  ││ Score  ││         └───┘      └───┘
└────────┘ └────────┘└────────┘└────────┘         CHILDREN
 CHILDREN             CHILDREN            
                                │
                          ┌─────┴─────┐
                          ▼           ▼
                      ┌────────┐ ┌────────┐
                      │ Mint   │ │ Bonding│
                      │ w/Curve│ │ Calc   │
                      └────────┘ └────────┘
                       CHILDREN
```

---

## 🔄 COMPLETE USER FLOW (Blind Mint → Reveal)

```
👤 USER                 💻 FRONTEND           🖥️  BACKEND           ⛓️  BLOCKCHAIN
  │                         │                     │                      │
  │ 1. Connect Wallet       │                     │                      │
  ├────────────────────────►│                     │                      │
  │                         │                     │                      │
  │                         │ 2. Fetch Collection Data                   │
  │                         ├─────────────────────────────────────────►│
  │                         │                     │    NFT Launchpad     │
  │                         │◄─────────────────────────────────────────┤
  │                         │    CollectionConfig │                      │
  │                         │                     │                      │
  │                         │ 3. Get $LOS Price   │                      │
  │                         ├─────────────────────────────────────────►│
  │                         │                     │    Price Oracle      │
  │                         │◄─────────────────────────────────────────┤
  │                         │    Current Price    │                      │
  │                         │                     │                      │
  │ 4. Click "Mint"         │                     │                      │
  ├────────────────────────►│                     │                      │
  │                         │                     │                      │
  │                         │ 5. Build Transaction│                      │
  │                         │     mint_placeholder│                      │
  │                         ├─────────────────────────────────────────►│
  │                         │                     │    NFT Launchpad     │
  │                         │                     │    ┌──────────────┐  │
  │                         │                     │    │ • Check Pay  │  │
  │                         │                     │    │ • Verify WL  │  │
  │                         │                     │    │ • Mint NFT   │  │
  │                         │                     │    └──────────────┘  │
  │                         │◄─────────────────────────────────────────┤
  │                         │    MintEvent        │                      │
  │                         │                     │                      │
  │ 6. Unrevealed NFT ✅    │                     │                      │
  │◄────────────────────────┤                     │                      │
  │   (Mystery Box)         │                     │                      │
  │                         │                     │                      │
  │         ⏰ WAITING FOR REVEAL ⏰              │                      │
  │                         │                     │                      │
🎨 CREATOR                  │                     │                      │
  │ 7. Commit Reveal Data   │                     │                      │
  ├────────────────────────►│                     │                      │
  │                         ├─────────────────────────────────────────►│
  │                         │  commit_reveal_data │    NFT Launchpad     │
  │                         │    (seed hash)      │                      │
  │                         │                     │                      │
  │ 8. Trigger Reveal       │                     │                      │
  ├────────────────────────►│                     │                      │
  │                         ├─────────────────────────────────────────►│
  │                         │  reveal_collection  │    NFT Launchpad     │
  │                         │                     │                      │
👤 USER                     │                     │                      │
  │ 9. Click "Reveal"       │                     │                      │
  ├────────────────────────►│                     │                      │
  │                         │                     │                      │
  │                         │ 10. Build Reveal TX │                      │
  │                         ├─────────────────────────────────────────►│
  │                         │    reveal_nft       │    NFT Launchpad     │
  │                         │    (reveal_seed)    │    ┌──────────────┐  │
  │                         │                     │    │ • Verify Hash│  │
  │                         │                     │    │ • Gen Traits │  │
  │                         │                     │    │ • CPI Rarity │─┼─┐
  │                         │                     │    └──────────────┘  │ │
  │                         │                     │                      │ │
  │                         │                     │    ┌──────────────┐  │ │
  │                         │                     │    │Rarity Oracle │◄─┘ │
  │                         │                     │    │• Calc Score  │    │
  │                         │                     │    │• Return 0-100│────┤
  │                         │                     │    └──────────────┘    │
  │                         │◄─────────────────────────────────────────────┤
  │                         │    RevealEvent      │                        │
  │                         │    (traits + rarity)│                        │
  │                         │                     │                        │
  │                         │ 11. Detect Event    │                        │
  │                         ├────────────────────►│                        │
  │                         │                     │ 12. Generate Image     │
  │                         │                     │     Upload to IPFS     │
  │                         │                     │     ┌──────────────┐   │
  │                         │                     │     │ NFT.Storage  │   │
  │                         │                     │     │   Pinata     │   │
  │                         │                     │     └──────────────┘   │
  │                         │◄────────────────────┤                        │
  │                         │    IPFS URLs        │                        │
  │                         │                     │                        │
  │ 13. Revealed NFT! 🎉    │                     │                        │
  │◄────────────────────────┤                     │                        │
  │  • Traits visible       │                     │                        │
  │  • Rarity score shown   │                     │                        │
  │  • Image displayed      │                     │                        │
```

---

## 💰 PRICE ORACLE INTEGRATION

```
┌─────────────────────────────────────────────────────────────┐
│                     PRICE ORACLE FLOW                        │
└─────────────────────────────────────────────────────────────┘

📈 ADMIN                      🏦 PRICE ORACLE              💳 NFT LAUNCHPAD
   │                               │                            │
   │ 1. Update Market Cap          │                            │
   ├──────────────────────────────►│                            │
   │   $LOS MC = $500,000 USD      │                            │
   │                               │                            │
   │                               │ 2. Calculate Price         │
   │                               │    $LOS = $0.005           │
   │                               │    Store timestamp         │
   │                               │                            │
   │                               │◄───────────────────────────┤
   │                               │ 3. CPI: Get USD→LOS       │
   │                               │    convert($10 USD)        │
   │                               │                            │
   │                               ├───────────────────────────►│
   │                               │    Return: 2,000 $LOS      │
   │                               │                            │
   │                               │                            │ 4. User Mints
👤 USER ──────────────────────────────────────────────────────►│    Pays 2,000 LOS
   │                               │                            │    ($10 USD equiv)
   │                               │                            │
   │◄──────────────────────────────────────────────────────────┤ 5. NFT Minted ✅
   │                               │                            │

✅ BENEFITS:
  • USD-stable pricing (always $10)
  • Protects users from $LOS volatility
  • Auto-adjusts with market
  • Price staleness checks (5 min max)
```

---

## 🎲 RARITY CALCULATION FLOW

```
┌─────────────────────────────────────────────────────────────┐
│                  RARITY ORACLE FLOW                          │
└─────────────────────────────────────────────────────────────┘

🎨 CREATOR                  📊 RARITY ORACLE          🖼️  NFT METADATA
   │                            │                          │
   │ 1. Register Traits         │                          │
   ├───────────────────────────►│                          │
   │  Hair: [Brown, Blonde, Red]│                          │
   │  Eyes: [Blue, Green, Brown]│                          │
   │  BG: [Sky, Forest, City]   │                          │
   │                            │                          │
   │                            │ 2. Init Counters         │
   │                            │    Each trait = 0        │
   │                            │                          │
   │                            │◄─────────────────────────┤
   │                            │ 3. NFT Revealed          │
   │                            │    Traits: Red Hair,     │
   │                            │           Green Eyes,    │
   │                            │           Sky BG         │
   │                            │                          │
   │                            │ 4. Calculate Rarity      │
   │                            │    Red Hair: 15% (rare)  │
   │                            │    Green: 30% (uncommon) │
   │                            │    Sky: 50% (common)     │
   │                            │                          │
   │                            │    Overall: 65/100       │
   │                            │    Tier: UNCOMMON        │
   │                            │                          │
   │                            ├─────────────────────────►│
   │                            │    Store rarity_score    │
   │                            │                          │
   │                            │                          │
👤 USER ◄──────────────────────────────────────────────────────┤
   │  See NFT with rarity       │                          │
   │  "Uncommon (65/100)"       │                          │

📊 RARITY TIERS:
   100 ║ ████████ LEGENDARY (95-100) - Top 5%
    95 ║
    85 ║ ██████ EPIC (85-95) - Next 10%
    70 ║ ████ RARE (70-85) - Next 15%
    50 ║ ██ UNCOMMON (50-70) - Next 20%
     0 ║ COMMON (0-50) - Bottom 50%
```

---

## 🔐 COMMIT-REVEAL RANDOMNESS

```
┌─────────────────────────────────────────────────────────────┐
│              COMMIT-REVEAL FAIRNESS MECHANISM                │
└─────────────────────────────────────────────────────────────┘

PHASE 1: MINTING
────────────────
👥 USERS                    ⛓️  BLOCKCHAIN
  │                            │
  │ Mint NFT #1               │
  ├──────────────────────────►│  Placeholder created
  │                            │  ❓ Traits unknown
  │                            │
  │ Mint NFT #2               │
  ├──────────────────────────►│  Placeholder created
  │                            │  ❓ Traits unknown
  │                            │
  │ ... more mints ...         │
  │                            │

PHASE 2: COMMIT (Creator locks in randomness)
──────────────────────────────────────────────
🎨 CREATOR                  ⛓️  BLOCKCHAIN
  │                            │
  │ Generate Secret Seed       │
  │ seed = "x8k2n9p..."       │
  │                            │
  │ Hash the seed             │
  │ hash = SHA256(seed)       │
  │                            │
  │ Commit hash on-chain      │
  ├──────────────────────────►│  Store hash
  │                            │  🔒 Seed hidden
  │                            │  ✅ Can't change now

PHASE 3: REVEAL (Creator reveals seed, blockchain verifies)
────────────────────────────────────────────────────────────
🎨 CREATOR                  ⛓️  BLOCKCHAIN              👤 USER
  │                            │                         │
  │ Reveal seed               │                         │
  ├──────────────────────────►│ Verify:                 │
  │ seed = "x8k2n9p..."       │ SHA256(seed) == hash?   │
  │                            │                         │
  │                            │ ✅ Valid!               │
  │                            │                         │
  │                            │ For each NFT:           │
  │                            │ ┌──────────────────┐   │
  │                            │ │ random = hash(   │   │
  │                            │ │   seed +         │   │
  │                            │ │   nft_number +   │   │
  │                            │ │   slot           │   │
  │                            │ │ )                │   │
  │                            │ └──────────────────┘   │
  │                            │                         │
  │                            │ Traits assigned         │
  │                            │ based on random         │
  │                            │                         │
  │                            ├────────────────────────►│
  │                            │ Revealed NFT ✅         │

✅ FAIRNESS GUARANTEED:
  • Creator can't see traits before committing seed
  • Users can't predict their traits before reveal
  • Seed hash proves creator didn't change randomness
  • On-chain verification ensures no manipulation
```

---

## 🏢 BACKEND API ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND API STRUCTURE                      │
└─────────────────────────────────────────────────────────────┘

📱 CLIENT REQUEST                           🖥️  BACKEND SERVER
     │                                           │
     │ POST /api/nft-generator/calculate-rarity │
     ├──────────────────────────────────────────►│
     │  {                                        │
     │    nftTraits: {...},                      │
     │    allTraitsData: {...}                   │ ┌─────────────────┐
     │  }                                        ├─┤ Rarity          │
     │                                           │ │ Calculator      │
     │                                           │ │ Service         │
     │                                           │ └─────────────────┘
     │◄──────────────────────────────────────────┤
     │  {                                        │
     │    overallRarity: 75.2,                   │
     │    rarityTier: "Rare"                     │
     │  }                                        │
     │                                           │
     │ POST /api/nft-generator/upload-image     │
     ├──────────────────────────────────────────►│
     │  FormData(image: File)                    │ ┌─────────────────┐
     │                                           ├─┤ IPFS            │
     │                                           │ │ Integration     │
     │                                           │ │                 │
     │                                           │ │ ├─NFT.Storage  │
     │                                           │ │ └─Pinata        │
     │                                           │ └─────────────────┘
     │◄──────────────────────────────────────────┤
     │  {                                        │
     │    nftStorageCID: "bafy...",              │
     │    pinataCID: "bafy...",                  │
     │    gatewayURLs: [...]                     │
     │  }                                        │
     │                                           │
     │ POST /api/nft-generator/upload-metadata  │
     ├──────────────────────────────────────────►│
     │  {                                        │
     │    name: "Cool NFT #1",                   │ ┌─────────────────┐
     │    image: "ipfs://...",                   ├─┤ IPFS Upload     │
     │    attributes: [...]                      │ │ (Metadata)      │
     │  }                                        │ └─────────────────┘
     │◄──────────────────────────────────────────┤
     │  {                                        │
     │    metadataCID: "bafy...",                │
     │    metadataURL: "https://..."             │
     │  }                                        │

ENDPOINTS:
  ├─ /api/nft-generator
  │   ├─ POST /calculate-rarity     → Rarity Calculator Service
  │   ├─ POST /upload-image         → IPFS Integration (Dual)
  │   ├─ POST /upload-metadata      → IPFS Integration (Dual)
  │   └─ POST /generate-complete    → Full Pipeline

SERVICES:
  ├─ enhanced-rarity-calculator.ts
  │   └─ Statistical rarity algorithms
  │
  └─ ipfs-integration.ts
      ├─ NFT.Storage client (primary)
      └─ Pinata client (backup)
```

---

## 🌐 DEPLOYMENT ARCHITECTURE

```
┌────────────────────────────────────────────────────────────────┐
│                     DEPLOYMENT TOPOLOGY                         │
└────────────────────────────────────────────────────────────────┘

👤 END USERS
   │
   │ HTTPS
   ▼
┌──────────────────┐
│   VERCEL CDN     │  Frontend Hosting
│   (Next.js)      │  • Global CDN
│                  │  • Auto-scaling
└──────────────────┘  • SSL included
   │
   │ HTTPS API Calls
   ▼
┌──────────────────┐
│   RAILWAY        │  Backend Hosting
│   (Node.js)      │  • Container deployment
│                  │  • Auto-scaling
│   ┌────────────┐ │  • Env vars mgmt
│   │ Express API│ │
│   └────────────┘ │
└──────────────────┘
   │                │
   │ RPC            │ IPFS
   ▼                ▼
┌──────────────┐  ┌─────────────┐
│   ANALOS     │  │ NFT.Storage │
│  BLOCKCHAIN  │  │   Pinata    │
│              │  │             │
│ • Programs   │  │ • Images    │
│ • Accounts   │  │ • Metadata  │
│ • Events     │  │             │
└──────────────┘  └─────────────┘

INFRASTRUCTURE:
  Frontend:  Vercel (Next.js, React)
  Backend:   Railway (Node.js, Express)
  Blockchain: Analos (Solana fork)
  Storage:   IPFS (NFT.Storage + Pinata)
  Database:  PostgreSQL (optional, for indexing)
```

---

## ✅ SUMMARY CHECKLIST

```
BLOCKCHAIN PROGRAMS (All Deployed ✅)
  ✅ Price Oracle     - ztA5VFYMy29tgWpkAioro4HTfXQTgwpPinv9uSEdCMn
  ✅ Rarity Oracle    - H6sAs9Ewx6BNSF3NkPEEtwZo3kfFw4Y71us5U6D5rvW6
  ✅ Token Launch     - HLkjxfp8eonnKdLMoN7otZBHetRMoRaQmHvyDvGjnzVx
  ✅ NFT Launchpad    - 5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT

BACKEND COMPONENTS
  ✅ Express server configured
  ✅ NFT generator routes created
  ✅ Rarity calculator implemented
  ✅ IPFS integration (dual providers)
  ✅ Environment config ready
  ⏳ Pinata API keys needed
  ⏳ Railway deployment pending

FRONTEND COMPONENTS
  ✅ Program config file created
  ✅ Enhanced generator component
  ✅ Web3 integration setup
  ⏳ Vercel deployment pending

READY TO LAUNCH! 🚀
```

---

**Use these diagrams to visualize the complete LosLauncher system architecture!**

