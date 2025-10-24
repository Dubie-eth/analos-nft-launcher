import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';

export async function GET(req: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured) {
      console.log('⚠️ Supabase not configured, returning empty profiles list');
      return NextResponse.json({ 
        success: true, 
        profiles: [],
        message: 'Database not configured'
      });
    }

    const supabase = getSupabaseAdmin();
    
    const { data: profiles, error } = await (supabase
      .from('user_profiles') as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching profiles:', error);
      return NextResponse.json({ 
        success: true, 
        profiles: [],
        message: 'Database query failed'
      });
    }

    return NextResponse.json({ 
      success: true, 
      profiles: profiles || [] 
    });
  } catch (error) {
    console.error('Error in profiles GET:', error);
    return NextResponse.json({ 
      success: true, 
      profiles: [],
      message: 'Error loading profiles'
    });
  }
}
