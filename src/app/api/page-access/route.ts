/**
 * PAGE ACCESS API ROUTE
 * Manage page access configurations (admin only)
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

export async function GET() {
  try {
    const pageConfigs = await pageAccessService.getPageAccessConfigs();
    return NextResponse.json(pageConfigs);
  } catch (error) {
    console.error('Error fetching page access configs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminWallet = verifyAdminAccess(request);
    if (!adminWallet) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { pagePath, updates } = body;

    if (!pagePath || !updates) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Update page lock status
    if (updates.isLocked !== undefined) {
      await pageAccessService.updatePageLock(pagePath, updates.isLocked, adminWallet);
    }

    // Update access level
    if (updates.requiredLevel) {
      await pageAccessService.updatePageAccessLevel(pagePath, updates.requiredLevel, adminWallet);
    }

    // Update custom message
    if (updates.customMessage !== undefined) {
      await pageAccessService.updatePageCustomMessage(pagePath, updates.customMessage, adminWallet);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating page access config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminWallet = verifyAdminAccess(request);
    if (!adminWallet) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'lockAll':
        await pageAccessService.lockAllPages(adminWallet);
        return NextResponse.json({ success: true, message: 'All pages locked' });

      case 'unlockAll':
        await pageAccessService.unlockAllPages(adminWallet);
        return NextResponse.json({ success: true, message: 'All pages unlocked' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error performing bulk page access action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
