/**
 * UPLOAD LOGO TO IPFS SCRIPT
 * Uploads your pre-reveal logo to Pinata IPFS
 */

import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY || '';
const PINATA_SECRET = process.env.PINATA_SECRET_API_KEY || '';

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

async function uploadToPinata(filePath: string, fileName: string): Promise<string> {
  console.log(`📤 Uploading ${fileName} to Pinata IPFS...`);

  if (!PINATA_API_KEY || !PINATA_SECRET) {
    throw new Error('Pinata API keys not configured!');
  }

  const url = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
  
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));
  
  // Add metadata
  const metadata = JSON.stringify({
    name: fileName,
    keyvalues: {
      collection: 'living_portfolio_genesis',
      type: 'pre_reveal_logo',
      uploadedAt: new Date().toISOString()
    }
  });
  formData.append('pinataMetadata', metadata);

  // Add options
  const options = JSON.stringify({
    cidVersion: 1
  });
  formData.append('pinataOptions', options);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET,
        ...formData.getHeaders()
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinata upload failed: ${response.statusText}\n${errorText}`);
    }

    const result: PinataResponse = await response.json();
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
    
    console.log(`✅ Upload successful!`);
    console.log(`   IPFS Hash: ${result.IpfsHash}`);
    console.log(`   URL: ${ipfsUrl}`);
    console.log(`   Size: ${(result.PinSize / 1024).toFixed(2)} KB`);

    return ipfsUrl;

  } catch (error) {
    console.error('❌ Upload failed:', error);
    throw error;
  }
}

async function uploadLogoFromLosBros(logoFileName?: string): Promise<string> {
  const losBrosPath = 'C:\\Users\\dusti\\OneDrive\\Desktop\\LosBros';
  
  // If specific file provided, use it
  if (logoFileName) {
    const fullPath = path.join(losBrosPath, logoFileName);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${fullPath}`);
    }

    return await uploadToPinata(fullPath, logoFileName);
  }

  // Otherwise, look for common logo names
  const commonLogoNames = [
    'logo.png',
    'logo.jpg',
    'analos.png',
    'losbros.png',
    'collection_logo.png'
  ];

  for (const logoName of commonLogoNames) {
    const fullPath = path.join(losBrosPath, logoName);
    if (fs.existsSync(fullPath)) {
      console.log(`🎯 Found logo: ${logoName}`);
      return await uploadToPinata(fullPath, logoName);
    }
  }

  // If no logo found, show available files
  console.log('\n📁 Available files in LosBros folder:');
  const files = fs.readdirSync(losBrosPath);
  files.forEach((file, index) => {
    if (file.match(/\.(png|jpg|jpeg|gif)$/i)) {
      console.log(`  ${index + 1}. ${file}`);
    }
  });

  throw new Error('No logo found. Please specify the filename.');
}

async function createCollectionMetadata(
  logoUrl: string,
  collectionName: string = 'Living Portfolio Genesis',
  description: string = "World's first auto-investing, self-evolving NFTs on Analos"
): Promise<string> {
  console.log('\n📝 Creating collection metadata...');

  const metadata = {
    name: collectionName,
    symbol: 'LPGEN',
    description: description,
    image: logoUrl,
    attributes: [],
    properties: {
      files: [
        {
          uri: logoUrl,
          type: 'image/png'
        }
      ],
      category: 'image',
      creators: [
        {
          address: '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', // Replace with your wallet
          share: 100
        }
      ]
    },
    collection: {
      name: collectionName,
      family: 'Analos'
    }
  };

  const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: `${collectionName}_metadata.json`
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Metadata upload failed: ${response.statusText}`);
    }

    const result: PinataResponse = await response.json();
    const metadataUrl = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
    
    console.log(`✅ Metadata uploaded!`);
    console.log(`   URL: ${metadataUrl}`);

    return metadataUrl;

  } catch (error) {
    console.error('❌ Metadata upload failed:', error);
    throw error;
  }
}

async function updateSupabaseWithLogo(logoUrl: string, metadataUrl: string): Promise<void> {
  console.log('\n💾 Updating Supabase with logo URLs...');

  const { createClient } = require('@supabase/supabase-js');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    console.log('⚠️ Supabase not configured, skipping database update');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { error } = await supabase
      .from('nft_reveal_control')
      .update({
        pre_reveal_image_url: logoUrl,
        updated_at: new Date().toISOString()
      })
      .eq('collection_id', 'living_portfolio_genesis');

    if (error) {
      throw error;
    }

    console.log('✅ Database updated with logo URL');

  } catch (error) {
    console.error('❌ Database update failed:', error);
    console.error('   You can manually update it later');
  }
}

async function main() {
  console.log('🚀 Logo Upload to IPFS');
  console.log('═══════════════════════════════════════════\n');

  // Get logo filename from command line args
  const logoFileName = process.argv[2];

  if (!PINATA_API_KEY || !PINATA_SECRET) {
    console.error('❌ Error: Pinata API keys not configured');
    console.error('\nPlease set environment variables:');
    console.error('  NEXT_PUBLIC_PINATA_API_KEY=your_api_key');
    console.error('  PINATA_SECRET_API_KEY=your_secret');
    console.error('\nGet your keys from: https://www.pinata.cloud/');
    process.exit(1);
  }

  try {
    // Upload logo
    const logoUrl = await uploadLogoFromLosBros(logoFileName);

    // Create and upload metadata
    const metadataUrl = await createCollectionMetadata(logoUrl);

    // Update Supabase
    await updateSupabaseWithLogo(logoUrl, metadataUrl);

    // Print summary
    console.log('\n🎉 SUCCESS!');
    console.log('═══════════════════════════════════════════');
    console.log(`Logo IPFS URL: ${logoUrl}`);
    console.log(`Metadata URL: ${metadataUrl}`);
    console.log('\n📋 Next steps:');
    console.log('1. Add logo URL to your .env.local:');
    console.log(`   NEXT_PUBLIC_LOGO_IPFS_URL=${logoUrl}`);
    console.log('2. Verify the image loads correctly');
    console.log('3. Use this URL for all pre-reveal NFTs');

  } catch (error) {
    console.error('\n❌ Upload failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { uploadToPinata, uploadLogoFromLosBros, createCollectionMetadata };
