import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    const { data, error } = await supabaseAdmin
      .from('saved_collections')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        }
      }, { status: 500 });
    }
    
    console.log('✅ Database connection successful');
    
    // Test table structure by trying to insert a test record
    const testData = {
      user_wallet: 'test-wallet-123',
      collection_name: 'Test Collection',
      collection_symbol: 'TEST',
      description: 'Test description',
      total_supply: 100,
      mint_price: 0.1,
      reveal_type: 'instant',
      whitelist_enabled: false,
      bonding_curve_enabled: false,
      layers: [],
      collection_config: {},
      logo_url: 'test-logo-url',
      banner_url: 'test-banner-url'
    };
    
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('saved_collections')
      .insert(testData)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Insert test failed:', insertError);
      return NextResponse.json({
        success: false,
        error: 'Insert test failed',
        details: {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        }
      }, { status: 500 });
    }
    
    // Clean up test record
    await supabaseAdmin
      .from('saved_collections')
      .delete()
      .eq('id', insertData.id);
    
    console.log('✅ Database test successful');
    
    return NextResponse.json({
      success: true,
      message: 'Database connection and table structure are working correctly',
      testData: insertData
    });
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}