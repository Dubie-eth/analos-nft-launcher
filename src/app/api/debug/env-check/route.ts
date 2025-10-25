/**
 * ENVIRONMENT VARIABLES CHECK
 * Diagnostic endpoint to verify Supabase configuration in deployment
 */

import { NextResponse } from 'next/server';

export async function GET() {
  // Check which environment variables are present (without exposing values)
  const envCheck = {
    NEXT_PUBLIC_SUPABASE_URL: {
      present: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      value: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
        `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 20)}...` : 
        'NOT SET',
      isPlaceholder: process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'
    },
    NEXT_PUBLIC_SUPABASE_ANON_KEY: {
      present: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      length: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
      isPlaceholder: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'placeholder-anon-key'
    },
    SUPABASE_SERVICE_ROLE_KEY: {
      present: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
      isPlaceholder: process.env.SUPABASE_SERVICE_ROLE_KEY === 'placeholder-service-key'
    }
  };

  return NextResponse.json({
    success: true,
    environment: process.env.NODE_ENV || 'unknown',
    vercel: process.env.VERCEL === '1',
    envCheck,
    message: 'Environment check complete'
  });
}

