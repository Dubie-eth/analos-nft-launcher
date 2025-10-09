import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { verificationId, proofData, timestamp } = await request.json();

    // Validate required fields
    if (!verificationId || !proofData || !Array.isArray(proofData)) {
      return NextResponse.json(
        { error: 'Missing required fields: verificationId, proofData' },
        { status: 400 }
      );
    }

    // In a real implementation, you would:
    // 1. Retrieve verification request from database
    // 2. Validate proof data
    // 3. Check if verification is still valid (not expired)
    // 4. Update verification status to 'completed'
    // 5. Generate verification badge

    // For now, we'll simulate a successful verification
    const verifiedPlatforms = proofData.map(proof => proof.platform);
    const verificationDate = timestamp || new Date().toISOString();
    const badgeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://analos-nft-launcher-9cxc.vercel.app'}/api/verification/badge?id=${verificationId}&size=medium&platforms=${verifiedPlatforms.join(',')}`;

    const verificationStatus = {
      isVerified: true,
      verifiedPlatforms,
      verificationDate,
      verificationId,
      badgeUrl
    };

    // TODO: Store verification status in database
    console.log('Verification completed:', {
      verificationId,
      verificationStatus,
      proofData
    });

    return NextResponse.json({
      success: true,
      data: verificationStatus
    });

  } catch (error) {
    console.error('Error completing verification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
