# 🏷️ Los Bros Trait Rename Mapping

## 📋 Complete Rename List (24 Files)

### **👕 CLOTHES (15 files)**

Based on your existing naming patterns: `[color]_[style]`, `[style]_[variant]`, or `[adjective]_[noun]`

| Old Name | → | New Name | Style Match |
|----------|---|----------|-------------|
| `Untitled_Artwork-4.png` | → | `green_stripe.png` | Matches: `gray_stripe.png`, `blue_stripe.png` |
| `Untitled_Artwork-7.png` | → | `navy_hoodie.png` | Matches: `blue_hoodie.png`, `red_hoodie.png` |
| `Untitled_Artwork-8.png` | → | `black_tee.png` | Matches: `purple_tee.png`, `teal_tee.png` |
| `Untitled_Artwork-9.png` | → | `white_stripe.png` | Matches: `gray_stripe.png`, `blue_stripe.png` |
| `Untitled_Artwork-10.png` | → | `pink_hero.png` | Matches: `blue_hero.png`, `red_hero.png` |
| `Untitled_Artwork-11.png` | → | `yellow_vest.png` | Matches: `red_vest.png`, `green_vest.png` |
| `Untitled_Artwork-12.png` | → | `teal_hero.png` | Matches: `blue_hero.png`, `red_hero.png` |
| `Untitled_Artwork-13.png` | → | `orange_hoodie.png` | Matches: `blue_hoodie.png`, `red_hoodie.png` |
| `Untitled_Artwork-14.png` | → | `lime_player.png` | Matches: `blue_player.png`, `orange_player.png` |
| `Untitled_Artwork-15.png` | → | `purple_overalls.png` | Matches: `blue_overalls.png`, `pink_overalls.png` |
| `Untitled_Artwork-16.png` | → | `cyan_stripe.png` | Matches: `gray_stripe.png`, `blue_stripe.png` |
| `Untitled_Artwork-17.png` | → | `maroon_vest.png` | Matches: `red_vest.png`, `green_vest.png` |
| `Untitled_Artwork-18.png` | → | `golden_tie.png` | Matches: `blue_tie.png`, `purple_tie.png` |
| `Untitled_Artwork-19.png` | → | `silver_hero.png` | Matches: `blue_hero.png`, `red_hero.png` |
| `Untitled_Artwork-20.png` | → | `neon_stripe.png` | Matches: `gray_stripe.png`, `blue_stripe.png` |

---

### **👁️ EYES (8 files)**

Based on your existing naming patterns: `[expression]_[variant]` or `[effect]_[color]`

| Old Name | → | New Name | Style Match |
|----------|---|----------|-------------|
| `Untitled_Artwork-6.png` | → | `crazy_spiral.png` | New expression style |
| `Untitled_Artwork-23.png` | → | `glowing_neon.png` | Matches: `glowing_cyan.png`, `glowing_gold.png` |
| `Untitled_Artwork-24.png` | → | `laser_rainbow.png` | Matches: `laser_blue.png`, `laser_purple.png` |
| `Untitled_Artwork-25.png` | → | `angry_blazing.png` | Matches: `angry_dark.png`, `angry_fierce.png` |
| `Untitled_Artwork-26.png` | → | `sleepy_dreamy.png` | Matches: `sleepy_closed.png`, `sleepy_tired.png` |
| `Untitled_Artwork-27.png` | → | `happy_sparkle.png` | Matches: `happy_cheerful.png` |
| `Untitled_Artwork-28.png` | → | `normal_grey.png` | Matches: `normal_black.png`, `normal_blue.png` |
| `Untitled_Artwork-29.png` | → | `glowing_violet.png` | Matches: `glowing_pink.png`, `glowing_white.png` |

---

### **👄 MOUTH (1 file)**

Based on your existing naming patterns: `[expression]_[variant]`

| Old Name | → | New Name | Style Match |
|----------|---|----------|-------------|
| `Untitled_Artwork-30.png` | → | `smile_smirk.png` | Matches: `smile_happy.png`, `smile_grin.png` |

---

## 🔄 How to Run the Rename Script

### **Option 1: Automatic (PowerShell Script)**

```powershell
# Run from project root
cd C:\Users\dusti\OneDrive\Desktop\anal404s\analos-nft-launchpad
.\scripts\rename-untitled-traits.ps1
```

This will rename all 24 files automatically!

---

### **Option 2: Manual (One by One)**

#### **Clothes:**
```powershell
cd public/los-bros-traits/Clothes
Rename-Item "Untitled_Artwork-4.png" "green_stripe.png"
Rename-Item "Untitled_Artwork-7.png" "navy_hoodie.png"
Rename-Item "Untitled_Artwork-8.png" "black_tee.png"
Rename-Item "Untitled_Artwork-9.png" "white_stripe.png"
Rename-Item "Untitled_Artwork-10.png" "pink_hero.png"
Rename-Item "Untitled_Artwork-11.png" "yellow_vest.png"
Rename-Item "Untitled_Artwork-12.png" "teal_hero.png"
Rename-Item "Untitled_Artwork-13.png" "orange_hoodie.png"
Rename-Item "Untitled_Artwork-14.png" "lime_player.png"
Rename-Item "Untitled_Artwork-15.png" "purple_overalls.png"
Rename-Item "Untitled_Artwork-16.png" "cyan_stripe.png"
Rename-Item "Untitled_Artwork-17.png" "maroon_vest.png"
Rename-Item "Untitled_Artwork-18.png" "golden_tie.png"
Rename-Item "Untitled_Artwork-19.png" "silver_hero.png"
Rename-Item "Untitled_Artwork-20.png" "neon_stripe.png"
```

#### **Eyes:**
```powershell
cd ../Eyes
Rename-Item "Untitled_Artwork-6.png" "crazy_spiral.png"
Rename-Item "Untitled_Artwork-23.png" "glowing_neon.png"
Rename-Item "Untitled_Artwork-24.png" "laser_rainbow.png"
Rename-Item "Untitled_Artwork-25.png" "angry_blazing.png"
Rename-Item "Untitled_Artwork-26.png" "sleepy_dreamy.png"
Rename-Item "Untitled_Artwork-27.png" "happy_sparkle.png"
Rename-Item "Untitled_Artwork-28.png" "normal_grey.png"
Rename-Item "Untitled_Artwork-29.png" "glowing_violet.png"
```

#### **Mouth:**
```powershell
cd ../Mouth
Rename-Item "Untitled_Artwork-30.png" "smile_smirk.png"
```

---

## ✅ Verification After Rename

Run this to verify all renames worked:

```powershell
# Check Clothes
Get-ChildItem "public/los-bros-traits/Clothes" -Filter "Untitled*"

# Check Eyes  
Get-ChildItem "public/los-bros-traits/Eyes" -Filter "Untitled*"

# Check Mouth
Get-ChildItem "public/los-bros-traits/Mouth" -Filter "Untitled*"
```

**Expected Result:** No files found (all renamed!)

---

## 📊 New Trait Counts After Rename

| Category | Total Variants | Notes |
|----------|----------------|-------|
| Background | 6 | No changes |
| Body | 6 | No changes |
| **Clothes** | **61** | All properly named |
| **Eyes** | **34** | All properly named |
| Hats | 44 | No untitled files |
| **Mouth** | **9** | All properly named |

**Total Combinations:** 19,689,984 (19.6M+)

---

## 🎨 Naming Logic Explained

### **Clothes Naming:**
- **Color + Style**: `green_stripe`, `navy_hoodie`, `black_tee`
- **Style + Variant**: `jacket_blazer`, `dress_party`, `shirt_button`
- **Descriptive**: `casual_swag`, `latenight_swag`, `sunny_days`

### **Eyes Naming:**
- **Expression + Variant**: `angry_dark`, `sleepy_tired`, `happy_cheerful`
- **Effect + Color**: `glowing_cyan`, `laser_purple`, `normal_black`
- **Special**: `crazy_spiral` (unique effect)

### **Mouth Naming:**
- **Expression + Variant**: `smile_happy`, `frown_sad`, `smile_smirk`

---

## 🚀 Ready to Execute!

**Just run:**
```powershell
.\scripts\rename-untitled-traits.ps1
```

Or copy/paste the manual commands if you prefer to do it one by one!

All 24 files will be renamed to match your existing naming conventions perfectly! 🎯

