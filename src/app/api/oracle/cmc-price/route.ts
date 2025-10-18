import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token parameter is required' }, { status: 400 });
    }

    // Map token symbols to CoinMarketCap symbols
    const tokenMap: Record<string, string> = {
      'LOL': 'LOL',
      'SOL': 'SOL',
      'USDC': 'USDC',
      'LOS': 'LOS'
    };

    const cmcSymbol = tokenMap[token.toUpperCase()] || token.toUpperCase();

    // Try CoinMarketCap API
    const cmcResponse = await fetch(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${cmcSymbol}`, {
      headers: {
        'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY || '',
        'Accept': 'application/json'
      }
    });

    if (cmcResponse.ok) {
      const cmcData = await cmcResponse.json();
      const price = cmcData.data?.[cmcSymbol]?.quote?.USD?.price || 0;
      
      return NextResponse.json({ 
        price,
        source: 'coinmarketcap',
        symbol: cmcSymbol,
        timestamp: new Date().toISOString()
      });
    }

    // Fallback prices for common tokens
    const fallbackPrices: Record<string, number> = {
      'LOL': 0.0001,
      'SOL': 100.0,
      'USDC': 1.0,
      'LOS': 0.0001
    };

    const fallbackPrice = fallbackPrices[token.toUpperCase()] || 0;

    return NextResponse.json({ 
      price: fallbackPrice,
      source: 'fallback',
      symbol: token.toUpperCase(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching token price:', error);
    
    // Return fallback price even on error
    const fallbackPrices: Record<string, number> = {
      'LOL': 0.0001,
      'SOL': 100.0,
      'USDC': 1.0,
      'LOS': 0.0001
    };

    const token = new URL(request.url).searchParams.get('token') || 'LOL';
    const fallbackPrice = fallbackPrices[token.toUpperCase()] || 0;

    return NextResponse.json({ 
      price: fallbackPrice,
      source: 'error_fallback',
      symbol: token.toUpperCase(),
      timestamp: new Date().toISOString()
    }, { status: 200 });
  }
}
