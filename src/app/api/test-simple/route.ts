import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({ 
      status: 'ok',
      message: 'Simple test endpoint working',
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform
    });
  } catch (error) {
    return NextResponse.json({ 
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
