# 🎴 Profile Card Backgrounds - Setup Guide

## 🌟 **MFPurrs Ultra-Rare Backgrounds**

This directory should contain the ultra-rare background images from the MFPurrs collection.

### 📥 **Download Instructions:**

1. Visit the MFPurrs backgrounds repository:
   - https://github.com/VirtualAlaska/mfpurrs/tree/main/art/trait-layers/background

2. Download the following background images:
   - Click on each `.png` file
   - Click the "Download" button (or right-click → "Save image as...")
   - Save them to this directory (`public/images/backgrounds/`)

### 🎯 **Recommended Backgrounds:**

Download these backgrounds for the best variety:

1. **Cosmic/Space Backgrounds** (Ultra-Rare):
   - `background-cosmic.png`
   - `background-galaxy.png`
   - `background-nebula.png`

2. **Special Effect Backgrounds** (Legendary):
   - `background-holographic.png`
   - `background-rainbow.png`
   - `background-aurora.png`

3. **Themed Backgrounds** (Epic):
   - Any other backgrounds that fit your aesthetic

### 📁 **File Naming:**

After downloading, rename the files to match these patterns:
- `mfpurrs-1.png` - First ultra-rare background
- `mfpurrs-2.png` - Second ultra-rare background
- `mfpurrs-3.png` - Third ultra-rare background
- etc.

### 🔗 **Integration:**

Once you've added the images, they will automatically be used as ultra-rare card backgrounds in the Profile NFT system. The code is already configured to use:

```
/images/backgrounds/mfpurrs-1.png
/images/backgrounds/mfpurrs-2.png
/images/backgrounds/mfpurrs-3.png
```

### ✅ **Verification:**

After adding the images:
1. Navigate to the Profile page
2. Flip through the card backgrounds
3. The MFPurrs backgrounds should appear as "Ultra-Rare" variants

---

## 📄 **License:**

The MFPurrs backgrounds are from: https://github.com/VirtualAlaska/mfpurrs

Please respect the original creator's license and attribution requirements.

---

## 🎨 **Alternative Backgrounds:**

If you want to use different backgrounds:
1. Add any `.png` or `.jpg` images to this directory
2. Update the `cardBackgrounds` array in `src/app/profile/page.tsx`
3. Add a new background object with your image path

Example:
```typescript
{
  name: 'Custom',
  gradient: 'from-pink-100 via-purple-50 to-indigo-200',
  accent: 'pink',
  pattern: 'custom',
  description: 'Custom background variant',
  textColor: 'text-black',
  borderColor: 'border-pink-800',
  rarity: 'Ultra-Rare',
  backgroundImage: '/images/backgrounds/your-image.png'
}
```

---

**Ready to create legendary Profile NFTs! 🚀✨**

