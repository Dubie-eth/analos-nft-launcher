import { NextRequest, NextResponse } from 'next/server';

const TURNKEY_API_URL = 'https://api.turnkey.com';

export async function POST(request: NextRequest) {
  try {
    const { endpoint, method, data, orgId, privateKey } = await request.json();

    // Validate required parameters
    if (!endpoint || !orgId || !privateKey) {
      return NextResponse.json(
        { error: 'Missing required parameters: endpoint, orgId, privateKey' },
        { status: 400 }
      );
    }

    // Build the URL
    const url = `${TURNKEY_API_URL}${endpoint}`;
    
    // Prepare headers - Turnkey uses different authentication
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-API-Key': privateKey,
      'X-Organization-Id': orgId,
    };

    // Make the request to Turnkey API
    const response = await fetch(url, {
      method: method || 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Turnkey API error: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Turnkey API proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    const orgId = searchParams.get('orgId');
    const privateKey = searchParams.get('privateKey');

    if (!endpoint || !orgId || !privateKey) {
      return NextResponse.json(
        { error: 'Missing required parameters: endpoint, orgId, privateKey' },
        { status: 400 }
      );
    }

    // Build the URL
    const url = `${TURNKEY_API_URL}${endpoint}`;
    
    // Prepare headers - Turnkey uses different authentication
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-API-Key': privateKey,
      'X-Organization-Id': orgId,
    };

    // Make the request to Turnkey API
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Turnkey API error: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Turnkey API proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
