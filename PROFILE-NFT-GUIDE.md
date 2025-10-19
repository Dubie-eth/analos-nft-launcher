# Profile NFT System Guide

## Overview
The Profile NFT system allows users to create their first NFT - a personalized profile card that they can share on social media with their referral code embedded.

## Features

### 🎴 Profile NFT Creation
- **First NFT**: Users' first NFT is automatically their profile card
- **Personalized Design**: Beautiful card with user's info, avatar, and referral code
- **Mint Price**: 4.20 LOS (fun reference to crypto culture)
- **One Per User**: Each user can only mint one profile NFT

### 🎨 NFT Design
- **Card Layout**: Professional playing card style design
- **User Info**: Username, display name, bio, avatar, banner
- **Referral Code**: Prominently displayed for social sharing
- **Verification Badges**: Shows Twitter verification status
- **Blockchain Info**: Shows it's minted on Analos blockchain

### 🔗 Social Integration
- **Social Sharing**: Built-in sharing to Twitter, Telegram, Discord
- **Referral Code**: Embedded in the NFT for viral growth
- **Profile Sync**: Automatically uses profile data from blockchain profile system

## How It Works

### For Users:
1. **Complete Profile** → Fill out username, bio, social links
2. **Navigate to NFT Tab** → Go to Profile NFT section
3. **Preview Profile Card** → See how the NFT will look
4. **Pay 4.20 LOS** → Mint the profile NFT
5. **Share on Social** → Use built-in sharing tools with referral code

### For Developers:
1. **Database Setup** → Run `scripts/setup-profile-nfts.sql`
2. **API Endpoints** → Use `/api/profile-nft/*` endpoints
3. **Image Generation** → SVG cards generated dynamically
4. **Metadata** → Full NFT metadata with attributes

## Database Setup

Run this SQL script in your Supabase SQL editor:

```sql
-- Run the setup script
\i scripts/setup-profile-nfts.sql
```

## API Endpoints

### Mint Profile NFT
```typescript
POST /api/profile-nft/mint
{
  "walletAddress": "string",
  "username": "string",
  "displayName": "string",
  "bio": "string",
  "avatarUrl": "string",
  "bannerUrl": "string",
  "referralCode": "string",
  "twitterHandle": "string",
  "twitterVerified": boolean,
  "mintPrice": 4.20
}
```

### Check Existing NFT
```typescript
GET /api/profile-nft/check/[walletAddress]
```

### Generate Card Image
```typescript
GET /api/profile-nft/generate-image?username=...&referralCode=...
```

## Components

### ProfileNFTCreator
Main component for creating profile NFTs with:
- Profile preview
- Minting interface
- Social sharing tools
- Success/error handling

### Integration Points
- **CompleteProfileManager**: NFT tab added
- **BlockchainProfileManager**: Syncs with blockchain profiles
- **Social Verification**: Shows verification status

## NFT Metadata Structure

```json
{
  "name": "Username's Profile Card",
  "description": "Official Profile Card with referral code...",
  "image": "/api/profile-nft/generate-image?...",
  "attributes": [
    {"trait_type": "Username", "value": "username"},
    {"trait_type": "Referral Code", "value": "REF123"},
    {"trait_type": "Twitter Verified", "value": true},
    {"trait_type": "Profile Type", "value": "Official Profile Card"},
    {"trait_type": "Mint Price", "value": "4.20 LOS"},
    {"trait_type": "Blockchain", "value": "Analos"},
    {"trait_type": "Rarity", "value": "Common"},
    {"trait_type": "Card Number", "value": 1}
  ]
}
```

## Social Sharing

The system generates optimized sharing text:

```
🎴 Just minted my official Profile Card NFT on Analos! ✅

👤 Username (@twitterhandle)
🔗 Referral Code: REF123
🎨 My first NFT is my profile card!

Join me on @onlyanal.fun and use my referral code: REF123

#Analos #NFT #ProfileCard #Web3 #Blockchain
```

## Benefits

### For Users:
- **First NFT Experience**: Easy entry into NFTs
- **Social Sharing**: Viral growth through referral codes
- **Professional Look**: Beautiful profile cards
- **Verification**: Shows social verification status

### For Platform:
- **User Engagement**: Fun way to get users into NFTs
- **Viral Growth**: Referral codes in every shared NFT
- **Revenue**: 4.20 LOS minting fee
- **Onboarding**: Smooth introduction to blockchain features

## Future Enhancements

- **Rarity System**: Different card designs based on verification level
- **Upgrades**: Allow users to upgrade their profile cards
- **Collections**: Group profile cards into collections
- **Marketplace**: Trade profile cards
- **Gaming**: Use profile cards in games/competitions

## Technical Notes

- **Compressed NFTs**: Uses Solana's compressed NFT standard for cost efficiency
- **SVG Generation**: Dynamic image generation for customization
- **Database Storage**: Full metadata stored in Supabase
- **Blockchain Integration**: Works with existing blockchain profile system
- **Social Integration**: Seamless sharing with referral codes

This system creates a perfect entry point for users into the NFT world while driving viral growth through referral codes embedded in every shared profile card!
