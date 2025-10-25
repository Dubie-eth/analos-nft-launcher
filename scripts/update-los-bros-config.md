# 🔧 Los Bros Config Update Required

## Problem
The `src/config/los-bros-collection.ts` has trait names that don't match actual files!

### Current Config (WRONG):
```typescript
background: ['Sunset', 'Galaxy', 'Matrix', 'Desert', 'Ocean', 'Neon City', 'Forest', 'Abstract']
hat: ['Cowboy Hat', 'Sombrero', 'Fedora', 'Baseball Cap', 'Top Hat', 'Crown', 'Bandana', 'None']
eyes: ['Laser Eyes', 'Sunglasses', 'Eye Patch', 'Regular', '3D Glasses', 'VR Headset', 'Monocle']
```

### Actual Files You Have:
```
Background/: analos, baige, gradient_purple, solid_blue, space_galaxy, sunset_orange
Hats/: cap_baseball, cap_snapback, bandana_black, crown_gold, sombrero_classic, etc.
Eyes/: laser_blue, glowing_cyan, normal_black, angry_dark, etc.
```

## Solution

Update `src/config/los-bros-collection.ts` with trait names that EXACTLY match your files!

### New Config (Based on Actual Files):

```typescript
traitCategories: {
  background: ['analos', 'baige', 'gradient_purple', 'solid_blue', 'space_galaxy', 'sunset_orange'],
  
  body: ['analos', 'baige', 'brown', 'gold', 'robot', 'zombie'],
  
  clothes: [
    'pink_hero', 'cyan_stripe', 'orange_hoodie', 'navy_hoodie', 'teal_hero',
    'blue_hero', 'red_hero', 'silver_hero', 'green_stripe', 'white_stripe',
    'black_tee', 'purple_tee', 'teal_tee', 'yellow_vest', 'green_vest',
    'red_vest', 'maroon_vest', 'lime_player', 'blue_player', 'orange_player',
    'purple_overalls', 'blue_overalls', 'green_overalls', 'pink_overalls',
    'golden_tie', 'purple_tie', 'red_tie', 'blue_tie', 'neon_stripe',
    // ... (62 total clothes)
  ],
  
  mouth: [
    'smile_grin', 'smile_cute', 'smile_happy', 'smile_wide', 'smile_teeth',
    'frown_sad', 'frown_angry', 'frown_disappointed', 'neutral_line'
  ],
  
  eyes: [
    'glowing_neon', 'glowing_cyan', 'glowing_pink', 'glowing_orange', 'glowing_gold', 'glowing_white',
    'laser_blue', 'laser_red', 'laser_green', 'laser_purple', 'laser_yellow',
    'normal_black', 'normal_blue', 'normal_brown', 'normal_green', 'normal_hazel',
    'angry_dark', 'angry_fierce', 'angry_fire', 'angry_intense', 'angry_red',
    'sleepy_closed', 'sleepy_droopy', 'sleepy_half', 'sleepy_tired', 'sleepy_yawn',
    'happy_cheerful', 'surprised_wide', 'curious_look', 'focused_stare',
    'winking_left', 'sad_tears', 'shocked_big', 'shifty_side', 'dizzy_spiral'
  ],
  
  hat: [
    'cap_baseball', 'cap_snapback', 'cap_fitted', 'cap_trucker', 'cap_beanie',
    'bandana_black', 'bandana_blue', 'bandana_red', 'bandana_white', 'bandana_pattern',
    'crown_gold', 'crown_silver', 'crown_iron', 'crown_jeweled', 'crown_wooden',
    'beanie_striped', 'sombrero_classic', 'visor_sport',
    'hat_fedora', 'hat_cowboy', 'hat_top', 'hat_bowler', 'hat_beret',
    'wig_black', 'wig_blonde', 'wig_brown', 'wig_red', 'wig_purple',
    'helmet_racing', 'helmet_motorcycle', 'helmet_military', 'helmet_fire', 'helmet_construction',
    'headband_sport', 'headband_sweat', 'headband_thick', 'headband_yoga', 'headband_terry',
    'hoodie_hood', 'hoodie_zip', 'hoodie_pullover', 'hoodie_oversized', 'hoodie_crop',
    'hats_41',
    'None'
  ]
},

traitRarityWeights: {
  background: {
    'space_galaxy': 2,      // Rarest
    'sunset_orange': 5,
    'analos': 10,
    'gradient_purple': 15,
    'solid_blue': 30,
    'baige': 38             // Most common
  },
  
  body: {
    'robot': 2,             // Rarest
    'zombie': 5,
    'gold': 10,
    'brown': 20,
    'analos': 30,
    'baige': 33             // Most common
  },
  
  // Clothes - all relatively common (you have 62!)
  clothes: {
    'pink_hero': 1,
    'cyan_stripe': 1,
    'orange_hoodie': 1,
    // Equal weight for all = truly random
  },
  
  mouth: {
    'smile_grin': 8,
    'smile_cute': 10,
    'smile_happy': 12,
    'smile_wide': 12,
    'smile_teeth': 15,
    'neutral_line': 18,
    'frown_sad': 15,
    'frown_angry': 10,
    'frown_disappointed': 10
  },
  
  eyes: {
    'glowing_neon': 2,      // Rarest
    'glowing_cyan': 3,
    'laser_blue': 3,
    'laser_red': 3,
    'laser_purple': 3,
    'angry_fire': 5,
    'dizzy_spiral': 8,
    'shocked_big': 10,
    'normal_hazel': 15,
    'normal_blue': 15,
    'normal_black': 25,     // Most common
    // ... etc
  },
  
  hat: {
    'crown_gold': 1,        // Rarest
    'crown_jeweled': 2,
    'helmet_racing': 3,
    'sombrero_classic': 5,
    'visor_sport': 8,
    'beanie_striped': 10,
    'cap_baseball': 15,
    'cap_snapback': 18,
    'bandana_black': 20,
    'None': 30              // Most common
  }
}
```

## Rarity Score Logic (Already Good!)

The rarity score calculation is PERFECT:
- Lower weight = Rarer trait = Higher score
- Formula: `100 / weight`
- Example: `crown_gold` (weight: 1) = score of 100/1 = 100 (LEGENDARY!)
- Example: `bandana_black` (weight: 20) = score of 100/20 = 5 (COMMON)

## Next Steps

1. Update `src/config/los-bros-collection.ts` with actual filenames
2. Redeploy
3. Future mints will have proper trait-to-file matching!
4. For existing NFTs, run the fix scripts we created

