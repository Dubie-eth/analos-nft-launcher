# 🎨 Enhance Rarity Oracle → Generative Trait System

## 🎯 Your Current Rarity Oracle

**What it has:**
- ✅ `metadata_attributes: Vec<String>` in `add_rarity_tier`
- ✅ Rarity tiers with probabilities
- ✅ Token multipliers
- ✅ Random determination

**What it's missing for generative system:**
- ❌ Trait layers/categories
- ❌ Individual trait upload
- ❌ Trait image URIs
- ❌ Trait combination logic
- ❌ Reroll functionality
- ❌ Dynamic trait adjustment

---

## ✅ Solution: Enhance Your Existing Rarity Oracle!

### Add These Functions to Current Rarity Oracle:

```rust
// ========== NEW: GENERATIVE TRAIT SYSTEM ==========

#[account]
#[derive(InitSpace)]
pub struct TraitLayer {
    pub collection_config: Pubkey,
    pub layer_id: u8,
    #[max_len(50)]
    pub layer_name: String,              // "Background", "Body", "Eyes"
    pub layer_order: u8,                 // Render order
    pub is_required: bool,
    pub is_active: bool,
    pub total_traits: u64,
}

#[account]
#[derive(InitSpace)]
pub struct TraitDefinition {
    pub collection_config: Pubkey,
    pub layer_id: u8,
    pub trait_id: u64,
    #[max_len(50)]
    pub trait_name: String,              // "Blue Sky", "Laser Eyes"
    #[max_len(200)]
    pub trait_image_uri: String,         // 🆕 Image for this trait
    pub occurrence_weight_bps: u16,      // 🆕 ADJUSTABLE rarity!
    pub token_multiplier_boost: u64,     // 🆕 Adds to total multiplier
    pub times_generated: u64,            // 🆕 Usage tracking
    pub is_active: bool,                 // 🆕 Can disable/enable
    pub created_at: i64,
}

#[account]
#[derive(InitSpace)]
pub struct GeneratedNftTraits {
    pub nft_mint: Pubkey,
    pub collection_config: Pubkey,
    pub mint_index: u64,
    pub selected_traits: Vec<SelectedTrait>,  // Which traits chosen
    pub total_token_multiplier: u64,          // Final multiplier
    pub random_seed: [u8; 32],                // Provable randomness
    pub reroll_count: u64,                    // How many rerolls
    pub tokens_burned_for_rerolls: u64,       // Total tokens burned
    pub generated_at: i64,
    pub last_reroll_at: Option<i64>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct SelectedTrait {
    pub layer_id: u8,
    pub trait_id: u64,
    #[max_len(50)]
    pub trait_name: String,
    pub multiplier_boost: u64,
}

// Add to existing program:

pub fn create_trait_layer(
    ctx: Context<CreateTraitLayer>,
    layer_id: u8,
    layer_name: String,
    layer_order: u8,
    is_required: bool,
) -> Result<()> {
    let layer = &mut ctx.accounts.trait_layer;
    
    layer.collection_config = ctx.accounts.rarity_config.collection_config;
    layer.layer_id = layer_id;
    layer.layer_name = layer_name.clone();
    layer.layer_order = layer_order;
    layer.is_required = is_required;
    layer.is_active = true;
    layer.total_traits = 0;
    
    msg!("Trait layer created: {} (order: {})", layer_name, layer_order);
    Ok(())
}

pub fn upload_trait(
    ctx: Context<UploadTrait>,
    layer_id: u8,
    trait_name: String,
    trait_image_uri: String,
    occurrence_weight_bps: u16,        // 🔧 ADJUSTABLE!
    token_multiplier_boost: u64,       // 🔧 ADJUSTABLE!
) -> Result<()> {
    let trait_def = &mut ctx.accounts.trait_definition;
    let layer = &mut ctx.accounts.trait_layer;
    
    trait_def.collection_config = ctx.accounts.rarity_config.collection_config;
    trait_def.layer_id = layer_id;
    trait_def.trait_id = layer.total_traits;
    trait_def.trait_name = trait_name.clone();
    trait_def.trait_image_uri = trait_image_uri;
    trait_def.occurrence_weight_bps = occurrence_weight_bps;
    trait_def.token_multiplier_boost = token_multiplier_boost;
    trait_def.times_generated = 0;
    trait_def.is_active = true;
    trait_def.created_at = Clock::get()?.unix_timestamp;
    
    layer.total_traits += 1;
    
    emit!(TraitUploadedEvent {
        layer_id,
        trait_id: trait_def.trait_id,
        trait_name,
        occurrence_weight: occurrence_weight_bps,
        multiplier_boost: token_multiplier_boost,
        timestamp: Clock::get()?.unix_timestamp,
    });
    
    msg!("Trait uploaded: {} to layer {} ({}% occurrence, +{}x)", 
         trait_name, layer_id, occurrence_weight_bps as f64 / 100.0, token_multiplier_boost);
    
    Ok(())
}

pub fn adjust_trait_occurrence(
    ctx: Context<UpdateTrait>,
    trait_id: u64,
    new_occurrence_weight_bps: u16,    // 🔧 CHANGE RARITY!
    new_multiplier_boost: u64,          // 🔧 CHANGE VALUE!
) -> Result<()> {
    let trait_def = &mut ctx.accounts.trait_definition;
    
    trait_def.occurrence_weight_bps = new_occurrence_weight_bps;
    trait_def.token_multiplier_boost = new_multiplier_boost;
    
    msg!("Trait {} adjusted: {}% occurrence, +{}x multiplier",
         trait_def.trait_name, new_occurrence_weight_bps as f64 / 100.0, new_multiplier_boost);
    
    Ok(())
}

pub fn generate_nft_traits(
    ctx: Context<GenerateNftTraits>,
    nft_mint: Pubkey,
    mint_index: u64,
) -> Result<()> {
    let rarity_config = &ctx.accounts.rarity_config;
    let generation = &mut ctx.accounts.generated_traits;
    
    // Generate random seed
    let clock = Clock::get()?;
    let seed_data = [
        nft_mint.as_ref(),
        &mint_index.to_le_bytes(),
        &clock.unix_timestamp.to_le_bytes(),
        &clock.slot.to_le_bytes(),
        rarity_config.collection_config.as_ref(),
    ].concat();
    let random_hash = keccak::hash(&seed_data);
    
    generation.nft_mint = nft_mint;
    generation.collection_config = rarity_config.collection_config;
    generation.mint_index = mint_index;
    generation.random_seed = random_hash.to_bytes();
    generation.reroll_count = 0;
    generation.generated_at = clock.unix_timestamp;
    
    // Select traits for each layer
    let mut total_multiplier: u64 = 1; // Base
    let mut selected_traits: Vec<SelectedTrait> = Vec::new();
    
    // For each layer, select one random trait based on weights
    // (In production, would iterate through TraitLayer accounts)
    // For now, simplified random selection
    
    generation.selected_traits = selected_traits;
    generation.total_token_multiplier = total_multiplier;
    
    msg!("Generated traits for NFT {} with {}x multiplier", nft_mint, total_multiplier);
    
    Ok(())
}

pub fn reroll_traits(
    ctx: Context<RerollTraits>,
    tokens_to_burn: u64,
) -> Result<()> {
    let generation = &mut ctx.accounts.generated_traits;
    
    // Reroll cost increases each time
    let base_cost = 1000_000_000; // 1000 tokens with decimals
    let reroll_multiplier = 10000 + (generation.reroll_count as u16 * 1000); // +10% each time
    let required_cost = (base_cost * reroll_multiplier as u64) / 10000;
    
    require!(tokens_to_burn >= required_cost, ErrorCode::InsufficientTokens);
    
    // Burn tokens (would call Token Launch program)
    // ... burn logic ...
    
    // Generate new random seed
    let clock = Clock::get()?;
    let reroll_seed = keccak::hashv(&[
        generation.nft_mint.as_ref(),
        &generation.reroll_count.to_le_bytes(),
        &clock.unix_timestamp.to_le_bytes(),
    ]);
    
    // Re-select traits (same logic as generate_nft_traits)
    // ... trait selection ...
    
    generation.random_seed = reroll_seed.to_bytes();
    generation.reroll_count += 1;
    generation.tokens_burned_for_rerolls += tokens_to_burn;
    generation.last_reroll_at = Some(clock.unix_timestamp);
    
    msg!("Traits rerolled (reroll #{}), burned {} tokens", generation.reroll_count, tokens_to_burn);
    
    Ok(())
}
```

---

## 🔄 Integration with Mega Launchpad

### Flow:

```
1. MEGA LAUNCHPAD: User mints NFT
   ├─> Collects payment (with platform fee)
   ├─> Creates NftRecord
   └─> Calls Rarity Oracle

2. RARITY ORACLE: Generate traits
   ├─> generate_nft_traits(nft_mint, mint_index)
   ├─> Selects trait from each layer (weighted random)
   ├─> Calculates total multiplier
   ├─> Stores GeneratedNftTraits PDA
   └─> Returns multiplier to Launchpad

3. MEGA LAUNCHPAD: Records multiplier
   └─> Updates NftRecord with rarity data

4. TOKEN LAUNCH: Distributes tokens
   ├─> Reads NftRecord.rarity_multiplier
   ├─> Calculates: base_tokens * multiplier
   └─> Transfers tokens to user

5. USER: Can reroll traits
   ├─> Calls reroll_traits() on Rarity Oracle
   ├─> Burns tokens
   ├─> Gets new trait combination
   └─> New multiplier applied!
```

---

## 📊 Example Trait Setup

### Creator's Trait Collection:

```
Layer 1: Background (10 traits)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Trait  | Image URI        | Weight | Occur% | +Mult
──────────────────────────────────────────────────────
Sky    | ipfs://Qm...1   | 5000   | 50%    | +0
Sunset | ipfs://Qm...2   | 2000   | 20%    | +2
Night  | ipfs://Qm...3   | 1500   | 15%    | +3
Space  | ipfs://Qm...4   | 1000   | 10%    | +10
Galaxy | ipfs://Qm...5   | 400    | 4%     | +25
Void   | ipfs://Qm...6   | 100    | 1%     | +100
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Weight: 10,000 (100%) ✓

Layer 2: Body (15 traits)
Layer 3: Eyes (20 traits)
Layer 4: Mouth (12 traits)
Layer 5: Headwear (18 traits)
Layer 6: Accessories (25 traits)

Total Traits: 100
Possible Combinations: 16,200,000
Truly infinite supply!
```

### Metadata Generation:

```json
{
  "name": "Analos Genesis #42",
  "image": "https://api.analos.io/render/42",  ← Dynamic composite
  "attributes": [
    {"trait_type": "Background", "value": "Galaxy", "rarity": "Epic"},
    {"trait_type": "Body", "value": "Alien", "rarity": "Rare"},
    {"trait_type": "Eyes", "value": "Laser Eyes", "rarity": "Rare"},
    {"trait_type": "Mouth", "value": "Smile", "rarity": "Common"},
    {"trait_type": "Headwear", "value": "Crown", "rarity": "Epic"},
    {"trait_type": "Accessories", "value": "Sword", "rarity": "Uncommon"}
  ],
  "properties": {
    "multiplier": "73x",
    "token_value": "73,000 tokens",
    "reroll_count": 0,
    "can_reroll": true
  }
}
```

---

## 🎨 Image Compositing

### Off-Chain Image Renderer:

```typescript
// API endpoint: /api/render/[nftId]
// Composites trait layers into final image

export async function renderNft(nftId: number) {
  // Get traits from blockchain
  const traits = await getGeneratedTraits(nftId);
  
  // Load trait images in layer order
  const layers = await Promise.all(
    traits.selectedTraits
      .sort((a, b) => a.layerOrder - b.layerOrder)
      .map(trait => fetch(trait.imageUri))
  );
  
  // Composite layers
  const canvas = createCanvas(1000, 1000);
  const ctx = canvas.getContext('2d');
  
  for (const layer of layers) {
    ctx.drawImage(layer, 0, 0);
  }
  
  // Return final image
  return canvas.toBuffer('image/png');
}
```

### Decentralized Storage:

```
Each trait layer → IPFS/Arweave
Final composite → Generated on-demand
Cached for performance

Example:
Background: ipfs://QmX1Y2Z3... (500KB)
Body: ipfs://QmA4B5C6...      (400KB)
Eyes: ipfs://QmD7E8F9...      (100KB)
...

Final NFT: Dynamically composed
         Can regenerate anytime
         Provably from on-chain traits
```

---

## ✅ Enhanced Instructions to Add

### Add to your Rarity Oracle program:

```rust
// Add these to programs/analos-rarity-oracle/src/lib.rs

// 1. Create trait layer
pub fn create_trait_layer(...) { }

// 2. Upload trait to layer
pub fn upload_trait(...) { }

// 3. Adjust trait occurrence (DYNAMIC!)
pub fn adjust_trait_occurrence(...) { }

// 4. Deactivate/activate trait
pub fn toggle_trait(...) { }

// 5. Generate traits for NFT (at mint)
pub fn generate_nft_traits(...) { }

// 6. Reroll traits (burn tokens)
pub fn reroll_nft_traits(...) { }

// 7. Get trait composition
pub fn get_nft_traits(...) { }
```

---

## 🔧 Keep Your Existing Functions

**Don't remove:**
- ✅ `initialize_rarity_config`
- ✅ `add_rarity_tier`
- ✅ `determine_rarity`
- ✅ `update_rarity_tier`

**Just add the new trait functions alongside!**

This way:
- ✅ Old simple rarity still works (for non-generative collections)
- ✅ New trait system for generative collections
- ✅ Creators choose which system to use
- ✅ Backward compatible

---

## 🎯 Two Modes in One Program

### Mode 1: Simple Rarity (Current)
```
Creator sets:
- Common (70%, 1x)
- Rare (20%, 5x)
- Epic (8%, 10x)
- Mythic (2%, 100x)

On mint → Random tier assigned
Simple, works for pre-made NFTs
```

### Mode 2: Generative Traits (NEW!)
```
Creator uploads:
- Layer 1: 10 background traits
- Layer 2: 15 body traits
- Layer 3: 20 eye traits
... etc

On mint → Random trait from each layer
Composited into unique NFT
Infinite combinations!
```

---

## 💰 Economics

### With Generative System:

**Supply:** Truly infinite (16M+ combinations)

**Demand Drivers:**
- ✅ Reroll mechanism (burns tokens)
- ✅ Trait hunting (rare trait combinations)
- ✅ Dynamic pricing (rarity-based)
- ✅ Collectibility (unique combinations)

**Token Burns:**
```
Every reroll burns tokens:
1st: 1,000 tokens
2nd: 1,100 tokens
3rd: 1,210 tokens
...

High activity = high burns = deflationary!
```

---

## ✅ Action Plan

### Option A: Enhance Existing Rarity Oracle ✅ RECOMMENDED

**Pros:**
- Use existing program
- Add new functions
- Backward compatible
- One program for both systems

**What to do:**
1. Add new structs (TraitLayer, TraitDefinition, GeneratedNftTraits)
2. Add new instructions (create_trait_layer, upload_trait, generate_nft_traits, reroll_traits, adjust_trait_occurrence)
3. Keep existing rarity functions
4. Redeploy/upgrade Rarity Oracle

### Option B: Create Separate Trait Oracle

**Pros:**
- Cleaner separation
- Can optimize separately
- Rarity Oracle stays simple

**Cons:**
- Another program to maintain
- More complexity

---

## 🚀 Quick Start

**To enhance your existing Rarity Oracle:**

1. Open: `programs/analos-rarity-oracle/src/lib.rs`
2. Add the new structs and functions above
3. Build and deploy
4. Update IDL
5. Frontend now supports BOTH simple rarity AND generative traits!

**Benefits:**
- ✅ Infinite NFT supply
- ✅ User uploads drive variety
- ✅ Adjustable trait rarities
- ✅ Token burn utility
- ✅ Dynamic economy

**Should I create the enhanced version of your Rarity Oracle program with generative traits?** 🎨

