/**
 * ADMIN DATABASE API ENDPOINTS
 * Secure admin operations for database management
 */

import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/database/database-service';
import { rateLimiters, getRequestIdentifier } from '@/lib/rate-limiter';
import { securityMonitor, getRequestMetadata } from '@/lib/security-monitor';

// Helper function to verify admin access
function verifyAdminAccess(request: NextRequest): string | null {
  const adminWallet = request.headers.get('x-admin-wallet');
  const adminSession = request.cookies.get('admin-session');
  
  if (!adminWallet && !adminSession) {
    return null;
  }
  
  // In a real implementation, verify the admin session/wallet against database
  return adminWallet || 'admin';
}

// GET /api/database/admin/stats - Get database statistics
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getRequestIdentifier(request);
    const { allowed, remaining, resetTime } = rateLimiters.admin.check(identifier);
    
    if (!allowed) {
      await securityMonitor.logRateLimit(identifier, '/api/database/admin/stats');
      return NextResponse.json(
        { error: 'Rate limit exceeded', resetTime: new Date(resetTime).toISOString() },
        { status: 429, headers: { 'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString() } }
      );
    }

    const adminAccess = verifyAdminAccess(request);
    if (!adminAccess) {
      const { ip, userAgent } = getRequestMetadata(request);
      await securityMonitor.logAuthAttempt('unknown', false, ip);
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Log admin access
    const { ip } = getRequestMetadata(request);
    await securityMonitor.logAdminAccess(adminAccess, 'view_database_stats', ip);
    
    const stats = await databaseService.getDatabaseStats(adminAccess);
    
    const response = NextResponse.json({ stats });
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/database/admin - Handle admin operations (backup, export, etc.)
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getRequestIdentifier(request);
    const { allowed, remaining, resetTime } = rateLimiters.admin.check(identifier);
    
    if (!allowed) {
      await securityMonitor.logRateLimit(identifier, '/api/database/admin');
      return NextResponse.json(
        { error: 'Rate limit exceeded', resetTime: new Date(resetTime).toISOString() },
        { status: 429, headers: { 'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString() } }
      );
    }

    const adminAccess = verifyAdminAccess(request);
    if (!adminAccess) {
      const { ip } = getRequestMetadata(request);
      await securityMonitor.logAuthAttempt('unknown', false, ip);
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const body = await request.json();
    const { operation, ...params } = body;
    
    // Log admin action
    const { ip } = getRequestMetadata(request);
    await securityMonitor.logAdminAccess(adminAccess, `admin_${operation}`, ip);
    
    switch (operation) {
      case 'backup': {
        const { backupType = 'full' } = params;
        const backup = await databaseService.createBackup(backupType, adminAccess);
        const response = NextResponse.json({ backup }, { status: 201 });
        response.headers.set('X-RateLimit-Remaining', remaining.toString());
        return response;
      }
      
      case 'export': {
        const { userId, exportType = 'profile_only' } = params;
        
        if (!userId) {
          return NextResponse.json({ error: 'userId required' }, { status: 400 });
        }
        
        const exportData = await databaseService.exportUserData(userId, adminAccess, exportType);
        
        if (!exportData) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        
        const response = NextResponse.json({ exportData });
        response.headers.set('X-RateLimit-Remaining', remaining.toString());
        return response;
      }
      
      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
