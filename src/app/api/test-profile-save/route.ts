/**
 * TEST PROFILE SAVE API
 * Simple test endpoint to debug the profile save issue
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 TEST: POST /api/test-profile-save - Starting request');
    
    const body = await request.json();
    console.log('🔍 TEST: Request body received:', JSON.stringify(body, null, 2));
    
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('✅ TEST: Returning success response');
    return NextResponse.json({
      success: true,
      message: 'Test profile save successful',
      receivedData: body
    });
    
  } catch (error) {
    console.error('❌ TEST: Error in POST /api/test-profile-save:', error);
    console.error('❌ TEST: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Test endpoint error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
