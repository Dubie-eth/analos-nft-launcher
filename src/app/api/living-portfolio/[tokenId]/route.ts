/**
 * LIVING PORTFOLIO NFT API ROUTE
 * Handle Living Portfolio NFT operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { livingPortfolioService } from '@/lib/living-portfolio-service';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const resolvedParams = await params;
    const tokenId = resolvedParams.tokenId;
    
    logger.log(`📊 Fetching Living Portfolio NFT ${tokenId}`);
    
    const portfolio = livingPortfolioService.getPortfolio(tokenId);
    
    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio NFT not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(portfolio);
  } catch (error) {
    logger.error('Error fetching portfolio NFT:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio NFT' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const resolvedParams = await params;
    const tokenId = resolvedParams.tokenId;
    const { ownerAddress, initialInvestment } = await request.json();
    
    if (!ownerAddress) {
      return NextResponse.json(
        { error: 'Owner address is required' },
        { status: 400 }
      );
    }
    
    logger.log(`🚀 Initializing Living Portfolio NFT ${tokenId} for ${ownerAddress.slice(0, 8)}...`);
    
    const portfolio = await livingPortfolioService.initializePortfolioNFT(
      tokenId,
      ownerAddress,
      initialInvestment || 0.1
    );
    
    logger.log(`✅ Living Portfolio NFT ${tokenId} initialized successfully`);
    
    return NextResponse.json({
      success: true,
      portfolio,
      message: `Living Portfolio NFT ${tokenId} initialized with ${portfolio.investments.length} initial investments`
    });
  } catch (error) {
    logger.error('Error initializing portfolio NFT:', error);
    return NextResponse.json(
      { error: 'Failed to initialize portfolio NFT' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const resolvedParams = await params;
    const tokenId = resolvedParams.tokenId;
    const updates = await request.json();
    
    logger.log(`🔄 Updating Living Portfolio NFT ${tokenId}`);
    
    // Get current portfolio
    const portfolio = livingPortfolioService.getPortfolio(tokenId);
    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio NFT not found' },
        { status: 404 }
      );
    }
    
    // Handle different update types
    if (updates.action === 'rebalance') {
      // Trigger manual rebalancing
      await livingPortfolioService.rebalancePortfolio?.(tokenId);
    } else if (updates.action === 'evolve') {
      // Trigger manual evolution
      await livingPortfolioService.evolvePortfolioNFT?.(tokenId);
    } else if (updates.action === 'update_strategy') {
      // Update investment strategy
      portfolio.portfolioAnalysis.investmentStrategy = {
        ...portfolio.portfolioAnalysis.investmentStrategy,
        ...updates.strategy
      };
    }
    
    // Return updated portfolio
    const updatedPortfolio = livingPortfolioService.getPortfolio(tokenId);
    
    return NextResponse.json({
      success: true,
      portfolio: updatedPortfolio,
      message: `Portfolio NFT ${tokenId} updated successfully`
    });
  } catch (error) {
    logger.error('Error updating portfolio NFT:', error);
    return NextResponse.json(
      { error: 'Failed to update portfolio NFT' },
      { status: 500 }
    );
  }
}
