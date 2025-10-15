# 🚀 NFT Launchpad Deployment Strategy

## 📊 Current Status

### ✅ Already Deployed:
1. **Price Oracle** - `B26WiDKnjeQtZTGB6BqSyFMaejXJfkxm1CKu1CYQF1D` ✅ INITIALIZED
2. **Rarity Oracle** - `C2YCPD3ZR5mWC7q1TMh2KqN43XWzCsdnbPgswGsFTDr5` ✅ DEPLOYED
3. **Token Launch** - `Eydws6TzESGgBZyEHy5BYF8sSDcsRXC4tBF9JaVqWCRw` ✅ DEPLOYED

### ⏳ To Deploy:
4. **NFT Launchpad** - Main program that integrates all 3

---

## 🎯 Integration Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   NFT LAUNCHPAD                          │
│              (Main Orchestration Program)                │
│                                                          │
│  Features:                                              │
│  • Blind Mint & Reveal                                  │
│  • Fee Distribution (8.9%)                              │
│  • Bubblegum Compressed NFTs                            │
│  • Whitelist Management                                 │
│  • Collection Governance                                │
└───────────────┬─────────────┬──────────────┬───────────┘
                │             │              │
          CPI ┌─┘             │              └─┐ CPI
              │               │ CPI            │
              ▼               ▼                ▼
    ┌─────────────┐  ┌────────────────┐  ┌──────────────┐
    │ PRICE ORACLE│  │ RARITY ORACLE  │  │TOKEN LAUNCH  │
    │             │  │                │  │              │
    │ Get $LOS    │  │ Calculate      │  │ NFT→Token    │
    │ price for   │  │ trait rarity   │  │ conversion   │
    │ USD-pegged  │  │ scores during  │  │ after bond   │
    │ pricing     │  │ reveal         │  │ completes    │
    └─────────────┘  └────────────────┘  └──────────────┘
```

---

## 🔧 Deployment Challenges

### Challenge 1: Bubblegum Dependency
**Issue**: `mpl-bubblegum` and `spl-account-compression` not available in Playground
**Impact**: Can't deploy full compressed NFT version directly

### Challenge 2: CPI Call Dependencies  
**Issue**: Need to reference other program IDs for CPI
**Impact**: Adds complexity but is doable

### Challenge 3: Local Build Environment
**Issue**: Missing SBF SDK on local machine
**Impact**: Can't build full version locally with `anchor build`

---

## 📋 Deployment Options

### Option A: 2-Phase Deployment (RECOMMENDED)
**Phase 1**: Deploy simplified version NOW
- ✅ Core blind mint & reveal
- ✅ Fee distribution
- ✅ Works in Playground
- ❌ No Bubblegum compression yet
- ❌ No CPI calls yet

**Phase 2**: Upgrade to full version
- ✅ Add Bubblegum compression
- ✅ Add CPI integrations
- ✅ Full feature set
- Build locally or via GitHub Actions

**Pros**:
- Get NFT Launchpad deployed immediately
- Test core functionality
- Upgrade later with full features
- Progressive enhancement approach

**Cons**:
- Two deployments needed
- Temporary feature limitation

---

### Option B: Full Build via GitHub Actions
**Approach**: Set up automated build pipeline
- Configure GitHub Actions with Anchor
- Build full Bubblegum version
- Deploy binary to Analos

**Pros**:
- One deployment with all features
- Full Bubblegum compression
- All CPI integrations

**Cons**:
- GitHub Actions setup time
- Previous build issues to resolve
- Longer deployment time

---

### Option C: Fix Local Build Environment
**Approach**: Install Solana SDK properly
- Run `solana-install init`
- Get SBF SDK
- Build with `anchor build`

**Pros**:
- Full control over build
- All features in one go
- Can iterate locally

**Cons**:
- Setup/installation time
- Already tried multiple times

---

## 💡 RECOMMENDATION: Modified Option A

### Hybrid Approach:
Deploy a Playground-compatible version that **includes CPI calls** but without Bubblegum

**What we deploy**:
- ✅ Blind mint & reveal (using PDAs, not Bubblegum)
- ✅ Fee distribution (8.9% structure)
- ✅ **CPI to Price Oracle** for dynamic pricing
- ✅ **CPI to Rarity Oracle** for trait scoring
- ✅ **CPI to Token Launch** for conversion
- ❌ Bubblegum compression (add later)

**Why this works**:
1. We can add external program IDs for CPI in Playground
2. CPI calls don't require external crates
3. We get full integration working NOW
4. Can upgrade to Bubblegum later

---

## 🛠️ Implementation Plan

### Step 1: Create CPI-Integrated Version
```rust
// Include other program IDs
pub const PRICE_ORACLE_ID: Pubkey = B26Wi...;
pub const RARITY_ORACLE_ID: Pubkey = C2YCP...;
pub const TOKEN_LAUNCH_ID: Pubkey = Eydws...;

// Add CPI functions
fn get_los_price(ctx: &Context) -> Result<u64>
fn calculate_rarity(ctx: &Context, traits: Vec<Trait>) -> Result<u64>
fn convert_to_token(ctx: &Context) -> Result<()>
```

### Step 2: Deploy to Playground
- Build CPI-integrated version
- Deploy to devnet
- Export Program ID, Keypair, .so, IDL

### Step 3: Deploy to Analos
- Use same process as other 3 programs
- `solana program deploy --use-rpc`

### Step 4: Test Integration
- Initialize NFT Launchpad
- Test mint with Price Oracle integration
- Test reveal with Rarity Oracle integration
- Verify fee distribution

### Step 5: Future Upgrade (Optional)
- Add Bubblegum compression
- Deploy as program upgrade
- Maintain same program ID

---

## ✅ Next Action

**CREATE: PLAYGROUND-NFT-LAUNCHPAD-WITH-CPI.rs**

This version will include:
1. ✅ All 3 CPI integrations
2. ✅ Playground-compatible (no external crates)
3. ✅ Full fee structure
4. ✅ Blind mint & reveal
5. ❌ No Bubblegum (yet)

Ready to proceed?

