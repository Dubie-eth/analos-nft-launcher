import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

const supabase = getSupabaseAdmin();

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
    const { username, bio, email, socials, privacyLevel, allowDataExport, allowAnalytics } = body;
    const resolvedParams = await params;

    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (username !== undefined) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    if (email !== undefined) updateData.email = email;
    if (socials !== undefined) updateData.socials = socials;
    if (privacyLevel !== undefined) updateData.privacyLevel = privacyLevel;
    if (allowDataExport !== undefined) updateData.allowDataExport = allowDataExport;
    if (allowAnalytics !== undefined) updateData.allowAnalytics = allowAnalytics;

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', resolvedParams.id)
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
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', resolvedParams.id);

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
