import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Turnkey test route is working!',
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({
      success: true,
      message: 'Turnkey test POST route is working!',
      receivedData: body,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to parse request body',
      timestamp: new Date().toISOString(),
    }, { status: 400 });
  }
}
