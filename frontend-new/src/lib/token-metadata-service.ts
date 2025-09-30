import { Connection, PublicKey } from '@solana/web3.js';
import { getAccount, getMint } from '@solana/spl-token';

export interface TokenMetadata {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  supply: number;
  authority?: string;
  freezeAuthority?: string;
}

export class TokenMetadataService {
  private connection: Connection;

  constructor(rpcUrl: string = 'https://rpc.analos.io') {
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  async getTokenMetadata(mintAddress: string): Promise<TokenMetadata | null> {
    try {
      console.log(`🔍 Fetching token metadata for: ${mintAddress}`);
      
      const mintPublicKey = new PublicKey(mintAddress);
      const mintInfo = await getMint(this.connection, mintPublicKey);
      
      // Get token account info if available
      const tokenAccountInfo = await this.connection.getAccountInfo(mintPublicKey);
      
      const metadata: TokenMetadata = {
        mint: mintAddress,
        symbol: this.generateSymbolFromMint(mintAddress), // Fallback symbol
        name: this.generateNameFromMint(mintAddress), // Fallback name
        decimals: mintInfo.decimals,
        supply: Number(mintInfo.supply),
        authority: mintInfo.mintAuthority?.toString(),
        freezeAuthority: mintInfo.freezeAuthority?.toString()
      };

      // Try to fetch from Metaplex metadata if available
      try {
        const metaplexMetadata = await this.fetchMetaplexMetadata(mintPublicKey);
        if (metaplexMetadata) {
          metadata.symbol = metaplexMetadata.symbol || metadata.symbol;
          metadata.name = metaplexMetadata.name || metadata.name;
        }
      } catch (error) {
        console.log(`⚠️ Could not fetch Metaplex metadata for ${mintAddress}, using fallback`);
      }

      console.log(`✅ Token metadata fetched:`, metadata);
      return metadata;
    } catch (error) {
      console.error(`❌ Error fetching token metadata for ${mintAddress}:`, error);
      return null;
    }
  }

  private generateSymbolFromMint(mintAddress: string): string {
    // Generate a readable symbol from the mint address
    const shortMint = mintAddress.slice(0, 4).toUpperCase();
    return `${shortMint}...`;
  }

  private generateNameFromMint(mintAddress: string): string {
    // Generate a readable name from the mint address
    const shortMint = mintAddress.slice(0, 8).toUpperCase();
    return `Token ${shortMint}`;
  }

  private async fetchMetaplexMetadata(mintPublicKey: PublicKey): Promise<{ name?: string; symbol?: string } | null> {
    try {
      // This is a simplified Metaplex metadata fetch
      // In a full implementation, you'd use @metaplex-foundation/mpl-token-metadata
      const [metadataPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('metadata'),
          new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s').toBuffer(),
          mintPublicKey.toBuffer(),
        ],
        new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
      );

      const metadataAccount = await this.connection.getAccountInfo(metadataPDA);
      if (metadataAccount) {
        // Parse the metadata account data
        // This is simplified - in production you'd use the proper Metaplex parsing
        return {
          name: 'Fetched Token Name',
          symbol: 'FTS'
        };
      }
      return null;
    } catch (error) {
      console.log('Metaplex metadata not available:', error);
      return null;
    }
  }

  async getTokenBalance(walletAddress: string, mintAddress: string): Promise<number> {
    try {
      const ownerPublicKey = new PublicKey(walletAddress);
      const mintPublicKey = new PublicKey(mintAddress);

      const tokenAccounts = await this.connection.getTokenAccountsByOwner(ownerPublicKey, {
        mint: mintPublicKey
      });

      let totalBalance = 0;
      for (const account of tokenAccounts.value) {
        const accountInfo = await getAccount(this.connection, account.pubkey);
        totalBalance += Number(accountInfo.amount);
      }

      return totalBalance;
    } catch (error) {
      console.error(`Error fetching token balance for ${walletAddress} of ${mintAddress}:`, error);
      return 0;
    }
  }

  async validateTokenAddress(mintAddress: string): Promise<boolean> {
    try {
      const mintPublicKey = new PublicKey(mintAddress);
      const mintInfo = await getMint(this.connection, mintPublicKey);
      return !!mintInfo;
    } catch (error) {
      console.error(`Invalid token address: ${mintAddress}`, error);
      return false;
    }
  }
}

export const tokenMetadataService = new TokenMetadataService();
