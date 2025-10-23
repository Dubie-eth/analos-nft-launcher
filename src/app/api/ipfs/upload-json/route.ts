/**
 * API Route: Upload JSON/HTML content to IPFS
 * Handles animated NFT HTML uploads
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadJSONToIPFS } from '@/lib/backend-api';

export async function POST(request: NextRequest) {
  try {
    const { content, filename } = await request.json();

    if (!content || !filename) {
      return NextResponse.json(
        { success: false, error: 'Content and filename are required' },
        { status: 400 }
      );
    }

    // Upload content to IPFS
    const result = await uploadJSONToIPFS(content, filename);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to upload to IPFS' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      hash: result.hash
    });

  } catch (error) {
    console.error('IPFS upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}