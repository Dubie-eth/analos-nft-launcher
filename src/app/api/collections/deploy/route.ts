import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'Collection deployment now requires wallet signing. Please use the client-side deployment flow with a connected wallet.' 
    },
    { status: 400 }
  );
}