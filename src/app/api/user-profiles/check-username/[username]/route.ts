/**
 * API Route: Check Username Availability
 * Validates if a username is available for use
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    
    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { available: false, error: 'Username can only contain letters, numbers, and underscores' },
        { status: 400 }
      );
    }

    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { available: false, error: 'Username must be between 3 and 20 characters' },
        { status: 400 }
      );
    }

    // Check if database is available
    if (!supabaseAdmin) {
      return NextResponse.json(
        { available: false, error: 'Database not available' },
        { status: 503 }
      );
    }

    // Check if username exists in database
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('username')
      .eq('username', username.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      logger.error('Database error checking username:', error);
      return NextResponse.json(
        { error: 'Failed to check username availability' },
        { status: 500 }
      );
    }

    const available = !data; // Username is available if no data is returned

    logger.log(`Username "${username}" availability check: ${available ? 'available' : 'taken'}`);

    return NextResponse.json({
      available,
      username: username.toLowerCase()
    });

  } catch (error) {
    logger.error('Error checking username availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
