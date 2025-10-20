/**
 * PAGE ACCESS API - PROFILE PAGE
 * Handle access control for the profile page
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    // Default configuration for profile page
    const defaultConfig = {
      path: '/profile',
      name: 'User Profile',
      description: 'User account and settings',
      requiredLevel: 'beta_user',
      requiresWallet: false,
      publicAccess: true,
      isLocked: false,
      customMessage: 'Connect your wallet to access your profile'
    };

    // If Supabase is not configured, return default config
    if (!isSupabaseConfigured) {
      return NextResponse.json(defaultConfig);
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json(defaultConfig);
    }

    try {
      // Try to get page access configuration from database
      const { data, error } = await supabaseAdmin
        .from('page_access_control')
        .select('*')
        .eq('path', '/profile')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Error fetching page access config:', error);
        return NextResponse.json(defaultConfig);
      }

      // If no configuration found, return default
      if (!data) {
        return NextResponse.json(defaultConfig);
      }

      // Return the configuration from database
      return NextResponse.json({
        path: (data as any).path || defaultConfig.path,
        name: (data as any).name || defaultConfig.name,
        description: (data as any).description || defaultConfig.description,
        requiredLevel: (data as any).required_level || defaultConfig.requiredLevel,
        requiresWallet: (data as any).requires_wallet || defaultConfig.requiresWallet,
        publicAccess: (data as any).public_access || defaultConfig.publicAccess,
        isLocked: (data as any).is_locked || defaultConfig.isLocked,
        customMessage: (data as any).custom_message || defaultConfig.customMessage
      });

    } catch (dbError) {
      console.error('Database error in page access check:', dbError);
      return NextResponse.json(defaultConfig);
    }

  } catch (error) {
    console.error('Error in page access API:', error);
    return NextResponse.json({
      path: '/profile',
      name: 'User Profile',
      description: 'User account and settings',
      requiredLevel: 'beta_user',
      requiresWallet: false,
      publicAccess: true,
      isLocked: false,
      customMessage: 'Connect your wallet to access your profile'
    });
  }
}
