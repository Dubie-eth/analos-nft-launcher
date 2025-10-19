# Testing Profile NFT System on onlyanal.fun

## 🎯 Overview
The blockchain-based profile NFT system has been deployed to production. Profile NFTs are stored directly on the **Analos blockchain** (not Supabase), making them truly decentralized and immutable.

## ✅ What Was Implemented

### 1. **Blockchain Storage**
- Profile NFTs are stored on-chain using the Analos Monitoring System program
- Program ID: `7PT1ubRGFWXFCmZTpsa9gtm9GZf8BaYTkSd7gE8VcXdG`
- Each user can mint one profile card NFT for **4.20 LOS**

### 2. **Key Features**
- ✨ Compressed NFT profile cards with user info
- 🎴 Beautiful card design with avatar, bio, and social links
- 🔗 Personalized referral codes based on username
- 📤 Social sharing (Twitter, Discord, Telegram)
- 🔐 Stored on Analos blockchain (immutable)
- 💰 4.20 LOS minting fee

### 3. **Integration Points**
- **Beta Signup Flow**: Users can create profile → mint NFT
- **Profile Manager**: New "Profile NFT" tab in profile setup
- **Blockchain Profile**: Separate tab for on-chain profile data
- **Marketplace Ready**: NFTs can be listed/traded (future)

## 🧪 Testing Steps

### Step 1: Access the Profile Manager
1. Go to `https://onlyanal.fun`
2. Connect your wallet (admin or regular user)
3. Navigate to **Beta Signup** or **Profile** page
4. Click on the **Profile NFT** tab

### Step 2: Complete Your Profile (if needed)
Before minting an NFT, ensure you have:
- ✅ Username (3-20 characters, alphanumeric)
- ✅ Display name
- ✅ Bio (optional)
- ✅ Avatar URL (optional)
- ✅ Social links (optional)

### Step 3: Mint Your First Profile NFT
1. In the **Profile NFT** tab, click **"Mint Profile NFT Card"**
2. Review the preview of your profile card
3. Confirm you want to pay **4.20 LOS**
4. Approve the transaction in your wallet
5. Wait for blockchain confirmation

### Step 4: Verify NFT Creation
After minting:
- ✅ Transaction signature should be displayed
- ✅ NFT account address on Analos blockchain
- ✅ Explorer link to view on-chain data
- ✅ Social sharing buttons appear

### Step 5: Share Your NFT
Use the social sharing buttons to:
- Tweet your profile card with referral code
- Share on Discord
- Share on Telegram
- Copy direct link

## 🔍 What to Look For

### Success Indicators
- ✅ Transaction completes successfully
- ✅ Profile NFT appears in your wallet/profile
- ✅ Referral code is personalized (based on username)
- ✅ Can view NFT on Analos explorer
- ✅ Cannot mint a second NFT (one per user)

### Potential Issues to Test
- ⚠️ What happens if you try to mint twice?
- ⚠️ Does it work with incomplete profiles?
- ⚠️ Do social sharing links work correctly?
- ⚠️ Is the 4.20 LOS fee deducted properly?

## 🔧 Technical Details

### On-Chain Storage
```typescript
ProfileNFT Account {
  wallet: PublicKey,           // User's wallet
  username: string,            // Unique username
  displayName: string,         // Display name
  bio: string,                 // User bio
  avatarUrl: string,           // Profile picture
  bannerUrl: string,           // Banner image
  referralCode: string,        // Personalized code
  twitterHandle: string,       // Twitter (if verified)
  twitterVerified: bool,       // Verification status
  website: string,             // Website URL
  discord: string,             // Discord handle
  telegram: string,            // Telegram handle
  github: string,              // GitHub username
  nftMetadata: string,         // JSON metadata
  mintPrice: u64,              // 4.20 LOS (in lamports)
  explorerUrl: string,         // Explorer link
  mintSignature: string,       // Mint transaction
  createdAt: i64,              // Creation timestamp
  updatedAt: i64               // Last update
}
```

### API Endpoints
- `POST /api/profile-nft/mint` - Mint a new profile NFT
- `GET /api/profile-nft/check/[wallet]` - Check if user has NFT
- `POST /api/profile-nft/generate-image` - Generate NFT image

## 🚀 Next Steps

### For Testing
1. Mint your first profile NFT as admin
2. Test with a regular user account
3. Try to mint a second NFT (should fail)
4. Test social sharing functionality
5. Verify NFT appears on Analos explorer

### For Marketplace
Once profile NFTs are working:
- List profile NFTs on marketplace
- Allow users to trade/sell their profile cards
- Add rarity traits (verified, early adopter, etc.)
- Create collections of profile cards

## 💡 Tips for Testing

1. **Use Admin Wallet First**: Test with your admin wallet to ensure everything works
2. **Check Analos Explorer**: Verify NFT data is actually on-chain
3. **Test Referral Codes**: Make sure codes are unique and personalized
4. **Try Edge Cases**: Empty profiles, special characters, etc.
5. **Monitor Gas Fees**: Ensure 4.20 LOS fee is correct

## 📝 Feedback

After testing, note:
- UI/UX improvements needed?
- Any errors or bugs encountered?
- Performance issues?
- Additional features desired?

---

**Ready to mint your first profile NFT on onlyanal.fun! 🎴✨**

