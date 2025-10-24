import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * GET /api/los-bros/generate-image
 * Generates SVG placeholder for Los Bros NFTs
 * TODO: Replace with actual trait-based image generation
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tokenId = searchParams.get('tokenId') || '0';

  // Generate a unique gradient based on token ID
  const hue1 = (parseInt(tokenId) * 137) % 360;
  const hue2 = (hue1 + 60) % 360;

  const svg = `
    <svg width="500" height="500" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad${tokenId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:hsl(${hue1},70%,50%);stop-opacity:1" />
          <stop offset="100%" style="stop-color:hsl(${hue2},70%,50%);stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="500" height="500" fill="url(#grad${tokenId})"/>
      
      <!-- Border -->
      <rect x="10" y="10" width="480" height="480" fill="none" stroke="white" stroke-width="4" rx="20"/>
      
      <!-- Los Bros Text -->
      <text x="250" y="100" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">
        LOS BROS
      </text>
      
      <!-- Token ID -->
      <text x="250" y="250" font-family="Arial, sans-serif" font-size="120" font-weight="bold" fill="white" text-anchor="middle" opacity="0.9">
        #${tokenId}
      </text>
      
      <!-- Analos -->
      <text x="250" y="450" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle" opacity="0.7">
        Analos Collection
      </text>
    </svg>
  `;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

