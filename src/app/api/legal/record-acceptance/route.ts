import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, disclaimerType, ipAddress, userAgent } = body;

    if (!walletAddress || !disclaimerType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Get IP address from request headers
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const detectedIp = forwardedFor?.split(',')[0] || realIp || ipAddress || 'unknown';
    const detectedUserAgent = request.headers.get('user-agent') || userAgent || 'unknown';

    // Record the acceptance
    const { data, error } = await supabase
      .from('legal_acceptances')
      .insert({
        wallet_address: walletAddress,
        disclaimer_type: disclaimerType,
        ip_address: detectedIp,
        user_agent: detectedUserAgent,
        accepted_at: new Date().toISOString(),
        platform_version: '4.2.2',
        acceptance_data: {
          timestamp: Date.now(),
          url: request.headers.get('referer') || 'unknown',
          disclaimerVersion: '1.0.0'
        }
      });

    if (error) {
      console.error('❌ Error recording legal acceptance:', error);
      // Don't fail the request even if DB insert fails
      return NextResponse.json({
        success: true,
        warning: 'Acceptance recorded locally but DB insert failed'
      });
    }

    console.log(`✅ Legal acceptance recorded: ${walletAddress} accepted ${disclaimerType}`);

    return NextResponse.json({
      success: true,
      message: 'Acceptance recorded successfully'
    });

  } catch (error: any) {
    console.error('❌ Error in record-acceptance API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to record acceptance' 
      },
      { status: 500 }
    );
  }
}

