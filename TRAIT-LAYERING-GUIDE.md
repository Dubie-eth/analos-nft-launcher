# 🎨 Los Bros NFT Trait Layering System

## Layer Stack Order (Bottom → Top)

The composite image system stacks layers in this **EXACT** order:

```
6️⃣ Hat          ← Top Layer (covers everything below)
5️⃣ Eyes
4️⃣ Mouth
3️⃣ Clothes
2️⃣ Body
1️⃣ Background   ← Bottom Layer (base)
```

## Rules

### ✅ Enforced:
1. **Only 1 trait per layer** - System uses `.find()` so first match wins
2. **Traits can be "None"** - Layer is skipped if value is "None"
3. **Exact filename matching** - Trait values are converted to `lowercase_underscore.png`
4. **No duplicate layers** - Each layer type can only appear once

### 🎯 Layer Details:

#### 1. **Background** (Required)
- **Folder:** `public/los-bros-traits/Background/`
- **Purpose:** Base layer, sets the scene
- **Available Files:**
  - `analos.png`
  - `baige.png`
  - `gradient_purple.png`
  - `solid_blue.png`
  - `space_galaxy.png`
  - `sunset_orange.png`

#### 2. **Body** (Required)
- **Folder:** `public/los-bros-traits/Bodys/`
- **Purpose:** Character base/skin
- **Available Files:**
  - `analos.png`
  - `baige.png`
  - `brown.png`
  - `gold.png`
  - `robot.png`
  - `zombie.png`

#### 3. **Clothes** (Optional)
- **Folder:** `public/los-bros-traits/Clothes/`
- **Purpose:** Outfits, shirts, hoodies, etc.
- **Count:** 62+ files
- **Examples:** `pink_hero.png`, `orange_hoodie.png`, `cyan_stripe.png`, `navy_hoodie.png`

#### 4. **Mouth** (Optional)
- **Folder:** `public/los-bros-traits/Mouth/`
- **Purpose:** Facial expressions
- **Available Files:**
  - `frown_angry.png`
  - `frown_disappointed.png`
  - `frown_sad.png`
  - `neutral_line.png`
  - `smile_cute.png`
  - `smile_grin.png`
  - `smile_happy.png`
  - `smile_teeth.png`
  - `smile_wide.png`

#### 5. **Eyes** (Optional)
- **Folder:** `public/los-bros-traits/Eyes/`
- **Purpose:** Eye styles and expressions
- **Count:** 34 files
- **Examples:** `glowing_neon.png`, `laser_blue.png`, `normal_hazel.png`, `angry_dark.png`

#### 6. **Hat** (Optional - Top Layer)
- **Folder:** `public/los-bros-traits/Hats/`
- **Purpose:** Headwear, goes on top of everything
- **Count:** 44 files
- **Examples:** `cap_snapback.png`, `beanie_striped.png`, `bandana_black.png`, `crown_gold.png`

## 🔧 How It Works

### Database Storage:
```json
{
  "los_bros_traits": [
    {"trait_type": "Background", "value": "sunset_orange"},
    {"trait_type": "Body", "value": "baige"},
    {"trait_type": "Clothes", "value": "pink_hero"},
    {"trait_type": "Mouth", "value": "smile_grin"},
    {"trait_type": "Eyes", "value": "glowing_neon"},
    {"trait_type": "Hat", "value": "cap_snapback"}
  ]
}
```

### File Path Generation:
```typescript
// API converts trait value to filename:
"sunset_orange" → "sunset_orange.png"
"Pink Hero"     → "pink_hero.png"      // lowercase + underscore
"Eye Patch"     → "eye_patch.png"      // converts spaces to underscores
```

### HTML Output:
```html
<img src="/los-bros-traits/Background/sunset_orange.png" class="layer" />
<img src="/los-bros-traits/Bodys/baige.png" class="layer" />
<img src="/los-bros-traits/Clothes/pink_hero.png" class="layer" />
<img src="/los-bros-traits/Mouth/smile_grin.png" class="layer" />
<img src="/los-bros-traits/Eyes/glowing_neon.png" class="layer" />
<img src="/los-bros-traits/Hats/cap_snapback.png" class="layer" />
```

## 📋 Current Issues & Fixes

### ❌ Non-Existent Layers:
- **Accessory** - No folder exists, all set to "None"
- **Special** - No folder exists, all set to "None"

### ⚠️ Trait Value Mismatches:
Run `scripts/fix-final-3-nfts.sql` to fix:
- NFT #1327: `cap_red` → `cap_snapback` ✅
- NFT #917: `beanie_blue` → `beanie_striped` ✅
- NFT #53: `cap_black` → `cap_baseball` ✅

## 🎯 Best Practices

### When Adding New NFTs:
1. **Use lowercase_underscore** for ALL trait values
2. **Match exact filenames** in the folders
3. **Only use layers that exist:** Background, Body, Clothes, Mouth, Eyes, Hat
4. **Set missing layers to "None"** - they'll be skipped

### Trait Value Format:
```sql
-- ✅ CORRECT:
{"trait_type": "Eyes", "value": "glowing_neon"}

-- ❌ WRONG:
{"trait_type": "Eyes", "value": "Glowing Neon"}  -- Won't find glowing_neon.png
```

## 🔍 Verification

After updating traits, verify with:
```sql
-- Check specific NFT
SELECT los_bros_token_id, los_bros_traits
FROM profile_nfts
WHERE los_bros_token_id = '1327';

-- Test composite image
-- Visit: https://onlyanal.fun/api/los-bros/composite-image?tokenId=1327
```

## 🚀 Total Combinations

With 6 layers and your current trait counts:
- **Background:** 6 variants
- **Body:** 6 variants  
- **Clothes:** 62 variants
- **Mouth:** 9 variants
- **Eyes:** 34 variants
- **Hat:** 44 variants (+ None option)

**Total:** 6 × 6 × 62 × 9 × 34 × 44 = **19,689,984 possible combinations!** 🤯

