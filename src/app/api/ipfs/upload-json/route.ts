import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, jsonContent } = body;

    if (!name || !jsonContent) {
      return NextResponse.json(
        { success: false, error: 'Name and jsonContent are required' },
        { status: 400 }
      );
    }

    console.log('📤 Uploading JSON to IPFS:', name);

    // For now, we'll use a simple approach with Pinata
    // In production, you'd want to use your own IPFS node or service
    const PINATA_API_KEY = process.env.PINATA_API_KEY;
    const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;

    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
      console.warn('⚠️ Pinata credentials not configured, using fallback');
      
      // Fallback: Return a mock IPFS URL for development
      const mockCid = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      const mockUrl = `https://gateway.pinata.cloud/ipfs/${mockCid}`;
      
      return NextResponse.json({
        success: true,
        cid: mockCid,
        url: mockUrl,
        message: 'Mock IPFS upload (Pinata not configured)'
      });
    }

    // Upload to Pinata
    const formData = new FormData();
    formData.append('file', new Blob([JSON.stringify(jsonContent, null, 2)], { type: 'application/json' }), `${name}.json`);
    
    const metadata = JSON.stringify({
      name: name,
      keyvalues: {
        type: 'profile-nft-metadata',
        platform: 'analos'
      }
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
      cidVersion: 1
    });
    formData.append('pinataOptions', options);

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Pinata upload failed: ${errorData.error?.details || response.statusText}`);
    }

    const result = await response.json();
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;

    console.log('✅ JSON uploaded to IPFS:', ipfsUrl);

    return NextResponse.json({
      success: true,
      cid: result.IpfsHash,
      url: ipfsUrl,
      message: 'Successfully uploaded to IPFS'
    });

  } catch (error: any) {
    console.error('❌ IPFS upload error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to upload to IPFS' 
      },
      { status: 500 }
    );
  }
}
