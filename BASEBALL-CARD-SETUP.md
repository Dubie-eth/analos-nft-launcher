# ⚾ Baseball Card Profile NFT - Complete Setup Guide

## 🎉 **What's Been Implemented:**

### ✅ **1. Old School Baseball Card Design**
- **Classic baseball card aesthetic** with vintage borders
- **Banner image support** - displays at the top of each card
- **Circular avatar** with edition number badge
- **Stats section** with referral code and tier information
- **Multiple card styles** inspired by classic baseball cards

### ✅ **2. 11 Card Background Variants**

#### **Common Rarity (2):**
1. **Classic** - 1950s Topps style with yellow borders
2. **Rookie** - Blue borders with star elements

#### **Rare Rarity (1):**
3. **All-Star** - Red borders with gold accents

#### **Epic Rarity (1):**
4. **Hall of Fame** - Purple borders with silver highlights

#### **Legendary Rarity (2):**
5. **World Series** - Green borders with championship gold
6. **Cosmic** - Indigo/purple/pink gradients with starfield

#### **Ultra-Rare Rarity (5):**
7. **MFPurrs Cosmic** - Pink/purple/indigo with space backgrounds
8. **MFPurrs Galaxy** - Purple/indigo/pink with nebula effects
9. **MFPurrs Aurora** - Indigo/pink/purple with rainbow lights
10. **Diamond** - Gray/white holographic effects

### ✅ **3. Custom Background Image Support**
- Cards can display **custom background images** from external sources
- **MFPurrs backgrounds** are configured as ultra-rare variants
- Images display with **20% opacity** as subtle background overlays
- **Rarity badges** appear in the top-right corner of each card

---

## 📥 **How to Add MFPurrs Backgrounds:**

### **Step 1: Download the Backgrounds**

1. Visit the MFPurrs repository:
   - [https://github.com/VirtualAlaska/mfpurrs/tree/main/art/trait-layers/background](https://github.com/VirtualAlaska/mfpurrs/tree/main/art/trait-layers/background)

2. Download your favorite background images:
   - Click on any `.png` file in the backgrounds directory
   - Click the **"Download"** button
   - Or right-click → **"Save image as..."**

3. **Recommended backgrounds** to download:
   - Cosmic/space themed backgrounds (for MFPurrs Cosmic)
   - Galaxy/nebula themed backgrounds (for MFPurrs Galaxy)
   - Aurora/rainbow themed backgrounds (for MFPurrs Aurora)

### **Step 2: Add Images to Your Project**

1. Save the downloaded images to:
   ```
   public/images/backgrounds/
   ```

2. **Rename them** to match the configuration:
   - `mfpurrs-1.png` - For MFPurrs Cosmic variant
   - `mfpurrs-2.png` - For MFPurrs Galaxy variant
   - `mfpurrs-3.png` - For MFPurrs Aurora variant

3. **File format**: `.png` or `.jpg` both work fine

### **Step 3: Verify the Integration**

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the **Profile page**

3. Click through the **card background examples** using the arrows

4. You should see your MFPurrs backgrounds appear as **Ultra-Rare** variants!

---

## 🎨 **Current Card Features:**

### **Banner Support:**
- Upload a banner image (displayed at top of card)
- **16px height** with rounded corners
- Subtle dark overlay for better text contrast

### **Profile Section:**
- **Circular avatar** with 2px black border
- **Edition number badge** in top-right corner (shows mint #)
- **Display name** in bold
- **Username** with @ prefix
- **Bio text** (if provided)

### **Stats Section:**
- **Referral Code** - Shows username in uppercase
- **Tier** - Shows the card variant name (Classic, Rookie, etc.)
- **White background** with 80% opacity for visibility

### **Card Border:**
- **4px colored border** based on card variant
- **2px inner black border** for depth
- **Rounded corners** for classic baseball card look

### **Rarity Badge:**
- **Top-right corner** of each card
- **Color-coded** by rarity:
  - Gray = Common
  - Green = Rare
  - Blue = Epic
  - Purple = Legendary
  - Pink = Ultra-Rare

---

## 🔧 **How to Add More Custom Backgrounds:**

### **Option 1: Add New MFPurrs Variants**

1. Download more backgrounds from the MFPurrs repo

2. Add them to `public/images/backgrounds/`:
   ```
   mfpurrs-4.png
   mfpurrs-5.png
   etc.
   ```

3. Update `src/app/profile/page.tsx` - Add new entries to the `cardBackgrounds` array:

```typescript
{
  name: 'MFPurrs Custom',
  gradient: 'from-blue-100 via-cyan-50 to-blue-200',
  accent: 'blue',
  pattern: 'mfpurrs',
  description: 'Ultra-Rare MFPurrs Custom variant',
  textColor: 'text-black',
  borderColor: 'border-blue-800',
  rarity: 'Ultra-Rare',
  backgroundImage: '/images/backgrounds/mfpurrs-4.png'
}
```

### **Option 2: Add Completely Custom Backgrounds**

1. Add any image to `public/images/backgrounds/`:
   ```
   custom-space.png
   custom-neon.jpg
   etc.
   ```

2. Add a new card variant in `src/app/profile/page.tsx`:

```typescript
{
  name: 'Custom Name',
  gradient: 'from-color-100 via-color-50 to-color-200',
  accent: 'color',
  pattern: 'custom',
  description: 'Your custom description',
  textColor: 'text-black',
  borderColor: 'border-color-800',
  rarity: 'Ultra-Rare', // or any rarity
  backgroundImage: '/images/backgrounds/your-image.png'
}
```

3. **Restart your dev server** to see the changes

---

## 🎯 **Rarity Distribution Recommendations:**

When users mint Profile NFTs, the oracle will randomly assign backgrounds based on rarity:

- **Common (Classic, Rookie)**: ~50% chance
- **Rare (All-Star)**: ~25% chance
- **Epic (Hall of Fame)**: ~15% chance
- **Legendary (World Series, Cosmic)**: ~8% chance
- **Ultra-Rare (MFPurrs x3, Diamond)**: ~2% chance

The rarest cards will be **MFPurrs variants** with custom backgrounds from the collection!

---

## 📊 **Card Dimensions:**

- **Width**: Responsive (fits container)
- **Avatar**: 64px (16 units)
- **Banner**: Full width × 64px height
- **Border**: 4px outer + 2px inner
- **Badge**: 20px × 20px edition number
- **Rarity Badge**: Auto-sized, top-right corner

---

## 🚀 **Next Steps:**

1. **Download MFPurrs backgrounds** from the GitHub repo
2. **Add them** to `public/images/backgrounds/`
3. **Rename** them as `mfpurrs-1.png`, `mfpurrs-2.png`, `mfpurrs-3.png`
4. **Test** by viewing the Profile page and flipping through cards
5. **Mint** your first Profile NFT to see the reveal animation!

---

## 📝 **Important Notes:**

### **File Paths:**
- All image paths start with `/images/` (public directory is implicit in Next.js)
- Images in `public/` are served from the root URL path

### **Image Optimization:**
- Consider using **optimized .png** files (smaller file size)
- Recommended size: **600×800px** or similar aspect ratio
- Keep file sizes **under 500KB** for fast loading

### **Licensing:**
- MFPurrs backgrounds are from: [https://github.com/VirtualAlaska/mfpurrs](https://github.com/VirtualAlaska/mfpurrs)
- **Respect the original creator's license**
- Add proper attribution if required

---

## 🎉 **You're All Set!**

Your Profile NFT system now supports:
- ✅ Old school baseball card design
- ✅ Banner image display
- ✅ Multiple card style variants
- ✅ Rarity system with badges
- ✅ Custom background images
- ✅ MFPurrs ultra-rare backgrounds
- ✅ Special reveal animation

**Download those MFPurrs backgrounds and create legendary Profile NFTs!** 🚀⚾✨

---

## 🔗 **Useful Links:**

- **MFPurrs Backgrounds**: [https://github.com/VirtualAlaska/mfpurrs/tree/main/art/trait-layers/background](https://github.com/VirtualAlaska/mfpurrs/tree/main/art/trait-layers/background)
- **Setup Guide**: `public/images/backgrounds/README.md`
- **Profile Page**: `src/app/profile/page.tsx`

---

**Ready to mint legendary Profile NFTs!** 🎴✨

