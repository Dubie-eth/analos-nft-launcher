import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
