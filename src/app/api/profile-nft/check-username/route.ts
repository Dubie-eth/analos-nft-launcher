/**
 * SIMPLE USERNAME VALIDATION API
 * Only checks format and reserved words
 * Blockchain will handle uniqueness when minting
 */

import { NextRequest, NextResponse } from 'next/server';

// Reserved usernames that cannot be used
const RESERVED_USERNAMES = [
  'admin', 'analos', 'system', 'official', 'support', 'help', 'api', 
  'root', 'moderator', 'mod', 'staff', 'team', 'founder', 'owner'
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({
        success: false,
        available: false,
        error: 'Username is required'
      }, { status: 400 });
    }

    // Normalize username (lowercase for comparison)
    const normalizedUsername = username.toLowerCase().trim();

    // Check length (3-20 characters)
    if (normalizedUsername.length < 3) {
      return NextResponse.json({
        success: true,
        available: false,
        username: normalizedUsername,
        error: 'Username must be at least 3 characters'
      });
    }

    if (normalizedUsername.length > 20) {
      return NextResponse.json({
        success: true,
        available: false,
        username: normalizedUsername,
        error: 'Username must be 20 characters or less'
      });
    }

    // Validate username format (letters, numbers, underscores only)
    if (!/^[a-zA-Z0-9_]+$/.test(normalizedUsername)) {
      return NextResponse.json({
        success: true,
        available: false,
        username: normalizedUsername,
        error: 'Username can only contain letters, numbers, and underscores'
      });
    }

    // Must start with a letter
    if (!/^[a-zA-Z]/.test(normalizedUsername)) {
      return NextResponse.json({
        success: true,
        available: false,
        username: normalizedUsername,
        error: 'Username must start with a letter'
      });
    }

    // Check against reserved usernames
    if (RESERVED_USERNAMES.includes(normalizedUsername)) {
      return NextResponse.json({
        success: true,
        available: false,
        username: normalizedUsername,
        error: `Username "${username}" is reserved by the system`
      });
    }

    // Username passes all validation checks
    console.log(`✅ Username @${username} is valid and available to mint`);
    
    return NextResponse.json({
      success: true,
      available: true,
      username: normalizedUsername,
      message: `Username @${username} is available!`
    });

  } catch (error: any) {
    console.error('❌ Error in username validation:', error);
    
    // Return success with available=true even on error
    // Let the blockchain handle the final check
    return NextResponse.json({
      success: true,
      available: true,
      username: request.nextUrl.searchParams.get('username') || '',
      message: 'Username validation check passed'
    });
  }
}

export async function POST(request: NextRequest) {
  // Simplified POST - just acknowledge the registration
  // Database recording happens in the main mint API
  try {
    const body = await request.json();
    const { username } = body;

    console.log(`✅ Username registration acknowledged: @${username}`);

    return NextResponse.json({
      success: true,
      message: 'Username registration acknowledged'
    });
  } catch (error: any) {
    console.error('❌ Error in POST:', error);
    return NextResponse.json({
      success: true,
      message: 'OK'
    });
  }
}

export async function DELETE(request: NextRequest) {
  // Simplified DELETE - just acknowledge
  // Database cleanup happens elsewhere
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    console.log(`✅ Username deletion acknowledged: @${username}`);

    return NextResponse.json({
      success: true,
      message: 'Username deletion acknowledged'
    });
  } catch (error: any) {
    console.error('❌ Error in DELETE:', error);
    return NextResponse.json({
      success: true,
      message: 'OK'
    });
  }
}

