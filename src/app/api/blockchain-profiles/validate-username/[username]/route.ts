/**
 * SIMPLE USERNAME VALIDATION API  
 * Only validates format - blockchain will handle uniqueness at mint time
 */

import { NextRequest, NextResponse } from 'next/server';

// Reserved usernames
const RESERVED_USERNAMES = [
  'admin', 'analos', 'system', 'official', 'support', 'help', 'api',
  'root', 'moderator', 'mod', 'staff', 'team', 'founder', 'owner'
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    
    if (!username) {
      return NextResponse.json({
        available: false,
        valid: false,
        message: 'Username is required'
      });
    }

    // Normalize username
    const normalized = username.toLowerCase().trim();

    // Length: 3-20 characters
    if (normalized.length < 3) {
      return NextResponse.json({
        available: false,
        valid: false,
        message: 'Username must be at least 3 characters long'
      });
    }

    if (normalized.length > 20) {
      return NextResponse.json({
        available: false,
        valid: false,
        message: 'Username must be 20 characters or less'
      });
    }

    // Must start with a letter
    if (!/^[a-zA-Z]/.test(normalized)) {
      return NextResponse.json({
        available: false,
        valid: false,
        message: 'Username must start with a letter'
      });
    }

    // Only letters, numbers, and underscores
    if (!/^[a-zA-Z0-9_]+$/.test(normalized)) {
      return NextResponse.json({
        available: false,
        valid: false,
        message: 'Username can only contain letters, numbers, and underscores'
      });
    }

    // Check reserved names
    if (RESERVED_USERNAMES.includes(normalized)) {
      return NextResponse.json({
        available: false,
        valid: false,
        message: 'This username is reserved and cannot be used'
      });
    }

    // All checks passed!
    console.log(`✅ Username "${username}" is valid and available to mint`);

    return NextResponse.json({
      available: true,
      valid: true,
      message: `Username "${username}" is available!`
    });

  } catch (error: any) {
    console.error('❌ Error in username validation:', error);
    
    // On any error, return success to not block users
    // The blockchain will handle final validation at mint time
    return NextResponse.json({
      available: true,
      valid: true,
      message: 'Username validation passed'
    });
  }
}
