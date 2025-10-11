import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🧪 Test API route called');
  return NextResponse.json({ 
    success: true, 
    message: 'Test API route is working',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  console.log('🧪 Test API route (POST) called');
  try {
    const body = await request.json();
    return NextResponse.json({ 
      success: true, 
      message: 'Test API route (POST) is working',
      receivedData: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid JSON in request body',
      timestamp: new Date().toISOString()
    }, { status: 400 });
  }
}