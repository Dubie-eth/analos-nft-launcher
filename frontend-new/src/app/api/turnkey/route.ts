import { NextRequest, NextResponse } from 'next/server';

const TURNKEY_API_URL = 'https://api.turnkey.com';

export async function POST(request: NextRequest) {
  try {
    const { method, url, data, headers } = await request.json();

    // Validate required parameters
    if (!method || !url) {
      return NextResponse.json(
        { error: 'Missing required parameters: method, url' },
        { status: 400 }
      );
    }

    // Extract API key and org ID from headers
    const apiKey = headers?.['X-API-Key'];
    const orgId = headers?.['X-Organization-Id'];
    
    if (!apiKey || !orgId) {
      return NextResponse.json(
        { error: 'Missing required headers: X-API-Key, X-Organization-Id' },
        { status: 400 }
      );
    }
    
    // Prepare headers for Turnkey API
    const turnkeyHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      'X-Organization-Id': orgId,
    };

    // Make the request to Turnkey API
    const response = await fetch(url, {
      method: method || 'POST',
      headers: turnkeyHeaders,
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
    const url = searchParams.get('url');
    const apiKey = searchParams.get('apiKey');
    const orgId = searchParams.get('orgId');

    if (!url || !apiKey || !orgId) {
      return NextResponse.json(
        { error: 'Missing required parameters: url, apiKey, orgId' },
        { status: 400 }
      );
    }
    
    // Prepare headers for Turnkey API
    const turnkeyHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      'X-Organization-Id': orgId,
    };

    // Make the request to Turnkey API
    const response = await fetch(url, {
      method: 'GET',
      headers: turnkeyHeaders,
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
