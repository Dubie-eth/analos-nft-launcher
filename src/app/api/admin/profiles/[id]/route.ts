import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { username, bio, email, socials, privacyLevel, allowDataExport, allowAnalytics } = body;

    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        username,
        bio,
        email,
        socials,
        privacyLevel,
        allowDataExport,
        allowAnalytics,
        updatedAt: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update profile' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      profile: data 
    });
  } catch (error) {
    console.error('Error in profile PUT:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting profile:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to delete profile' 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in profile DELETE:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
