/**
 * PROFILE NFT IMAGE GENERATOR API
 * Generates profile card images for NFTs
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const username = searchParams.get('username') || 'user';
    const displayName = searchParams.get('displayName') || username;
    const referralCode = searchParams.get('referralCode') || 'NONE';
    const twitterHandle = searchParams.get('twitterHandle') || '';
    const twitterVerified = searchParams.get('twitterVerified') === 'true';
    const avatarUrl = searchParams.get('avatarUrl') || '';
    const bannerUrl = searchParams.get('bannerUrl') || '';
    const bio = searchParams.get('bio') || '';
    const wallet = searchParams.get('wallet') || '';

    // Generate SVG profile card
    const svg = generateProfileCardSVG({
      username,
      displayName,
      referralCode,
      twitterHandle,
      twitterVerified,
      avatarUrl,
      bannerUrl,
      bio,
      wallet
    });

    // Return SVG as image
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Error generating profile card image:', error);
    return new NextResponse('Error generating image', { status: 500 });
  }
}

interface ProfileCardData {
  username: string;
  displayName: string;
  referralCode: string;
  twitterHandle: string;
  twitterVerified: boolean;
  avatarUrl: string;
  bannerUrl: string;
  bio: string;
  wallet: string;
}

function generateProfileCardSVG(data: ProfileCardData): string {
  const { username, displayName, referralCode, twitterHandle, twitterVerified, avatarUrl, bannerUrl, bio, wallet } = data;
  
  // Ensure referral code is properly formatted from username if not provided
  const finalReferralCode = referralCode || username.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  
  // Card dimensions
  const width = 400;
  const height = 600;
  
  // Colors
  const bgColor = '#1a1a2e';
  const cardColor = '#16213e';
  const accentColor = '#0f3460';
  const textColor = '#ffffff';
  const secondaryTextColor = '#b0b0b0';
  const referralColor = '#ff6b6b';
  const verifiedColor = '#4ecdc4';

  // Truncate bio if too long
  const truncatedBio = bio.length > 80 ? bio.substring(0, 77) + '...' : bio;

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${cardColor};stop-opacity:1" />
        </linearGradient>
        <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:${accentColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${referralColor};stop-opacity:1" />
        </linearGradient>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000000" flood-opacity="0.3"/>
        </filter>
      </defs>
      
      <!-- Background -->
      <rect width="100%" height="100%" fill="url(#bgGradient)"/>
      
      <!-- Card Background -->
      <rect x="20" y="20" width="360" height="560" rx="20" ry="20" fill="${cardColor}" filter="url(#shadow)"/>
      
      <!-- Banner Area -->
      <rect x="40" y="40" width="320" height="120" rx="10" ry="10" fill="${bannerUrl ? 'url(#bannerImage)' : accentColor}"/>
      ${bannerUrl ? `<image x="40" y="40" width="320" height="120" href="${bannerUrl}" preserveAspectRatio="xMidYMid slice" clip-path="url(#bannerClip)"/>` : ''}
      <defs>
        <clipPath id="bannerClip">
          <rect x="40" y="40" width="320" height="120" rx="10" ry="10"/>
        </clipPath>
      </defs>
      
      <!-- Avatar -->
      <circle cx="200" cy="160" r="40" fill="${avatarUrl ? 'url(#avatarImage)' : accentColor}" stroke="${cardColor}" stroke-width="4"/>
      ${avatarUrl ? `<image x="160" y="120" width="80" height="80" href="${avatarUrl}" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatarClip)"/>` : ''}
      <defs>
        <clipPath id="avatarClip">
          <circle cx="200" cy="160" r="40"/>
        </clipPath>
      </defs>
      
      <!-- Verified Badge -->
      ${twitterVerified ? `<circle cx="240" cy="140" r="16" fill="${verifiedColor}"/>
      <text x="240" y="145" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="bold">✓</text>` : ''}
      
      <!-- Display Name -->
      <text x="200" y="220" text-anchor="middle" fill="${textColor}" font-family="Arial, sans-serif" font-size="24" font-weight="bold">${displayName}</text>
      
      <!-- Username -->
      <text x="200" y="245" text-anchor="middle" fill="${secondaryTextColor}" font-family="Arial, sans-serif" font-size="16">@${username}</text>
      
      <!-- Twitter Handle -->
      ${twitterHandle ? `<text x="200" y="270" text-anchor="middle" fill="${verifiedColor}" font-family="Arial, sans-serif" font-size="14">🐦 @${twitterHandle}</text>` : ''}
      
      <!-- Bio -->
      ${bio ? `<text x="200" y="300" text-anchor="middle" fill="${secondaryTextColor}" font-family="Arial, sans-serif" font-size="12" text-align="center">${truncatedBio}</text>` : ''}
      
      <!-- Referral Code Section -->
      <rect x="60" y="340" width="280" height="80" rx="15" ry="15" fill="url(#accentGradient)"/>
      <text x="200" y="365" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">REFERRAL CODE</text>
      <text x="200" y="390" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="28" font-weight="bold">${finalReferralCode}</text>
      <text x="200" y="410" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12">Use this code to get started!</text>
      
      <!-- Wallet Address -->
      <text x="200" y="460" text-anchor="middle" fill="${secondaryTextColor}" font-family="monospace" font-size="10">${wallet}</text>
      
      <!-- Platform Info -->
      <text x="200" y="480" text-anchor="middle" fill="${secondaryTextColor}" font-family="Arial, sans-serif" font-size="12">Official Profile Card</text>
      <text x="200" y="495" text-anchor="middle" fill="${secondaryTextColor}" font-family="Arial, sans-serif" font-size="12">Minted on Analos • NFT #1</text>
      
      <!-- Bottom Border -->
      <rect x="40" y="560" width="320" height="4" fill="url(#accentGradient)"/>
    </svg>
  `;
}
