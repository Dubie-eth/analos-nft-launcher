/**
 * USERNAME VALIDATION API
 * Checks if a username is available (unique) and valid
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';

// Reserved usernames that cannot be used
const RESERVED_USERNAMES = [
  'admin',
  'administrator',
  'root',
  'system',
  'analos',
  'onlyanal',
  'official',
  'support',
  'help',
  'api',
  'www',
  'mail',
  'ftp',
  'localhost',
  'test',
  'dev',
  'staging',
  'production',
  'null',
  'undefined',
  'true',
  'false'
];

// Validate username format
function isValidUsernameFormat(username: string): { valid: boolean; message?: string } {
  // Must be 3-20 characters
  if (username.length < 3) {
    return { valid: false, message: 'Username must be at least 3 characters long' };
  }
  if (username.length > 20) {
    return { valid: false, message: 'Username must be 20 characters or less' };
  }

  // Must start with a letter or number
  if (!/^[a-zA-Z0-9]/.test(username)) {
    return { valid: false, message: 'Username must start with a letter or number' };
  }

  // Can only contain letters, numbers, underscores, and hyphens
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { valid: false, message: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }

  // Cannot end with underscore or hyphen
  if (/_$|-$/.test(username)) {
    return { valid: false, message: 'Username cannot end with an underscore or hyphen' };
  }

  // Cannot have consecutive special characters
  if (/[_-]{2,}/.test(username)) {
    return { valid: false, message: 'Username cannot have consecutive underscores or hyphens' };
  }

  // Check if reserved
  if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
    return { valid: false, message: 'This username is reserved and cannot be used' };
  }

  return { valid: true };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    
    // Normalize username (lowercase, trim)
    const normalizedUsername = username.toLowerCase().trim();

    // Validate format
    const formatValidation = isValidUsernameFormat(normalizedUsername);
    if (!formatValidation.valid) {
      return NextResponse.json({
        available: false,
        valid: false,
        message: formatValidation.message
      });
    }

    // Check if database is configured
    if (!isSupabaseConfigured) {
      return NextResponse.json({
        available: true,
        valid: true,
        message: 'Username is available (database not configured)'
      });
    }

    // Check if username already exists (case-insensitive)
    const { data: existingUser, error } = await (supabaseAdmin
      .from('user_profiles') as any)
      .select('username, wallet_address')
      .ilike('username', normalizedUsername)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found (which is good)
      console.error('Error checking username:', error);
      return NextResponse.json(
        { error: 'Failed to check username availability' },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json({
        available: false,
        valid: true,
        message: `Username "${normalizedUsername}" is already taken`,
        takenBy: existingUser.wallet_address.slice(0, 8) + '...'
      });
    }

    return NextResponse.json({
      available: true,
      valid: true,
      message: `Username "${normalizedUsername}" is available!`
    });

  } catch (error) {
    console.error('Username validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST endpoint to reserve/claim a username
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const body = await request.json();
    const { walletAddress } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Normalize username
    const normalizedUsername = username.toLowerCase().trim();

    // Validate format
    const formatValidation = isValidUsernameFormat(normalizedUsername);
    if (!formatValidation.valid) {
      return NextResponse.json({
        success: false,
        message: formatValidation.message
      }, { status: 400 });
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: true,
        message: 'Username reserved (database not configured)',
        username: normalizedUsername
      });
    }

    // Check if username is available
    const { data: existingUser } = await (supabaseAdmin
      .from('user_profiles') as any)
      .select('username, wallet_address')
      .ilike('username', normalizedUsername)
      .single();

    if (existingUser && existingUser.wallet_address !== walletAddress) {
      return NextResponse.json({
        success: false,
        message: `Username "${normalizedUsername}" is already taken`
      }, { status: 409 });
    }

    // Reserve username by updating user profile
    const { data: updatedProfile, error: updateError } = await (supabaseAdmin
      .from('user_profiles') as any)
      .update({ username: normalizedUsername })
      .eq('wallet_address', walletAddress)
      .select()
      .single();

    if (updateError) {
      console.error('Error reserving username:', updateError);
      return NextResponse.json(
        { error: 'Failed to reserve username' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Username "${normalizedUsername}" has been reserved!`,
      username: normalizedUsername,
      profile: updatedProfile
    });

  } catch (error) {
    console.error('Username reservation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
