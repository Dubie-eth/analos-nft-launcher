/**
 * Metadata Generator for NFT Reveals
 * 
 * Generates trait configurations and metadata JSON files for:
 * 1. Placeholder (pre-reveal)
 * 2. Revealed NFTs with randomized traits
 * 
 * Run: ts-node app/metadata-generator.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';

// Trait configuration - customize for your collection
const TRAIT_CONFIG = {
  backgrounds: [
    { name: 'Cosmic Purple', rarity: 5 },
    { name: 'Nebula Blue', rarity: 10 },
    { name: 'Solar Orange', rarity: 15 },
    { name: 'Space Black', rarity: 30 },
    { name: 'Starlight White', rarity: 40 },
  ],
  characters: [
    { name: 'Legendary Robot', rarity: 5 },
    { name: 'Alien Commander', rarity: 10 },
    { name: 'Space Warrior', rarity: 15 },
    { name: 'Cosmic Explorer', rarity: 30 },
    { name: 'Star Traveler', rarity: 40 },
  ],
  eyes: [
    { name: 'Laser Eyes', rarity: 5 },
    { name: 'Cyber Eyes', rarity: 10 },
    { name: 'Galaxy Eyes', rarity: 15 },
    { name: 'Crystal Eyes', rarity: 30 },
    { name: 'Standard Eyes', rarity: 40 },
  ],
  accessories: [
    { name: 'Golden Crown', rarity: 5 },
    { name: 'Plasma Sword', rarity: 10 },
    { name: 'Holographic Badge', rarity: 15 },
    { name: 'Energy Shield', rarity: 30 },
    { name: 'Basic Gear', rarity: 40 },
  ],
};

// Placeholder metadata (before reveal)
const PLACEHOLDER_METADATA = {
  name: 'Analos Mystery Box',
  symbol: 'ANAL',
  description: 'A mysterious NFT from the Analos collection. Will you reveal something legendary? 🎁',
  image: 'https://arweave.net/placeholder-mystery-box.png',
  animation_url: '',
  external_url: 'https://your-website.com',
  attributes: [
    {
      trait_type: 'Status',
      value: 'Unrevealed',
    },
  ],
  properties: {
    files: [
      {
        uri: 'https://arweave.net/placeholder-mystery-box.png',
        type: 'image/png',
      },
    ],
    category: 'image',
    creators: [
      {
        address: 'YOUR_CREATOR_ADDRESS',
        share: 100,
      },
    ],
    revealed: false,
  },
  seller_fee_basis_points: 500, // 5% royalty
};

/**
 * Generate a trait value based on rarity weights
 */
function selectTraitByRarity(traits: Array<{ name: string; rarity: number }>): string {
  const totalWeight = traits.reduce((sum, t) => sum + t.rarity, 0);
  let random = Math.random() * totalWeight;

  for (const trait of traits) {
    random -= trait.rarity;
    if (random <= 0) {
      return trait.name;
    }
  }

  return traits[traits.length - 1].name;
}

/**
 * Determine rarity tier based on trait combination
 */
function calculateRarityTier(traits: Record<string, string>): string {
  let rarityScore = 0;

  // Check each trait's rarity
  Object.entries(traits).forEach(([category, value]) => {
    const traitConfig = TRAIT_CONFIG[category as keyof typeof TRAIT_CONFIG];
    const trait = traitConfig.find(t => t.name === value);
    if (trait) {
      rarityScore += trait.rarity <= 5 ? 40 : trait.rarity <= 10 ? 30 : trait.rarity <= 15 ? 20 : 10;
    }
  });

  if (rarityScore >= 140) return 'Legendary';
  if (rarityScore >= 100) return 'Epic';
  if (rarityScore >= 60) return 'Rare';
  return 'Common';
}

/**
 * Generate revealed metadata for a specific NFT index
 */
function generateRevealedMetadata(index: number, seed: string): any {
  // Generate deterministic traits based on index and seed
  const hashInput = `${seed}-${index}`;
  const hash = createHash('sha256').update(hashInput).digest('hex');

  // Use hash to seed trait selection (deterministic randomness)
  const rng = parseInt(hash.substring(0, 8), 16) / 0xffffffff;
  Math.random = (() => {
    let seed = rng;
    return () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  })();

  // Select traits
  const traits = {
    backgrounds: selectTraitByRarity(TRAIT_CONFIG.backgrounds),
    characters: selectTraitByRarity(TRAIT_CONFIG.characters),
    eyes: selectTraitByRarity(TRAIT_CONFIG.eyes),
    accessories: selectTraitByRarity(TRAIT_CONFIG.accessories),
  };

  const rarityTier = calculateRarityTier(traits);

  return {
    name: `Analos Mystery #${index}`,
    symbol: 'ANAL',
    description: `A ${rarityTier.toLowerCase()} NFT from the Analos Mystery Collection. This unique piece features ${traits.characters} with ${traits.eyes} against a ${traits.backgrounds} background.`,
    image: `https://arweave.net/revealed/${index}.png`,
    animation_url: '',
    external_url: `https://your-website.com/nft/${index}`,
    attributes: [
      { trait_type: 'Rarity', value: rarityTier },
      { trait_type: 'Background', value: traits.backgrounds },
      { trait_type: 'Character', value: traits.characters },
      { trait_type: 'Eyes', value: traits.eyes },
      { trait_type: 'Accessory', value: traits.accessories },
      { trait_type: 'Edition', value: `#${index}` },
    ],
    properties: {
      files: [
        {
          uri: `https://arweave.net/revealed/${index}.png`,
          type: 'image/png',
        },
      ],
      category: 'image',
      creators: [
        {
          address: 'YOUR_CREATOR_ADDRESS',
          share: 100,
        },
      ],
      revealed: true,
    },
    seller_fee_basis_points: 500,
  };
}

/**
 * Generate all metadata files
 */
function generateMetadataFiles() {
  const outputDir = path.join(__dirname, '../metadata');
  const placeholderDir = path.join(outputDir, 'placeholder');
  const revealedDir = path.join(outputDir, 'revealed');

  // Create directories
  [outputDir, placeholderDir, revealedDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Generate placeholder metadata
  fs.writeFileSync(
    path.join(placeholderDir, 'mystery-box.json'),
    JSON.stringify(PLACEHOLDER_METADATA, null, 2)
  );
  console.log('✅ Generated placeholder metadata');

  // Generate revealed metadata for collection (e.g., 10,000 NFTs)
  const collectionSize = 10000;
  const globalSeed = 'analos-mystery-collection-seed'; // Use actual on-chain seed

  console.log(`\n🎨 Generating metadata for ${collectionSize} NFTs...`);
  
  const rarityStats = {
    Legendary: 0,
    Epic: 0,
    Rare: 0,
    Common: 0,
  };

  for (let i = 0; i < collectionSize; i++) {
    const metadata = generateRevealedMetadata(i, globalSeed);
    fs.writeFileSync(
      path.join(revealedDir, `${i}.json`),
      JSON.stringify(metadata, null, 2)
    );

    rarityStats[metadata.attributes[0].value as keyof typeof rarityStats]++;

    if ((i + 1) % 1000 === 0) {
      console.log(`Generated ${i + 1}/${collectionSize} metadata files...`);
    }
  }

  console.log('\n✅ All metadata generated!');
  console.log('\n📊 Rarity Distribution:');
  console.log('========================');
  Object.entries(rarityStats).forEach(([rarity, count]) => {
    const percentage = ((count / collectionSize) * 100).toFixed(2);
    console.log(`${rarity}: ${count} (${percentage}%)`);
  });

  console.log('\n📁 Output locations:');
  console.log(`Placeholder: ${placeholderDir}/mystery-box.json`);
  console.log(`Revealed: ${revealedDir}/0.json - ${collectionSize - 1}.json`);
  console.log('\n🚀 Next steps:');
  console.log('1. Upload placeholder to IPFS/Arweave');
  console.log('2. Generate and upload corresponding images');
  console.log('3. Upload revealed metadata to IPFS/Arweave');
  console.log('4. Update collection URIs in initialization script');
}

// Run the generator
if (require.main === module) {
  console.log('🎭 Analos NFT Metadata Generator\n');
  generateMetadataFiles();
}

export { generateRevealedMetadata, PLACEHOLDER_METADATA, TRAIT_CONFIG };

