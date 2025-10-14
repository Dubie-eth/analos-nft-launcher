import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Admin wallet addresses - only these wallets can access admin
const ADMIN_WALLETS = [
  '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', // Your admin wallet
  '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m', // Deployer wallet (for program initialization)
  // Add more admin wallets here if needed
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    // For admin routes, we need to check the wallet connection
    // Since this is server-side, we'll redirect to a secure admin login page
    // that requires wallet connection and verification
    
    // Check if there's a valid admin session
    const adminSession = request.cookies.get('admin-session');
    
    if (!adminSession) {
      // No admin session found, redirect to admin login
      const loginUrl = new URL('/admin-login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    
    // Validate the admin session (you can add more validation here)
    try {
      const sessionData = JSON.parse(adminSession.value);
      
      // Check if the session contains a valid admin wallet
      if (!sessionData.walletAddress || !ADMIN_WALLETS.includes(sessionData.walletAddress)) {
        // Invalid admin session, redirect to login
        const loginUrl = new URL('/admin-login', request.url);
        return NextResponse.redirect(loginUrl);
      }
      
      // Check if session is expired (e.g., 24 hours)
      const sessionTime = sessionData.timestamp || 0;
      const now = Date.now();
      const sessionExpiry = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      
      if (now - sessionTime > sessionExpiry) {
        // Session expired, redirect to login
        const loginUrl = new URL('/admin-login', request.url);
        return NextResponse.redirect(loginUrl);
      }
      
      // Valid admin session, allow access
      return NextResponse.next();
      
    } catch (error) {
      // Invalid session data, redirect to login
      const loginUrl = new URL('/admin-login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  // For all other routes, allow access
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
