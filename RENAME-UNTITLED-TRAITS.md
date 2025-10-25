# 🏷️ Rename Untitled Trait Files

## 🎯 Files That Need Renaming

### **Clothes/** (15 files)
```
Untitled_Artwork-4.png  → Look at the image and rename:
Untitled_Artwork-7.png  → Examples:
Untitled_Artwork-8.png  →   - shirt_graphic_pixel.png
Untitled_Artwork-9.png  →   - hoodie_zip_black.png
Untitled_Artwork-10.png →   - jacket_denim_blue.png
Untitled_Artwork-11.png →   - sweater_knit_cream.png
Untitled_Artwork-12.png →   - tee_logo_white.png
Untitled_Artwork-13.png →   - polo_collar_navy.png
Untitled_Artwork-14.png →   - shirt_flannel_red.png
Untitled_Artwork-15.png →   - jersey_sports_yellow.png
Untitled_Artwork-16.png →   - vest_formal_black.png
Untitled_Artwork-17.png →   - tank_muscle_white.png
Untitled_Artwork-18.png →   - cardigan_cozy_brown.png
Untitled_Artwork-19.png →   - jacket_bomber_green.png
Untitled_Artwork-20.png →   - suit_tux_black.png
```

### **Eyes/** (8 files)
```
Untitled_Artwork-6.png  → Look at the image and rename:
Untitled_Artwork-23.png → Examples:
Untitled_Artwork-24.png →   - eyes_spiral_hypno.png
Untitled_Artwork-25.png →   - eyes_hearts_love.png
Untitled_Artwork-26.png →   - eyes_stars_dazed.png
Untitled_Artwork-27.png →   - eyes_x_dead.png
Untitled_Artwork-28.png →   - eyes_dollar_greedy.png
Untitled_Artwork-29.png →   - eyes_crying_tears.png
                        →   - eyes_winking_flirty.png
                        →   - eyes_3d_glasses.png
```

### **Mouth/** (1 file)
```
Untitled_Artwork-30.png → Look at the image and rename:
                        → Examples:
                        →   - mouth_open_shocked.png
                        →   - mouth_tongue_out.png
                        →   - mouth_kiss_pucker.png
                        →   - mouth_cigar_smoke.png
```

---

## 🔍 How to Rename

### **Windows PowerShell:**
```powershell
# Navigate to the trait folder
cd public/los-bros-traits/Clothes

# Rename a file
Rename-Item "Untitled_Artwork-4.png" "shirt_graphic_pixel.png"
```

### **Windows File Explorer:**
1. Open `public/los-bros-traits/Clothes/`
2. Right-click on `Untitled_Artwork-4.png`
3. Click "Rename"
4. Type new name: `shirt_graphic_pixel.png`
5. Press Enter

---

## 📝 Naming Best Practices

### **Format:**
```
[item]_[style]_[color/variant].png
```

### **Examples:**
```
✅ shirt_button_white.png
✅ eyes_glowing_cyan.png
✅ hat_cap_red.png
✅ mouth_smile_wide.png

❌ cool_shirt.png (missing category)
❌ shirt.png (too vague)
❌ Shirt_Button_White.png (use lowercase)
❌ shirt button white.png (no spaces)
```

---

## 🎨 Trait Naming Suggestions by Category

### **Clothes:**
- `shirt_[style]_[color]` - button, polo, tee, flannel
- `hoodie_[style]_[color]` - zip, pullover, graphic
- `jacket_[style]_[color]` - bomber, denim, leather, blazer
- `suit_[style]_[color]` - tux, business, casual
- `overalls_[color]` - blue, pink, green
- `vest_[style]_[color]` - formal, casual, sweater

### **Eyes:**
- `eyes_[expression]_[color]` - happy, angry, sleepy, surprised
- `eyes_[effect]_[color]` - glowing, laser, spiral, hearts
- `eyes_[special]` - 3d_glasses, stars, dollar_signs, x_dead

### **Hats:**
- `hat_[type]_[color]` - cap, beanie, fedora, bucket
- `hat_[special]` - crown, halo, horns, headphones
- `bandana_[color/pattern]`
- `hair_[style]_[color]` - if hair counts as "hat"

### **Mouth:**
- `mouth_[expression]` - smile, frown, shocked, kiss
- `mouth_[accessory]` - cigar, cigarette, lollipop, gum
- `mouth_[emotion]` - angry, happy, sad, surprised

### **Background:**
- `bg_[scene]` - city, space, desert, ocean, forest
- `bg_[effect]_[color]` - gradient, solid, pattern
- `bg_[special]` - glitch, vaporwave, retro, neon

### **Body:**
- `body_[type]_[color]` - human, robot, zombie, alien
- `body_[material]` - gold, silver, diamond, crystal

---

## 🚀 Quick Rename Script (PowerShell)

Save this as `rename-traits.ps1`:

```powershell
# Rename Clothes
cd "public/los-bros-traits/Clothes"
Rename-Item "Untitled_Artwork-4.png" "shirt_XXX_XXX.png"  # Fill in XXX after viewing
Rename-Item "Untitled_Artwork-7.png" "jacket_XXX_XXX.png"
# ... continue for all

# Rename Eyes
cd "../Eyes"
Rename-Item "Untitled_Artwork-6.png" "eyes_XXX_XXX.png"
Rename-Item "Untitled_Artwork-23.png" "eyes_XXX_XXX.png"
# ... continue for all

# Rename Mouth
cd "../Mouth"
Rename-Item "Untitled_Artwork-30.png" "mouth_XXX_XXX.png"
```

---

## 📊 After Renaming

1. **Test the images** on the Los Bros collection page
2. **Verify traits display** correctly in metadata
3. **Check marketplace** shows proper trait names
4. **Update any hardcoded** trait references in code

---

## 🎯 Next Steps

1. **Review each Untitled file** visually
2. **Decide on descriptive names**
3. **Rename files** using the naming convention
4. **Let me know the new names** so I can update the database/code if needed
5. **Send me new trait images** to add to the collection

I'm ready to help name and organize any new traits you want to add! 🚀

