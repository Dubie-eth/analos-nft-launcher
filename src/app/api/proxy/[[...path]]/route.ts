import { NextRequest, NextResponse } from 'next/server';

// SECURITY: Server-side proxy to secure backend API calls
// This prevents client-side exposure of API keys and backend URLs

const BACKEND_URL = process.env.BACKEND_URL || 'https://analos-core-service-production.up.railway.app';
const API_KEY = process.env.API_KEY;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const resolvedParams = await params;
  return handleProxyRequest(request, resolvedParams.path || [], 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const resolvedParams = await params;
  return handleProxyRequest(request, resolvedParams.path || [], 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const resolvedParams = await params;
  return handleProxyRequest(request, resolvedParams.path || [], 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const resolvedParams = await params;
  return handleProxyRequest(request, resolvedParams.path || [], 'DELETE');
}

// Optional support for additional methods commonly used by backends
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const resolvedParams = await params;
  return handleProxyRequest(request, resolvedParams.path || [], 'PATCH');
}

export async function OPTIONS(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const resolvedParams = await params;
  return handleProxyRequest(request, resolvedParams.path || [], 'OPTIONS');
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

    // Prepare headers: start from incoming headers to preserve content-type and others
    const headers = new Headers(request.headers);

    // Remove hop-by-hop headers that should not be forwarded
    headers.delete('host');
    headers.delete('connection');
    headers.delete('content-length');

    // Add API key to both common header names if provided (backend may expect either)
    if (API_KEY) {
      headers.set('authorization', `Bearer ${API_KEY}`);
      headers.set('x-api-key', API_KEY);
    }

    // Prepare request body for methods that support a body. Use the original stream to avoid corruption.
    let body: ReadableStream<Uint8Array> | undefined;
    const methodHasBody = method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';
    if (methodHasBody) {
      body = request.body || undefined;
    }

    // Make the proxied request
    const response = await fetch(url.toString(), {
      method,
      headers,
      body,
    });

    // Get response data (text to preserve backend error body as-is)
    const responseData = await response.text();

    // Create response with same status and headers
    const nextResponse = new NextResponse(responseData, {
      status: response.status,
      statusText: response.statusText,
    });

    // Copy relevant response headers and pass through error details when present
    const responseHeaders = ['content-type', 'cache-control', 'www-authenticate'];
    responseHeaders.forEach(header => {
      const value = response.headers.get(header);
      if (value) {
        nextResponse.headers.set(header, value);
      }
    });

    // For JSON error bodies, ensure content-type is application/json
    if (!nextResponse.headers.get('content-type') && responseData?.trim().startsWith('{')) {
      nextResponse.headers.set('content-type', 'application/json');
    }

    return nextResponse;

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
