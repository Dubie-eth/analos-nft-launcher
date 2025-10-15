import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Import access control configuration
import { 
  ADMIN_WALLETS, 
  hasPageAccess, 
  getUserAccessLevel, 
  isAdminOnlyPage,
  PAGE_ACCESS,
  DEFAULT_ACCESS_LEVEL 
} from './src/config/access-control';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and API routes (except our proxy)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check if this page is in the PAGE_ACCESS configuration
  const pageConfig = PAGE_ACCESS.find(page => page.path === pathname);
  
  // If page is not in configuration, block access by default (whitelist approach)
  if (!pageConfig) {
    // Allow access to unmapped pages for now (like /marketplace, /explorer, etc.)
    // You can change this to block all unmapped pages for maximum security
    // return NextResponse.redirect(new URL('/', request.url));
    return NextResponse.next();
  }
  
  // Public pages are always accessible
  if (pageConfig.publicAccess) {
    return NextResponse.next();
  }
  
  // Get user wallet from cookies (set by client after wallet connection)
  const userWallet = request.cookies.get('connected-wallet')?.value || null;
  
  // If page requires authentication but no wallet is connected, redirect to home
  if (!userWallet && pageConfig.requiredLevel !== 'public') {
    const homeUrl = new URL('/', request.url);
    homeUrl.searchParams.set('access_denied', 'true');
    homeUrl.searchParams.set('required_page', pathname);
    return NextResponse.redirect(homeUrl);
  }
  
  // Get user access level from cookies (set by admin via UserAccessManager)
  const userAccessLevel = request.cookies.get(`access-level-${userWallet}`)?.value || DEFAULT_ACCESS_LEVEL;
  
  // Check if user has access to the requested page
  const hasAccess = hasPageAccess(userWallet, userAccessLevel, pathname);
  
  if (!hasAccess) {
    // Admin-only pages redirect to admin login
    if (isAdminOnlyPage(pathname)) {
      const loginUrl = new URL('/admin-login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    
    // Check if page is locked - redirect to beta signup
    if (pageConfig?.isLocked) {
      const signupUrl = new URL('/beta-signup', request.url);
      signupUrl.searchParams.set('locked_page', pathname);
      if (pageConfig.customMessage) {
        signupUrl.searchParams.set('message', pageConfig.customMessage);
      }
      return NextResponse.redirect(signupUrl);
    }
    
    // Other restricted pages redirect to home with access denied message
    const homeUrl = new URL('/', request.url);
    homeUrl.searchParams.set('access_denied', 'true');
    homeUrl.searchParams.set('required_page', pathname);
    return NextResponse.redirect(homeUrl);
  }
  
  // Special handling for admin routes (existing logic)
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
  
  // If we reached here, user has access
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
