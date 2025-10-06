import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    success: true, 
    message: 'Test API route is working',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ 
    success: true, 
    message: 'Test POST route is working',
    receivedData: body,
    timestamp: new Date().toISOString()
  });
}