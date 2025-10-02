import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const size = searchParams.get('size') || 'medium';
    const platforms = searchParams.get('platforms') || '';

    if (!id) {
      return NextResponse.json(
        { error: 'Verification ID is required' },
        { status: 400 }
      );
    }

    // In a real implementation, you would:
    // 1. Validate verification ID
    // 2. Generate dynamic badge image
    // 3. Return SVG or PNG image

    // For now, we'll return a simple SVG badge
    const sizes = {
      small: { width: 24, height: 24, fontSize: 12 },
      medium: { width: 32, height: 32, fontSize: 16 },
      large: { width: 48, height: 48, fontSize: 20 }
    };

    const badgeSize = sizes[size as keyof typeof sizes] || sizes.medium;
    
    const svg = `
      <svg width="${badgeSize.width}" height="${badgeSize.height}" viewBox="0 0 ${badgeSize.width} ${badgeSize.height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#10B981;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
          </linearGradient>
        </defs>
        <circle cx="${badgeSize.width/2}" cy="${badgeSize.height/2}" r="${badgeSize.width/2 - 2}" fill="url(#gradient)" stroke="#ffffff" stroke-width="1"/>
        <text x="50%" y="50%" text-anchor="middle" dy="0.35em" fill="white" font-family="Arial, sans-serif" font-size="${badgeSize.fontSize}" font-weight="bold">✓</text>
      </svg>
    `;

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Error generating badge:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
