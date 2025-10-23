import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

// Use centralized Supabase admin client
const supabase = getSupabaseAdmin();

export async function GET(req: NextRequest) {
  try {
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching profiles:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch profiles' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      profiles: profiles || [] 
    });
  } catch (error) {
    console.error('Error in profiles GET:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
