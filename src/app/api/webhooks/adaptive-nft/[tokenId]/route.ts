/**
 * ADAPTIVE NFT WEBHOOK
 * Handles webhook events for adaptive NFT updates
 */

import { NextRequest, NextResponse } from 'next/server';
import AdaptiveNFTService from '@/lib/adaptive-nft-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const resolvedParams = await params;
    const tokenId = resolvedParams.tokenId;
    const body = await request.json();
    
    const { eventType, newHolderWallet, signature } = body;

    // Verify webhook signature (in production)
    if (!verifyWebhookSignature(request, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const adaptiveService = new AdaptiveNFTService();

    switch (eventType) {
      case 'transfer':
        // NFT was transferred to new holder
        await adaptiveService.updateAdaptiveNFT(tokenId, newHolderWallet);
        break;
        
      case 'scheduled':
        // Scheduled update (daily/weekly)
        await adaptiveService.updateAdaptiveNFT(tokenId);
        break;
        
      case 'wallet_change':
        // Holder's wallet composition changed
        await adaptiveService.updateAdaptiveNFT(tokenId);
        break;
        
      case 'manual':
        // Manual trigger
        await adaptiveService.updateAdaptiveNFT(tokenId);
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      tokenId,
      eventType,
      timestamp: new Date().toISOString(),
      message: `Adaptive NFT ${tokenId} updated successfully`
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Verify webhook signature for security
 */
function verifyWebhookSignature(request: NextRequest, signature: string): boolean {
  // In production, verify HMAC signature
  // For now, just check if signature exists
  return !!signature;
}
