# 🔗 **Complete System Integration Guide**

## **How All 4 Programs Work Together**

---

## 🎯 **System Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPLETE USER JOURNEY                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  STEP 1: CREATOR INITIALIZES COLLECTION                         │
│  ├─> NFT Launchpad: Create collection ($10 USD base)           │
│  ├─> Token Launch: Setup token (10k per NFT, 69/25/6 split)    │
│  ├─> Rarity Oracle: Configure tiers (Common → Mythic)          │
│  └─> Price Oracle: Initialize ($LOS @ $0.001)                  │
│                                                                 │
│  STEP 2: USER MINTS NFT                                         │
│  ├─> Price Oracle: Get current $LOS price                      │
│  ├─> NFT Launchpad: Calculate LOS amount for $10 USD           │
│  │   ├─> User pays (e.g., 10,000 LOS if $LOS = $0.001)        │
│  │   ├─> Distribute fees (6% to LOL ecosystem)                │
│  │   └─> 69% to pool, 25% to creator escrow                   │
│  ├─> CPI → Token Launch: Mint 10,000 tokens to escrow          │
│  └─> User receives NFT (placeholder)                           │
│                                                                 │
│  STEP 3: USER REVEALS NFT                                       │
│  ├─> NFT Launchpad: User pays reveal fee (optional)            │
│  ├─> CPI → Rarity Oracle: Determine rarity                     │
│  │   ├─> Verifiable randomness                                │
│  │   ├─> Roll: 9,987 → Mythic! 🔥                             │
│  │   └─> Multiplier: 1000x                                     │
│  ├─> CPI → Token Launch: Distribute tokens                     │
│  │   └─> User receives: 10,000,000 tokens!                    │
│  └─> NFT metadata updated                                      │
│                                                                 │
│  STEP 4: COLLECTION BONDS (All 10k Minted)                      │
│  ├─> Token Launch: Trigger bonding                             │
│  │   ├─> Calculate: 69% pool, 25% creator, 6% distributed     │
│  │   ├─> Pool: 721M tokens + $103,500 worth LOS               │
│  │   ├─> Creator: 261M tokens (10% immediate, 15% vested)     │
│  │   └─> Start vesting schedule (12 months)                   │
│  ├─> Create DLMM Pool on Meteora                              │
│  │   └─> Initial price: ~$0.0001435                           │
│  └─> Trading enabled!                                          │
│                                                                 │
│  STEP 5: TRADING                                                │
│  ├─> Users trade tokens on losscreener.com                    │
│  ├─> Price discovery                                           │
│  ├─> Trading fees collected                                    │
│  └─> Creator claims fees anytime                               │
│                                                                 │
│  STEP 6: BUYBACK (Optional)                                     │
│  ├─> User burns tokens (~112k tokens = ~$16 worth)            │
│  ├─> CPI → NFT Launchpad: Mint new NFT                        │
│  ├─> User reveals again                                        │
│  └─> New rarity chance! 🎲                                     │
│                                                                 │
│  STEP 7: CREATOR VESTING (Monthly)                             │
│  ├─> Month 1: Claim 13M tokens                                │
│  ├─> Month 2: Claim 13M tokens                                │
│  ├─> ... continues for 12 months                               │
│  └─> Plus trading fees anytime!                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 **CPI Integration Points**

### **1. NFT Mint → Token Mint**

```rust
// In NFT Launchpad: mint_placeholder()

// After minting NFT, mint tokens
let cpi_program = ctx.accounts.token_launch_program.to_account_info();
let cpi_accounts = MintTokensForNFT {
    token_launch_config,
    token_mint,
    token_escrow,
    token_program,
};
let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

analos_token_launch::cpi::mint_tokens_for_nft(
    cpi_ctx,
    ctx.accounts.nft_mint.key()
)?;
```

### **2. NFT Reveal → Rarity Determination**

```rust
// In NFT Launchpad: reveal_nft_with_fee()

// Determine rarity
let cpi_program = ctx.accounts.rarity_oracle_program.to_account_info();
let cpi_accounts = DetermineRarity {
    rarity_config,
    rarity_determination,
    nft_mint,
    oracle_authority,
    system_program,
};
let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

analos_rarity_oracle::cpi::determine_rarity(
    cpi_ctx,
    ctx.accounts.nft_mint.key(),
    config.current_supply
)?;
```

### **3. Rarity → Token Distribution**

```rust
// In Rarity Oracle: determine_rarity()

// After determining rarity, distribute tokens
let cpi_program = ctx.accounts.token_launch_program.to_account_info();
let cpi_accounts = DistributeTokens {
    token_launch_config,
    user_token_claim,
    token_escrow,
    user_token_account,
    user,
    token_program,
    system_program,
};
let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

analos_token_launch::cpi::distribute_tokens_by_rarity(
    cpi_ctx,
    nft_mint,
    determination.rarity_tier,
    determination.token_multiplier
)?;
```

### **4. Price Oracle → NFT Pricing**

```rust
// In NFT Launchpad: sync_price_with_oracle()

// Read oracle price
let oracle = &ctx.accounts.price_oracle;
let los_price_usd = oracle.los_price_usd;

// Calculate new price in LOS
if let Some(target_usd) = config.target_price_usd {
    let new_price_lamports = target_usd * 10u64.pow(9) / los_price_usd;
    config.price_lamports = new_price_lamports;
}
```

---

## 📊 **Complete Data Flow**

### **Example: User Mints & Reveals**

```typescript
// 1. User mints NFT
const mintTx = await nftLaunchpad.methods
    .mintPlaceholder()
    .accounts({
        collectionConfig,
        nftMint: newNFT.publicKey,
        payer: user.publicKey,
        // ... other accounts
    })
    .signers([user, newNFT])
    .rpc();

// Behind the scenes:
// - Price Oracle queried for current $LOS price
// - NFT price calculated in LOS for $10 USD
// - Fees distributed (6% to LOL ecosystem)
// - 69% to pool escrow, 25% to creator escrow
// - CPI to Token Launch: 10,000 tokens minted to escrow
// - NFT minted to user

console.log("✅ NFT minted!");
console.log("   10,000 tokens created (held until reveal)");

// 2. User reveals NFT
const revealTx = await nftLaunchpad.methods
    .revealNftWithFee()
    .accounts({
        collectionConfig,
        nftMint: newNFT.publicKey,
        payer: user.publicKey,
        // ... other accounts
    })
    .signers([user])
    .rpc();

// Behind the scenes:
// - Reveal fee paid (if enabled)
// - CPI to Rarity Oracle: Determine rarity
//   - Random roll: 9,987 → Mythic!
//   - Multiplier: 1000x
// - CPI to Token Launch: Distribute tokens
//   - User receives: 10,000,000 tokens!
// - NFT metadata updated

console.log("🎉 NFT revealed: MYTHIC!");
console.log("   Received: 10,000,000 tokens!");

// 3. Check balances
const tokenBalance = await connection.getTokenAccountBalance(userTokenAccount);
console.log(`Token Balance: ${tokenBalance.value.uiAmount.toLocaleString()} tokens`);

const claim = await tokenLaunch.account.userTokenClaim.fetch(claimPDA);
console.log(`Rarity Tier: ${claim.rarityTier}`);
console.log(`Multiplier: ${claim.tokenMultiplier}x`);
```

---

## 🎮 **Frontend Integration**

### **Step 1: Initialize Programs**

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";

// Program IDs (after deployment)
const NFT_LAUNCHPAD_ID = new PublicKey("7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk");
const TOKEN_LAUNCH_ID = new PublicKey("[deployed_token_launch_id]");
const RARITY_ORACLE_ID = new PublicKey("[deployed_rarity_oracle_id]");
const PRICE_ORACLE_ID = new PublicKey("[deployed_price_oracle_id]");

// Initialize programs
const connection = new Connection("https://rpc.analos.io");
const wallet = useWallet(); // From wallet adapter

const nftLaunchpad = new anchor.Program(nftLaunchpadIDL, NFT_LAUNCHPAD_ID, provider);
const tokenLaunch = new anchor.Program(tokenLaunchIDL, TOKEN_LAUNCH_ID, provider);
const rarityOracle = new anchor.Program(rarityOracleIDL, RARITY_ORACLE_ID, provider);
const priceOracle = new anchor.Program(priceOracleIDL, PRICE_ORACLE_ID, provider);
```

### **Step 2: Display Current Price**

```typescript
// Get current $LOS price from oracle
const oracle = await priceOracle.account.priceOracle.fetch(priceOraclePDA);
const losPriceUSD = oracle.losPriceUsd / 1e6; // Convert from 6 decimals

// Get collection config
const config = await nftLaunchpad.account.collectionConfig.fetch(collectionPDA);
const targetPriceUSD = config.targetPriceUsd / 1e6; // $10 USD

// Calculate current price in LOS
const priceInLOS = (targetPriceUSD / losPriceUSD).toFixed(2);

// Display
console.log(`NFT Price: $${targetPriceUSD} USD (${priceInLOS} LOS)`);
console.log(`$LOS Price: $${losPriceUSD}`);
```

### **Step 3: Mint Interface**

```typescript
const MintPage = () => {
    const [currentPrice, setCurrentPrice] = useState(null);
    const [losPrice, setLOSPrice] = useState(null);
    
    useEffect(() => {
        async function fetchPrices() {
            // Get oracle price
            const oracle = await priceOracle.account.priceOracle.fetch(priceOraclePDA);
            setLOSPrice(oracle.losPriceUsd / 1e6);
            
            // Get NFT price
            const config = await nftLaunchpad.account.collectionConfig.fetch(collectionPDA);
            const targetUSD = config.targetPriceUsd / 1e6;
            const losAmount = config.priceAlamports / 1e9;
            
            setCurrentPrice({ usd: targetUSD, los: losAmount });
        }
        
        fetchPrices();
        const interval = setInterval(fetchPrices, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);
    
    return (
        <div>
            <h2>Mint NFT</h2>
            <p>Price: ${currentPrice?.usd} USD</p>
            <p>({currentPrice?.los} LOS)</p>
            <p className="text-sm">$LOS @ ${losPrice}</p>
            <button onClick={handleMint}>Mint Now</button>
        </div>
    );
};
```

---

## 📦 **Deployment Checklist**

### **Programs (Solana Playground → Analos):**

- [x] NFT Launchpad - DEPLOYED: `7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk`
- [ ] Token Launch - Ready for deployment
- [ ] Rarity Oracle - Ready for deployment
- [ ] Price Oracle - Ready for deployment

### **Services (Railway):**

- [ ] Backend API (existing)
- [ ] Oracle Updater Service (new)

### **Frontend (Vercel):**

- [ ] Minting interface
- [ ] Reveal experience
- [ ] Token dashboard
- [ ] Trading integration

---

## 🚀 **Next Steps**

### **1. Deploy Remaining Programs** (Via Solana Playground)

**Token Launch:**
```
1. Open https://beta.solpg.io
2. Create project: "analos-token-launch"
3. Copy: programs/analos-token-launch/src/lib.rs
4. Build
5. Deploy to Devnet
6. Save Program ID
```

**Rarity Oracle:**
```
1. New project: "analos-rarity-oracle"
2. Copy: programs/analos-rarity-oracle/src/lib.rs
3. Build
4. Deploy to Devnet
5. Save Program ID
```

**Price Oracle:**
```
1. New project: "analos-price-oracle"
2. Copy: programs/analos-price-oracle/src/lib.rs
3. Build
4. Deploy to Devnet
5. Save Program ID
```

### **2. Test Integration on Devnet**

```typescript
// Test complete flow
await testMintAndReveal();
await testBonding();
await testBuyback();
await testPriceUpdates();
```

### **3. Deploy to Analos**

```bash
# Download from Devnet
solana program dump [DEVNET_ID] token-launch.so --url https://api.devnet.solana.com
solana program dump [DEVNET_ID] rarity-oracle.so --url https://api.devnet.solana.com
solana program dump [DEVNET_ID] price-oracle.so --url https://api.devnet.solana.com

# Deploy to Analos
solana program deploy token-launch.so --use-rpc --url https://rpc.analos.io
solana program deploy rarity-oracle.so --use-rpc --url https://rpc.analos.io
solana program deploy price-oracle.so --use-rpc --url https://rpc.analos.io
```

### **4. Update Environment Variables**

**Railway:**
```bash
NFT_LAUNCHPAD_PROGRAM_ID=7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk
TOKEN_LAUNCH_PROGRAM_ID=[new_id]
RARITY_ORACLE_PROGRAM_ID=[new_id]
PRICE_ORACLE_PROGRAM_ID=[new_id]

LOS_TOKEN_MINT=LoSVGc4rXHmeXcGF5VmT7uKYVQbLEKx6vVqKvVVpump
BIRDEYE_API_KEY=[your_key]
ORACLE_UPDATE_INTERVAL=300
```

**Vercel:**
```bash
NEXT_PUBLIC_NFT_LAUNCHPAD_ID=7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk
NEXT_PUBLIC_TOKEN_LAUNCH_ID=[new_id]
NEXT_PUBLIC_RARITY_ORACLE_ID=[new_id]
NEXT_PUBLIC_PRICE_ORACLE_ID=[new_id]
NEXT_PUBLIC_RPC_URL=https://rpc.analos.io
```

---

## 📊 **System Status**

### **Code Complete:**
- ✅ NFT Launchpad (4,772 lines)
- ✅ Token Launch (~900 lines)
- ✅ Rarity Oracle (~550 lines)
- ✅ Price Oracle (~300 lines)
- ✅ Oracle Service (Node.js)

**Total:** ~6,522 lines + services

### **Features Complete:**
- ✅ USD-pegged pricing
- ✅ Multi-source price oracle
- ✅ 69/25/6 fee split
- ✅ 12-month vesting
- ✅ Rarity system (1x-1000x)
- ✅ Creator pre-buy
- ✅ Trading fee claims
- ✅ Buyback mechanism
- ✅ $100k pool target
- ✅ Anti-dump protection

---

## 🎯 **Summary**

**All 4 Programs Ready:**
1. NFT Launchpad ✅
2. Token Launch ✅
3. Rarity Oracle ✅
4. Price Oracle ✅

**Multi-Source Oracle:**
- Jupiter ✅
- Birdeye ✅
- On-Chain ✅
- CoinGecko ✅

**Next:** Deploy to Devnet and test integration! 🚀
