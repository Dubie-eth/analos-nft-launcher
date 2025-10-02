import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const provider = formData.get('provider') as string;

    if (!file || !name) {
      return NextResponse.json({ error: 'Missing file or name' }, { status: 400 });
    }

    // Use server-side environment variables for security
    const pinataApiKey = process.env.PINATA_API_KEY || '';
    const pinataSecret = process.env.PINATA_SECRET_KEY || '';

    if (provider === 'pinata' && pinataApiKey && pinataSecret) {
      // Upload to Pinata using server-side credentials
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('pinataMetadata', JSON.stringify({
        name,
        keyvalues: {
          type: 'nft-image',
          timestamp: Date.now(),
        }
      }));

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'pinata_api_key': pinataApiKey,
          'pinata_secret_api_key': pinataSecret,
        },
        body: uploadFormData
      });

      if (!response.ok) {
        throw new Error(`Pinata upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return NextResponse.json({
        success: true,
        url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
        provider: 'pinata'
      });
    } else {
      // Fallback to placeholder
      return NextResponse.json({
        success: true,
        url: `https://picsum.photos/512/512?random=${Date.now()}`,
        provider: 'fallback'
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
