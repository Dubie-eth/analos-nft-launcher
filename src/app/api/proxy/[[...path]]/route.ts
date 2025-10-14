import { NextRequest, NextResponse } from 'next/server';

// SECURITY: Server-side proxy to secure backend API calls
// This prevents client-side exposure of API keys and backend URLs

const BACKEND_URL = process.env.BACKEND_URL || 'https://analos-core-service-production.up.railway.app';
const API_KEY = process.env.API_KEY;

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxyRequest(request, params.path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxyRequest(request, params.path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxyRequest(request, params.path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxyRequest(request, params.path, 'DELETE');
}

async function handleProxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    // Reconstruct the backend URL
    const path = pathSegments.join('/');
    const url = new URL(path, BACKEND_URL);
    
    // Copy query parameters
    const searchParams = request.nextUrl.searchParams;
    searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });

    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add API key if available
    if (API_KEY) {
      headers['Authorization'] = `Bearer ${API_KEY}`;
    }

    // Copy relevant headers from the original request
    const forwardHeaders = ['user-agent', 'accept', 'accept-language'];
    forwardHeaders.forEach(header => {
      const value = request.headers.get(header);
      if (value) {
        headers[header] = value;
      }
    });

    // Prepare request body for POST/PUT requests
    let body: string | undefined;
    if (method === 'POST' || method === 'PUT') {
      try {
        body = await request.text();
      } catch (error) {
        console.error('Error reading request body:', error);
        return NextResponse.json(
          { error: 'Invalid request body' },
          { status: 400 }
        );
      }
    }

    // Make the proxied request
    const response = await fetch(url.toString(), {
      method,
      headers,
      body,
    });

    // Get response data
    const responseData = await response.text();
    
    // Create response with same status and headers
    const nextResponse = new NextResponse(responseData, {
      status: response.status,
      statusText: response.statusText,
    });

    // Copy relevant response headers
    const responseHeaders = ['content-type', 'cache-control'];
    responseHeaders.forEach(header => {
      const value = response.headers.get(header);
      if (value) {
        nextResponse.headers.set(header, value);
      }
    });

    return nextResponse;

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
