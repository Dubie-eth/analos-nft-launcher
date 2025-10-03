import { Connection, PublicKey } from '@solana/web3.js';
import { getAccount } from '@solana/spl-token';

export interface TokenMetadata {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  supply?: number;
  isToken2022: boolean;
  programId: string;
  verified: boolean;
  lastUpdated: number;
}

export interface TokenValidationResult {
  valid: boolean;
  token: TokenMetadata | null;
  error?: string;
  warnings?: string[];
}

export class TokenMetadataService {
  private connection: Connection;
  private tokenCache: Map<string, TokenMetadata> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly ANALOS_RPC_URL = 'https://rpc.analos.io';
  
  // Known token programs
  private readonly SPL_TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
  private readonly TOKEN_2022_PROGRAM = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';

  constructor(rpcUrl?: string) {
    this.connection = new Connection(rpcUrl || this.ANALOS_RPC_URL, 'confirmed');
    console.log('🔍 Token Metadata Service initialized');
  }

  /**
   * Get token metadata with automatic validation and caching
   */
  async getTokenMetadata(tokenMint: string): Promise<TokenValidationResult> {
    try {
      console.log('🔍 Fetching token metadata for:', tokenMint);
      
      // Check cache first
      const cached = this.getCachedToken(tokenMint);
      if (cached) {
        console.log('✅ Using cached token metadata:', cached.symbol);
        return { valid: true, token: cached };
      }

      // Fetch from blockchain
      const tokenMetadata = await this.fetchTokenFromBlockchain(tokenMint);
      
      if (tokenMetadata) {
        // Cache the result
        this.tokenCache.set(tokenMint, tokenMetadata);
        console.log('✅ Token metadata fetched and cached:', tokenMetadata.symbol);
        return { valid: true, token: tokenMetadata };
      }

      return {
        valid: false,
        token: null,
        error: 'Token not found or invalid mint address'
      };

    } catch (error) {
      console.error('❌ Error fetching token metadata:', error);
      return {
        valid: false,
        token: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Fetch token metadata directly from blockchain
   */
  private async fetchTokenFromBlockchain(tokenMint: string): Promise<TokenMetadata | null> {
    try {
      const mintPublicKey = new PublicKey(tokenMint);
      
      // Try SPL Token program first
      let mintAccount;
      let programId = this.SPL_TOKEN_PROGRAM;
      let isToken2022 = false;

      try {
        mintAccount = await getAccount(this.connection, mintPublicKey);
      } catch (splError) {
        console.log('⚠️ SPL token account not found, trying Token-2022...');
        
        // Try Token-2022 program
        try {
          const accountInfo = await this.connection.getAccountInfo(mintPublicKey);
          if (accountInfo && accountInfo.owner.toString() === this.TOKEN_2022_PROGRAM) {
            programId = this.TOKEN_2022_PROGRAM;
            isToken2022 = true;
            
            // Parse Token-2022 mint account manually
            mintAccount = this.parseToken2022MintAccount(accountInfo.data);
            console.log('✅ Token-2022 mint account parsed');
          } else {
            throw new Error('Token not found in either SPL or Token-2022 program');
          }
        } catch (token2022Error) {
          console.error('❌ Token-2022 parsing failed:', token2022Error);
          throw new Error('Token not found in supported programs');
        }
      }

      if (!mintAccount) {
        throw new Error('Failed to parse mint account');
      }

      // Extract token information
      const decimals = mintAccount.decimals;
      const supply = mintAccount.supply ? Number(mintAccount.supply) : undefined;

      console.log('📊 Token details:', {
        decimals,
        supply,
        programId,
        isToken2022
      });

      // Try to get token name and symbol from metadata extensions
      let name = `Token-${tokenMint.slice(0, 8)}`;
      let symbol = `TKN-${tokenMint.slice(0, 4)}`;

      if (isToken2022) {
        try {
          const metadata = await this.getToken2022Metadata(mintPublicKey);
          if (metadata) {
            name = metadata.name || name;
            symbol = metadata.symbol || symbol;
            console.log('✅ Token-2022 metadata found:', { name, symbol });
          }
        } catch (metadataError) {
          console.log('⚠️ Token-2022 metadata not available, using defaults');
        }
      }

      const tokenMetadata: TokenMetadata = {
        mint: tokenMint,
        symbol,
        name,
        decimals,
        supply,
        isToken2022,
        programId,
        verified: true,
        lastUpdated: Date.now()
      };

      return tokenMetadata;

    } catch (error) {
      console.error('❌ Error fetching token from blockchain:', error);
      return null;
    }
  }

  /**
   * Parse Token-2022 mint account data
   */
  private parseToken2022MintAccount(data: Buffer): any {
    try {
      // Token-2022 mint account structure (simplified parsing)
      const decimals = data.readUInt8(44); // Decimals at offset 44
      const supply = data.readBigUInt64LE(36); // Supply at offset 36
      
      return {
        decimals,
        supply: BigInt(supply),
        // Add other fields as needed
      };
    } catch (error) {
      console.error('❌ Error parsing Token-2022 mint account:', error);
      throw error;
    }
  }

  /**
   * Get Token-2022 metadata from extensions
   */
  private async getToken2022Metadata(mintPublicKey: PublicKey): Promise<{ name?: string; symbol?: string } | null> {
    try {
      // This would implement Token-2022 metadata parsing
      // For now, return null as metadata parsing is complex
      console.log('🔍 Token-2022 metadata parsing not yet implemented');
      return null;
    } catch (error) {
      console.error('❌ Error getting Token-2022 metadata:', error);
      return null;
    }
  }

  /**
   * Validate token amount with correct decimals
   */
  validateTokenAmount(tokenMint: string, amount: number, displayAmount?: string): {
    valid: boolean;
    rawAmount: bigint;
    displayAmount: string;
    error?: string;
  } {
    const cached = this.getCachedToken(tokenMint);
    if (!cached) {
      return {
        valid: false,
        rawAmount: BigInt(0),
        displayAmount: '0',
        error: 'Token metadata not found. Please fetch token metadata first.'
      };
    }

    try {
      // Convert display amount to raw amount
      const rawAmount = BigInt(Math.floor(amount * Math.pow(10, cached.decimals)));
      
      // Convert back to display amount for verification
      const calculatedDisplayAmount = (Number(rawAmount) / Math.pow(10, cached.decimals)).toFixed(cached.decimals);
      
      // Check if the conversion is accurate
      const isValid = Math.abs(amount - parseFloat(calculatedDisplayAmount)) < Math.pow(10, -cached.decimals);

      return {
        valid: isValid,
        rawAmount,
        displayAmount: calculatedDisplayAmount,
        error: isValid ? undefined : 'Amount conversion error due to decimal precision'
      };

    } catch (error) {
      return {
        valid: false,
        rawAmount: BigInt(0),
        displayAmount: '0',
        error: error instanceof Error ? error.message : 'Amount validation error'
      };
    }
  }

  /**
   * Format token amount with correct decimals
   */
  formatTokenAmount(tokenMint: string, rawAmount: bigint): string {
    const cached = this.getCachedToken(tokenMint);
    if (!cached) {
      return '0';
    }

    const displayAmount = Number(rawAmount) / Math.pow(10, cached.decimals);
    return displayAmount.toFixed(cached.decimals);
  }

  /**
   * Get cached token metadata
   */
  private getCachedToken(tokenMint: string): TokenMetadata | null {
    const cached = this.tokenCache.get(tokenMint);
    if (cached && (Date.now() - cached.lastUpdated) < this.CACHE_DURATION) {
      return cached;
    }
    return null;
  }

  /**
   * Pre-fetch and cache known tokens
   */
  async preloadKnownTokens(): Promise<void> {
    console.log('🔄 Pre-loading known tokens...');
    
    const knownTokens = [
      'ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6', // LOL
      'So11111111111111111111111111111111111111112', // SOL
      // Add other known tokens here
    ];

    for (const tokenMint of knownTokens) {
      try {
        await this.getTokenMetadata(tokenMint);
        console.log('✅ Pre-loaded token:', tokenMint);
      } catch (error) {
        console.error('❌ Failed to pre-load token:', tokenMint, error);
      }
    }
  }

  /**
   * Get all cached tokens
   */
  getAllCachedTokens(): TokenMetadata[] {
    return Array.from(this.tokenCache.values());
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.tokenCache.clear();
    console.log('🧹 Token metadata cache cleared');
  }

  /**
   * Validate token address format and existence
   */
  async validateTokenAddress(tokenMint: string): Promise<boolean> {
    try {
      // Basic format validation
      if (!tokenMint || typeof tokenMint !== 'string') {
        return false;
      }

      // Check if it's a valid Solana public key format
      try {
        new PublicKey(tokenMint);
      } catch {
        return false;
      }

      // Check if token exists on blockchain
      const result = await this.getTokenMetadata(tokenMint);
      return result.valid;

    } catch (error) {
      console.error('❌ Error validating token address:', error);
      return false;
    }
  }

  /**
   * Get token info for display
   */
  getTokenDisplayInfo(tokenMint: string): {
    symbol: string;
    name: string;
    decimals: number;
    isVerified: boolean;
  } {
    const cached = this.getCachedToken(tokenMint);
    if (cached) {
      return {
        symbol: cached.symbol,
        name: cached.name,
        decimals: cached.decimals,
        isVerified: cached.verified
      };
    }

    return {
      symbol: 'UNKNOWN',
      name: 'Unknown Token',
      decimals: 9, // Default to 9 decimals for safety
      isVerified: false
    };
  }
}

// Export singleton instance
export const tokenMetadataService = new TokenMetadataService();
export default tokenMetadataService;