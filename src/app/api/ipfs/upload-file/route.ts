import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File is required' },
        { status: 400 }
      );
    }

    console.log('📤 Uploading file to IPFS:', file.name);

    // For now, we'll use a simple approach with Pinata
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
    const pinataFormData = new FormData();
    pinataFormData.append('file', file);
    
    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        type: 'nft-asset',
        platform: 'analos'
      }
    });
    pinataFormData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
      cidVersion: 1
    });
    pinataFormData.append('pinataOptions', options);

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_KEY,
      },
      body: pinataFormData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Pinata upload failed: ${errorData.error?.details || response.statusText}`);
    }

    const result = await response.json();
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;

    console.log('✅ File uploaded to IPFS:', ipfsUrl);

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
