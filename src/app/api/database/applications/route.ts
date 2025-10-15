/**
 * BETA APPLICATION API ENDPOINTS
 * Secure application management with admin controls
 */

import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/database/database-service';
import { BetaApplication } from '@/lib/database/types';
import { rateLimiters, getRequestIdentifier } from '@/lib/rate-limiter';
import { securityMonitor } from '@/lib/security-monitor';

// Helper function to get client info
function getClientInfo(request: NextRequest) {
  return {
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown'
  };
}

// Helper function to verify admin access
function verifyAdminAccess(request: NextRequest): string | null {
  const adminWallet = request.headers.get('x-admin-wallet');
  const adminSession = request.cookies.get('admin-session');
  
  if (!adminWallet && !adminSession) {
    return null;
  }
  
  return adminWallet || 'admin';
}

// GET /api/database/applications - Get applications
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getRequestIdentifier(request);
    const isAdmin = verifyAdminAccess(request);
    const limiter = isAdmin ? rateLimiters.admin : rateLimiters.standard;
    const { allowed, remaining, resetTime } = limiter.check(identifier);
    
    if (!allowed) {
      await securityMonitor.logRateLimit(identifier, '/api/database/applications');
      return NextResponse.json(
        { error: 'Rate limit exceeded', resetTime: new Date(resetTime).toISOString() },
        { status: 429, headers: { 'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString() } }
      );
    }

    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');
    const status = searchParams.get('status');
    
    const clientInfo = getClientInfo(request);
    const accessedBy = isAdmin || 'user';
    
    if (applicationId) {
      // Get specific application
      const application = await databaseService.getBetaApplication(applicationId, accessedBy);
      
      if (!application) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      }
      
      // Remove sensitive data for non-admin access
      if (!verifyAdminAccess(request)) {
        delete (application as any).walletAddress;
      }
      
      return NextResponse.json({ application });
    } else {
      // Get all applications (admin only)
      const adminAccess = verifyAdminAccess(request);
      if (!adminAccess) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
      
      const applications = await databaseService.getAllBetaApplications(adminAccess, status || undefined);
      return NextResponse.json({ applications });
    }
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/database/applications - Create new application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      walletAddress,
      username,
      bio,
      socials,
      profilePicture,
      bannerImage,
      accessLevel,
      customMessage,
      lockedPageRequested
    } = body;
    
    if (!walletAddress || !username) {
      return NextResponse.json({ error: 'walletAddress and username required' }, { status: 400 });
    }
    
    const clientInfo = getClientInfo(request);
    const accessedBy = verifyAdminAccess(request) || walletAddress;
    
    const application = await databaseService.createBetaApplication({
      userId: userId || crypto.randomUUID(),
      walletAddress,
      username,
      bio,
      socials: socials || {},
      profilePicture,
      bannerImage,
      status: 'pending',
      accessLevel: accessLevel || 'beta_user',
      customMessage,
      lockedPageRequested
    }, accessedBy);
    
    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/database/applications - Update application (admin only)
export async function PUT(request: NextRequest) {
  try {
    const adminAccess = verifyAdminAccess(request);
    if (!adminAccess) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const body = await request.json();
    const { applicationId, updates } = body;
    
    if (!applicationId) {
      return NextResponse.json({ error: 'applicationId required' }, { status: 400 });
    }
    
    const clientInfo = getClientInfo(request);
    
    // Add review information
    const reviewUpdates = {
      ...updates,
      reviewedBy: adminAccess,
      reviewedAt: updates.status ? new Date() : undefined
    };
    
    const updatedApplication = await databaseService.updateBetaApplication(
      applicationId,
      reviewUpdates,
      adminAccess
    );
    
    if (!updatedApplication) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    
    return NextResponse.json({ application: updatedApplication });
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/database/applications - Delete application (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const adminAccess = verifyAdminAccess(request);
    if (!adminAccess) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');
    
    if (!applicationId) {
      return NextResponse.json({ error: 'applicationId required' }, { status: 400 });
    }
    
    const clientInfo = getClientInfo(request);
    
    // For now, we'll mark as deleted by updating status
    // In a full implementation, you might want actual deletion
    const updatedApplication = await databaseService.updateBetaApplication(
      applicationId,
      { status: 'rejected', rejectionReason: 'Deleted by admin' },
      adminAccess
    );
    
    if (!updatedApplication) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Error deleting application:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
