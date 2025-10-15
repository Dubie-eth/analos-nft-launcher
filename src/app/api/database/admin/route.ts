/**
 * ADMIN DATABASE API ENDPOINTS
 * Secure admin operations for database management
 */

import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/database/database-service';

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
    const adminAccess = verifyAdminAccess(request);
    if (!adminAccess) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const stats = await databaseService.getDatabaseStats(adminAccess);
    
    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching database stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/database/admin/backup - Create database backup
export async function POST(request: NextRequest) {
  try {
    const adminAccess = verifyAdminAccess(request);
    if (!adminAccess) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const body = await request.json();
    const { backupType = 'full' } = body;
    
    const backup = await databaseService.createBackup(backupType, adminAccess);
    
    return NextResponse.json({ backup }, { status: 201 });
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/database/admin/export - Export user data
export async function POST(request: NextRequest) {
  try {
    const adminAccess = verifyAdminAccess(request);
    if (!adminAccess) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const body = await request.json();
    const { userId, exportType = 'profile_only' } = body;
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }
    
    const exportData = await databaseService.exportUserData(userId, adminAccess, exportType);
    
    if (!exportData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ exportData });
  } catch (error) {
    console.error('Error exporting user data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
