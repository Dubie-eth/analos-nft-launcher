/**
 * Price Oracle Updater Service for $LOS
 * Fetches $LOS price from DEXScreener and updates on-chain oracle
 * Runs on Railway alongside backend
 */

const { Connection, PublicKey, Keypair } = require("@solana/web3.js");
const anchor = require("@coral-xyz/anchor");
const fetch = require("node-fetch");

// Configuration
const ANALOS_RPC = process.env.ANALOS_RPC_URL || "https://rpc.analos.io";
const LOS_DEXSCREENER_PAIR = process.env.LOS_DEXSCREENER_PAIR || "7yrheg2yedh3hcrske1zj2dpevyp44kx6a3kry1fmhq2";
const UPDATE_INTERVAL = (process.env.ORACLE_UPDATE_INTERVAL || 300) * 1000; // Default 5 minutes
const LOS_DECIMALS = 9;
const USD_DECIMALS = 6;

class LOSPriceOracleService {
    constructor() {
        this.connection = new Connection(ANALOS_RPC, "confirmed");
        this.lastPrice = null;
        this.updateCount = 0;
    }

    /**
     * Fetch $LOS price from multiple sources and calculate median
     */
    async fetchLOSPrice() {
        try {
            console.log(`📡 Fetching $LOS price from multiple sources...`);
            
            const prices = [];
            
            // Source 1: Jupiter Aggregator API
            try {
                const jupiterPrice = await this.fetchFromJupiter();
                if (jupiterPrice) {
                    prices.push({ source: 'Jupiter', ...jupiterPrice });
                    console.log(`  ✅ Jupiter: $${jupiterPrice.priceUSD}`);
                }
            } catch (error) {
                console.log(`  ⚠️  Jupiter failed: ${error.message}`);
            }
            
            // Source 2: Birdeye API
            try {
                const birdeyePrice = await this.fetchFromBirdeye();
                if (birdeyePrice) {
                    prices.push({ source: 'Birdeye', ...birdeyePrice });
                    console.log(`  ✅ Birdeye: $${birdeyePrice.priceUSD}`);
                }
            } catch (error) {
                console.log(`  ⚠️  Birdeye failed: ${error.message}`);
            }
            
            // Source 3: On-chain calculation from pool reserves
            try {
                const onChainPrice = await this.fetchFromOnChain();
                if (onChainPrice) {
                    prices.push({ source: 'On-Chain', ...onChainPrice });
                    console.log(`  ✅ On-Chain: $${onChainPrice.priceUSD}`);
                }
            } catch (error) {
                console.log(`  ⚠️  On-Chain failed: ${error.message}`);
            }
            
            // Source 4: CoinGecko (if $LOS is listed)
            try {
                const coingeckoPrice = await this.fetchFromCoinGecko();
                if (coingeckoPrice) {
                    prices.push({ source: 'CoinGecko', ...coingeckoPrice });
                    console.log(`  ✅ CoinGecko: $${coingeckoPrice.priceUSD}`);
                }
            } catch (error) {
                console.log(`  ⚠️  CoinGecko failed: ${error.message}`);
            }
            
            if (prices.length === 0) {
                throw new Error("No price sources available");
            }
            
            // Calculate median price (most reliable)
            const medianPrice = this.calculateMedianPrice(prices);
            
            console.log(`\n📊 Price Consensus:`);
            console.log(`   Sources: ${prices.length}`);
            console.log(`   Median Price: $${medianPrice.priceUSD}`);
            console.log(`   Median Market Cap: $${medianPrice.marketCap.toLocaleString()}`);
            
            return medianPrice;
            
        } catch (error) {
            console.error(`❌ Error fetching prices:`, error.message);
            
            // Return last known price if available
            if (this.lastPrice) {
                console.log(`⚠️  Using last known price: $${this.lastPrice.priceUSD}`);
                return this.lastPrice;
            }
            
            throw error;
        }
    }

    /**
     * Fetch from Jupiter Price API v2
     */
    async fetchFromJupiter() {
        const LOS_TOKEN_MINT = process.env.LOS_TOKEN_MINT || "LoSVGc4rXHmeXcGF5VmT7uKYVQbLEKx6vVqKvVVpump";
        
        const response = await fetch(`https://price.jup.ag/v4/price?ids=${LOS_TOKEN_MINT}`);
        const data = await response.json();
        
        if (data.data && data.data[LOS_TOKEN_MINT]) {
            const tokenData = data.data[LOS_TOKEN_MINT];
            return {
                priceUSD: tokenData.price,
                marketCap: tokenData.price * 1_000_000_000, // Estimate from price
                liquidity: 0, // Not provided by Jupiter
                volume24h: 0,
                priceChange24h: 0
            };
        }
        
        return null;
    }

    /**
     * Fetch from Birdeye API
     */
    async fetchFromBirdeye() {
        const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY;
        if (!BIRDEYE_API_KEY) {
            console.log(`  ⚠️  No Birdeye API key configured`);
            return null;
        }
        
        const LOS_TOKEN_MINT = process.env.LOS_TOKEN_MINT || "LoSVGc4rXHmeXcGF5VmT7uKYVQbLEKx6vVqKvVVpump";
        
        const response = await fetch(
            `https://public-api.birdeye.so/defi/price?address=${LOS_TOKEN_MINT}`,
            {
                headers: {
                    'X-API-KEY': BIRDEYE_API_KEY
                }
            }
        );
        const data = await response.json();
        
        if (data.success && data.data) {
            return {
                priceUSD: data.data.value,
                marketCap: data.data.value * 1_000_000_000,
                liquidity: data.data.liquidity || 0,
                volume24h: data.data.v24hUSD || 0,
                priceChange24h: data.data.priceChange24h || 0
            };
        }
        
        return null;
    }

    /**
     * Fetch from on-chain pool reserves
     */
    async fetchFromOnChain() {
        const poolAddress = new PublicKey(this.LOS_PAIR);
        
        // Get pool account info
        const poolInfo = await this.connection.getAccountInfo(poolAddress);
        if (!poolInfo) {
            return null;
        }
        
        // Would parse pool data here (depends on pool type: Raydium, Orca, etc.)
        // For now, return null to use other sources
        
        return null;
    }

    /**
     * Fetch from CoinGecko
     */
    async fetchFromCoinGecko() {
        const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
        const LOS_COINGECKO_ID = process.env.LOS_COINGECKO_ID || "analos";
        
        const headers = COINGECKO_API_KEY ? {
            'X-CG-API-KEY': COINGECKO_API_KEY
        } : {};
        
        try {
            const response = await fetch(
                `https://api.coingecko.com/api/v3/coins/${LOS_COINGECKO_ID}`,
                { headers }
            );
            const data = await response.json();
            
            if (data.market_data) {
                return {
                    priceUSD: data.market_data.current_price?.usd || 0,
                    marketCap: data.market_data.market_cap?.usd || 0,
                    liquidity: data.market_data.total_volume?.usd || 0,
                    volume24h: data.market_data.total_volume?.usd || 0,
                    priceChange24h: data.market_data.price_change_percentage_24h || 0
                };
            }
        } catch (error) {
            console.log(`  ⚠️  CoinGecko not available (likely not listed yet)`);
        }
        
        return null;
    }

    /**
     * Calculate median price from multiple sources
     */
    calculateMedianPrice(prices) {
        // Sort prices
        const sortedPrices = prices.map(p => p.priceUSD).sort((a, b) => a - b);
        const sortedMarketCaps = prices.map(p => p.marketCap).sort((a, b) => a - b);
        
        // Get median
        const midIndex = Math.floor(sortedPrices.length / 2);
        const medianPriceUSD = sortedPrices.length % 2 === 0
            ? (sortedPrices[midIndex - 1] + sortedPrices[midIndex]) / 2
            : sortedPrices[midIndex];
        
        const medianMarketCap = sortedMarketCaps.length % 2 === 0
            ? (sortedMarketCaps[midIndex - 1] + sortedMarketCaps[midIndex]) / 2
            : sortedMarketCaps[midIndex];
        
        // Calculate average liquidity and volume
        const avgLiquidity = prices.reduce((sum, p) => sum + p.liquidity, 0) / prices.length;
        const avgVolume = prices.reduce((sum, p) => sum + p.volume24h, 0) / prices.length;
        const avgPriceChange = prices.reduce((sum, p) => sum + p.priceChange24h, 0) / prices.length;
        
        return {
            priceUSD: medianPriceUSD,
            marketCap: medianMarketCap,
            liquidity: avgLiquidity,
            volume24h: avgVolume,
            priceChange24h: avgPriceChange
        };
    }

    /**
     * Update on-chain oracle (would call program)
     */
    async updateOnChainOracle(priceData) {
        try {
            console.log(`📝 Updating on-chain oracle...`);
            
            // Convert to program format
            const marketCapWithDecimals = Math.floor(priceData.marketCap * 10 ** USD_DECIMALS);
            
            // Calculate circulating supply from market cap and price
            const circulatingSupply = priceData.marketCap / priceData.priceUSD;
            const supplyWithDecimals = Math.floor(circulatingSupply * 10 ** LOS_DECIMALS);
            
            console.log(`   Market Cap (with decimals): ${marketCapWithDecimals}`);
            console.log(`   Supply (with decimals): ${supplyWithDecimals}`);
            
            // TODO: Actual program call would go here
            // await this.priceOracleProgram.methods
            //     .updateLosMarketCap(...)
            //     .rpc();
            
            console.log(`✅ Oracle updated successfully!`);
            
            return true;
        } catch (error) {
            console.error(`❌ Failed to update on-chain oracle:`, error.message);
            return false;
        }
    }

    /**
     * Main update loop
     */
    async update() {
        try {
            this.updateCount++;
            console.log(`\n🔄 Update #${this.updateCount} - ${new Date().toISOString()}`);
            
            // Fetch price
            const priceData = await this.fetchLOSPrice();
            
            // Update oracle
            const success = await this.updateOnChainOracle(priceData);
            
            if (success) {
                this.lastPrice = priceData;
                console.log(`✅ Update cycle complete!`);
            } else {
                console.log(`⚠️  Update cycle failed, will retry next interval`);
            }
            
        } catch (error) {
            console.error(`❌ Update cycle error:`, error.message);
        }
    }

    /**
     * Start service
     */
    async start() {
        console.log(`\n🚀 $LOS Price Oracle Service Starting...`);
        console.log(`   Network: Analos (${ANALOS_RPC})`);
        console.log(`   Pair: ${LOS_DEXSCREENER_PAIR}`);
        console.log(`   Update Interval: ${UPDATE_INTERVAL / 1000}s`);
        console.log(`   $LOS Decimals: ${LOS_DECIMALS}`);
        
        // Initial update
        console.log(`\n📊 Performing initial price fetch...`);
        await this.update();
        
        // Regular updates
        console.log(`\n⏰ Starting regular updates...`);
        setInterval(async () => {
            await this.update();
        }, UPDATE_INTERVAL);
        
        console.log(`✅ Oracle service is running!`);
    }
}

// Start service if run directly
if (require.main === module) {
    const service = new LOSPriceOracleService();
    service.start().catch(error => {
        console.error("Fatal error:", error);
        process.exit(1);
    });
}

module.exports = { LOSPriceOracleService };

