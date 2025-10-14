# 🔧 Analos SDK - Complete Integration Guide

## 📦 Installation

```bash
npm install @analos/sdk @solana/web3.js @coral-xyz/anchor
```

---

## 🚀 SDK Usage

### Initialize SDK:

```typescript
import { AnalosSDK, LaunchMode, MintStage } from '@analos/sdk';
import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection('https://rpc.analos.io', 'confirmed');
const sdk = new AnalosSDK(connection, wallet);
```

---

## 🎨 Create Collection with All Features

### Full Example:

```typescript
// Step 1: Initialize Collection with Stages & Allocations
const collectionParams = {
  maxSupply: 10000,
  priceLamports: 100_000_000, // 0.1 LOS (base price)
  revealThreshold: 5000,
  collectionName: "Analos Genesis",
  collectionSymbol: "ANALOS",
  placeholderUri: "https://analos.io/api/placeholder/{id}",
  launchMode: LaunchMode.NftToToken,  // or LaunchMode.NftOnly
  tokenLaunchEnabled: true,
};

// Stage configurations (incremental pricing)
const stageConfigs = [
  {
    stage: MintStage.Whitelist1,
    priceLamports: 50_000_000,  // 0.05 LOS (50% off)
    maxPerWallet: 5,
    maxSupplyForStage: 1000,
    startTime: Date.now() / 1000,
    endTime: Date.now() / 1000 + 86400,  // 24 hours
    merkleRoot: whitelist1MerkleRoot,
  },
  {
    stage: MintStage.Whitelist2,
    priceLamports: 80_000_000,  // 0.08 LOS (20% off)
    maxPerWallet: 3,
    maxSupplyForStage: 2000,
    startTime: Date.now() / 1000 + 86400,
    endTime: Date.now() / 1000 + 172800,  // Next 24 hours
    merkleRoot: whitelist2MerkleRoot,
  },
  {
    stage: MintStage.Whitelist3,
    priceLamports: 100_000_000,  // 0.1 LOS (no discount)
    maxPerWallet: 2,
    maxSupplyForStage: 2000,
    startTime: Date.now() / 1000 + 172800,
    endTime: Date.now() / 1000 + 259200,
    merkleRoot: whitelist3MerkleRoot,
  },
  {
    stage: MintStage.Public,
    priceLamports: 150_000_000,  // 0.15 LOS (premium for latecomers)
    maxPerWallet: 1,
    maxSupplyForStage: 5000,
    startTime: Date.now() / 1000 + 259200,
    endTime: Date.now() / 1000 + 604800,  // 1 week
    merkleRoot: null,  // No merkle for public
  },
];

// Token allocation
const allocation = {
  poolBps: 6000,        // 60% for trading
  creatorBps: 2000,     // 20% for creator (vested)
  teamBps: 1000,        // 10% for team (vested)
  communityBps: 500,    // 5% for community (immediate)
  platformBps: 500,     // 5% for platform (immediate)
  teamWallet: new PublicKey('TEAM_WALLET_ADDRESS'),
  communityWallet: new PublicKey('COMMUNITY_WALLET_ADDRESS'),
};

// Initialize collection
const { collectionConfig, signature } = await sdk.initializeCollection(
  collectionParams,
  stageConfigs,
  allocation
);

console.log('Collection created:', collectionConfig.toString());
console.log('Transaction:', signature);
```

---

## 👤 Create Creator Profile

```typescript
// Step 2: Set up creator profile (on-chain)
const profileData = {
  creatorName: "Dubie & Analos Team",
  bio: "Building the future of NFT-to-Token launchpads on Analos blockchain",
  profileImageUri: "https://analos.io/images/team-avatar.png",
  projectDescription: "Analos Genesis is the first collection on our revolutionary NFT-to-Token launchpad. Each NFT converts to tokens based on rarity, creating a unique circular economy.",
  teamSize: 5,
};

const links = {
  telegram: "t.me/Dubie_420",
  discord: "discord.gg/analos",
  github: "https://github.com/Dubie-eth",
  customLink1: "https://medium.com/@analos",
  customLink1Label: "Medium",
  roadmap: "https://analos.io/roadmap",
  whitepaper: "https://analos.io/whitepaper",
  teamInfo: "https://analos.io/team",
};

// Create profile
await sdk.createCreatorProfile(collectionConfig, profileData);

// Add social links
await sdk.updateCreatorLinks(collectionConfig, links);

// Verify socials (increases trust score)
await sdk.verifyTwitter(collectionConfig, '@EWildn', civicPassToken);
await sdk.verifyWebsite(collectionConfig, 'https://analos.io', dnsProof);
await sdk.verifyGithub(collectionConfig, 'https://github.com/Dubie-eth', gistId);

// Get updated trust score
const profile = await sdk.getCreatorProfile(collectionConfig);
console.log('Trust Score:', profile.trustScore, '/ 10,000');
```

---

## 🏪 Creator Pre-Sale

```typescript
// Step 3: Creator pre-buys tokens at discount (before public launch)
const preSaleAmount = 600_000;  // 10% of pool (6M tokens)

const { cost, discount, signature } = await sdk.creatorPresaleBuy(
  collectionConfig,
  preSaleAmount
);

console.log('Pre-bought:', preSaleAmount, 'tokens');
console.log('Cost:', cost / 1e9, 'LOS');
console.log('Discount:', discount / 100, '%');
console.log('Savings:', (preSaleAmount * (discount / 10000)), 'LOS');

// Tokens locked until migration to DLMM
```

---

## 🎫 Whitelist Minting

```typescript
// User mints during whitelist stage
const { proof, eligible } = await sdk.getWhitelistProof(
  userWallet,
  MintStage.Whitelist1
);

if (eligible) {
  const { nftMint, signature } = await sdk.mintWhitelist(
    collectionConfig,
    proof,
    MintStage.Whitelist1
  );
  
  console.log('Minted NFT:', nftMint.toString());
  console.log('Stage: Whitelist 1');
  console.log('Price paid: 0.05 LOS (50% discount!)');
}
```

---

## 📊 Query Functions

### Get Collection Info:

```typescript
// Get full collection details
const collection = await sdk.getCollection(collectionConfig);

console.log('Name:', collection.collectionName);
console.log('Supply:', collection.currentSupply, '/', collection.maxSupply);
console.log('Stage:', collection.currentStage);
console.log('Is Revealed:', collection.isRevealed);
console.log('Launch Mode:', collection.launchMode);
```

### Get Creator Profile:

```typescript
const profile = await sdk.getCreatorProfile(collectionConfig);

console.log('Creator:', profile.creatorName);
console.log('Trust Score:', profile.trustScore);
console.log('Twitter:', profile.twitterHandle, profile.twitterVerified ? '✅' : '❌');
console.log('Website:', profile.websiteUrl, profile.websiteVerified ? '✅' : '❌');
console.log('KYC:', profile.kycVerified ? '✅ Verified' : '❌ Not Verified');
console.log('Verifications:', profile.verifiedCount, '/ 6');
```

### Get NFT Details:

```typescript
const nftDetails = await sdk.getNftDetails(collectionConfig, nftMint);

console.log('Mint Index:', nftDetails.mintIndex);
console.log('Owner:', nftDetails.owner.toString());
console.log('Rarity Tier:', nftDetails.rarityTier);  // 0-5
console.log('Multiplier:', nftDetails.rarityMultiplier, 'x');
console.log('Tokens Claimed:', nftDetails.tokensClaimed);
console.log('Is Burned:', nftDetails.isBurned);
```

### Get Stage Info:

```typescript
const stageInfo = await sdk.getCurrentStage(collectionConfig);

console.log('Current Stage:', stageInfo.stage);
console.log('Price:', stageInfo.priceLamports / 1e9, 'LOS');
console.log('Max per Wallet:', stageInfo.maxPerWallet);
console.log('Supply for Stage:', stageInfo.currentMinted, '/', stageInfo.maxSupply);
console.log('Time Remaining:', stageInfo.timeRemaining, 'seconds');
```

---

## 🎛️ Admin SDK Functions

### Update Platform Settings:

```typescript
import { AnalosAdminSDK } from '@analos/sdk/admin';

const adminSDK = new AnalosAdminSDK(connection, adminWallet);

// Update platform fees
await adminSDK.updatePlatformFees({
  platformFeeBps: 500,    // 5%
  minFeeBps: 300,         // Min 3%
  maxFeeBps: 1000,        // Max 10%
});

// Update presale limits
await adminSDK.updatePresaleLimits({
  maxPresaleBps: 1500,     // Max 15% of pool
  maxDiscountBps: 3000,    // Max 30% discount
});

// Update allocation limits
await adminSDK.updateAllocationLimits({
  minPoolBps: 5000,        // Min 50% pool
  maxCreatorBps: 3000,     // Max 30% creator
  maxTeamBps: 2000,        // Max 20% team
  maxCommunityBps: 1000,   // Max 10% community
});

// Emergency pause
await adminSDK.emergencyPause(
  true,
  "Temporary maintenance - resuming in 1 hour"
);

// Withdraw platform revenue
await adminSDK.withdrawPlatformFees(amount);
```

---

## 📱 React Hooks

### useCollection:

```typescript
import { useCollection } from '@analos/sdk/react';

const MyComponent = () => {
  const { collection, loading, error } = useCollection(collectionConfigPubkey);
  
  if (loading) return <Loading />;
  if (error) return <Error message={error} />;
  
  return (
    <div>
      <h1>{collection.collectionName}</h1>
      <p>Supply: {collection.currentSupply} / {collection.maxSupply}</p>
      <p>Stage: {collection.currentStage}</p>
      <p>Price: {collection.getCurrentPrice()} LOS</p>
    </div>
  );
};
```

### useCreatorProfile:

```typescript
import { useCreatorProfile } from '@analos/sdk/react';

const CreatorInfo = ({ collectionConfig }) => {
  const { profile, loading } = useCreatorProfile(collectionConfig);
  
  if (loading) return <Skeleton />;
  
  return (
    <div className="creator-profile">
      <img src={profile.profileImageUri} />
      <h2>{profile.creatorName}</h2>
      <TrustBadge score={profile.trustScore} />
      
      <div className="socials">
        {profile.twitterVerified && (
          <a href={`https://twitter.com/${profile.twitterHandle}`}>
            <TwitterIcon /> @{profile.twitterHandle} ✅
          </a>
        )}
        {/* ... more socials ... */}
      </div>
    </div>
  );
};
```

### useMintStage:

```typescript
import { useMintStage } from '@analos/sdk/react';

const MintButton = ({ collectionConfig }) => {
  const { stage, price, canMint, timeRemaining } = useMintStage(
    collectionConfig,
    wallet.publicKey
  );
  
  return (
    <button disabled={!canMint}>
      {stage === MintStage.Whitelist1 && `Mint for ${price} LOS (VIP Price!)`}
      {stage === MintStage.Public && `Mint for ${price} LOS`}
      {timeRemaining && `Ends in ${formatTime(timeRemaining)}`}
    </button>
  );
};
```

---

## ✅ Complete SDK Feature Set

### Collection Management:
```typescript
sdk.initializeCollection()
sdk.getCollection()
sdk.mintWhitelist()
sdk.mintPublic()
sdk.revealCollection()
sdk.advanceStage()
```

### Creator Profile:
```typescript
sdk.createCreatorProfile()
sdk.updateCreatorLinks()
sdk.verifyTwitter()
sdk.verifyWebsite()
sdk.verifyGithub()
sdk.getCreatorProfile()
sdk.getTrustScore()
```

### NFT Management:
```typescript
sdk.registerNftMint()
sdk.getNftDetails()
sdk.setNftRarity()
sdk.markTokensClaimed()
sdk.burnNftForTokens()
```

### Whitelist:
```typescript
sdk.getWhitelistProof()
sdk.verifyWhitelistEligibility()
sdk.getMinterStats()
```

### Token Launch:
```typescript
sdk.creatorPresaleBuy()
sdk.getPresaleInfo()
sdk.getAllocation()
sdk.getVestingSchedule()
```

### Admin (Admin Wallet Only):
```typescript
adminSDK.updatePlatformFees()
adminSDK.updatePresaleLimits()
adminSDK.updateAllocationLimits()
adminSDK.emergencyPause()
adminSDK.withdrawPlatformFees()
adminSDK.getRevenue()
```

---

## 🎉 Complete Ecosystem

**With the Analos SDK, developers can:**
- ✅ Launch NFT-Only collections (simple)
- ✅ Launch NFT-to-Token collections (complex)
- ✅ Configure multi-stage whitelists
- ✅ Set incremental pricing
- ✅ Manage token allocations
- ✅ Create verified creator profiles
- ✅ Build trust with social verification
- ✅ Implement pre-sales
- ✅ Query all on-chain data
- ✅ Admin controls everything

**All accessible via clean, typed SDK!** 🚀

