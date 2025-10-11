# 🎨 METAPLEX TOKEN METADATA - DEPLOY TO ANALOS

## 📋 OVERVIEW

We'll deploy the standard Metaplex Token Metadata program to Analos so your NFTs are compatible with wallets and marketplaces.

**Important:** This will work ALONGSIDE your existing 4 programs, not replace them.

---

## 🎯 DEPLOYMENT STRATEGY

### **Architecture:**
```
Your NFT Launchpad (Custom)
    ├── Blind Mint System
    ├── Rarity Calculation  
    ├── Reveal Mechanism
    └── When NFT is REVEALED → Create Metaplex Metadata
                                    │
                                    ▼
                            Metaplex Token Metadata
                                (Standard Format)
                                    │
                                    ▼
                            Compatible with Wallets/Marketplaces
```

**Flow:**
1. User mints → Your custom NFT Launchpad creates placeholder
2. User reveals → Your program assigns traits
3. Backend generates image → Uploads to IPFS
4. **NEW:** Create Metaplex metadata → Now visible in Phantom/Solflare!

---

## 🔧 STEP 1: CHECK METAPLEX SOURCE CODE

<function_calls>
<invoke name="run_terminal_cmd">
<parameter name="command">cd C:\Users\dusti\OneDrive\Desktop\LosLauncher && Test-Path "metaplex-standalone"
