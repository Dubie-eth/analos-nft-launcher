/**
 * PAGE ACCESS API ROUTE
 * Get page access configuration for a specific page
 */

import { NextRequest, NextResponse } from 'next/server';
import { pageAccessService } from '@/lib/database/page-access-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { pagePath: string } }
) {
  try {
    const pagePath = decodeURIComponent(params.pagePath);
    
    const pageConfig = await pageAccessService.getPageAccessConfig(pagePath);
    
    if (!pageConfig) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }
    
    return NextResponse.json(pageConfig);
  } catch (error) {
    console.error('Error fetching page access config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
