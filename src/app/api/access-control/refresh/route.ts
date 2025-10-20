/**
 * ACCESS CONTROL REFRESH API
 * Force refresh access control settings across the platform
 */

import { NextRequest, NextResponse } from 'next/server';
import { pageAccessService } from '@/lib/database/page-access-service';

// Admin wallet addresses
const ADMIN_WALLETS = [
  '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
  '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m',
];

function verifyAdminAccess(request: NextRequest): string | null {
  // In a real implementation, this would verify the admin wallet from headers or session
  // For now, we'll extract from the request body or headers
  const authHeader = request.headers.get('authorization');
  const body = request.body ? 'wallet' : null; // This would be parsed from request body
  
  // This is a simplified check - in production, implement proper authentication
  return '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW'; // Mock admin for now
}

export async function POST(request: NextRequest) {
  try {
    const adminWallet = verifyAdminAccess(request);
    if (!adminWallet) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { pagePath, forceRefresh } = body;

    if (!pagePath) {
      return NextResponse.json({ error: 'Page path required' }, { status: 400 });
    }

    // Get current page configuration
    const pageConfig = await pageAccessService.getPageAccessConfig(pagePath);
    
    if (!pageConfig) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Return the current configuration to force client-side refresh
    return NextResponse.json({
      success: true,
      message: 'Access control refreshed',
      pageConfig,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error refreshing access control:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const adminWallet = verifyAdminAccess(request);
    if (!adminWallet) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all page configurations
    const allConfigs = await pageAccessService.getPageAccessConfigs();
    
    return NextResponse.json({
      success: true,
      message: 'All access control configurations retrieved',
      configs: allConfigs,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting access control configs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
