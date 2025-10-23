import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { isActive } = body;

    const { data, error } = await supabase
      .from('blocked_wallets')
      .update({ isActive })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating block status:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update block status' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      blockedWallet: data 
    });
  } catch (error) {
    console.error('Error in blocked wallet PATCH:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('blocked_wallets')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting block:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to delete block' 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in blocked wallet DELETE:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
