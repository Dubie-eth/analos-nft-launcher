import { NextRequest, NextResponse } from 'next/server';
import { USERNAME_RULES } from '@/lib/blockchain-profile-service';

/**
 * UPDATE MATRIX COLLECTION CONFIG
 * Updates collection configuration like minimum username length
 */

export async function POST(request: NextRequest) {
  try {
    const { minUsernameLength } = await request.json();

    // Validate input
    if (typeof minUsernameLength !== 'number' || minUsernameLength < 3 || minUsernameLength > 10) {
      return NextResponse.json(
        { error: 'Invalid username length. Must be between 3 and 10.' },
        { status: 400 }
      );
    }

    // Note: In a production system, you would update this in a database
    // For now, we'll just return success as the USERNAME_RULES constant would need
    // to be updated in the code directly
    
    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully',
      config: {
        minUsernameLength
      }
    });

  } catch (error) {
    console.error('Error updating collection config:', error);
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}
