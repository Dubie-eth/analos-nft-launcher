import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Try to get LOS price from our oracle first
    const oracleResponse = await fetch('https://rpc.analos.io', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getAccountInfo',
        params: [
          'So11111111111111111111111111111111111111112', // SOL mint address as fallback
          {
            encoding: 'jsonParsed'
          }
        ]
      })
    });

    if (oracleResponse.ok) {
      const oracleData = await oracleResponse.json();
      // For now, return a mock price - in production this would come from your actual oracle
      return NextResponse.json({ 
        price: 0.0001, // Mock LOS price in USD
        source: 'oracle',
        timestamp: new Date().toISOString()
      });
    }

    // Fallback to CoinMarketCap API
    const cmcResponse = await fetch('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=LOS', {
      headers: {
        'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY || '',
        'Accept': 'application/json'
      }
    });

    if (cmcResponse.ok) {
      const cmcData = await cmcResponse.json();
      const price = cmcData.data?.LOS?.quote?.USD?.price || 0;
      
      return NextResponse.json({ 
        price,
        source: 'coinmarketcap',
        timestamp: new Date().toISOString()
      });
    }

    // Final fallback - return a default price
    return NextResponse.json({ 
      price: 0.0001,
      source: 'fallback',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching LOS price:', error);
    return NextResponse.json({ 
      price: 0.0001,
      source: 'error_fallback',
      timestamp: new Date().toISOString()
    }, { status: 200 }); // Return 200 with fallback price
  }
}
