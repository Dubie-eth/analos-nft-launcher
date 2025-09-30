import { Connection, PublicKey } from '@solana/web3.js';

export interface AnalosTokenInfo {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  supply: number;
  description?: string;
  image?: string;
  website?: string;
}

export interface TokenHolder {
  walletAddress: string;
  balance: number;
  balanceFormatted: number;
  percentage: number;
}

export class AnalosTokenService {
  private connection: Connection;

  constructor(rpcUrl: string = 'https://rpc.analos.io') {
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  /**
   * Get token information using raw RPC calls instead of SPL library
   */
  async getTokenInfo(mintAddress: string): Promise<AnalosTokenInfo | null> {
    try {
      console.log(`🔍 Fetching token info for: ${mintAddress}`);
      
      const mintPublicKey = new PublicKey(mintAddress);
      
      // Get account info directly from RPC
      const accountInfo = await this.connection.getAccountInfo(mintPublicKey);
      if (!accountInfo) {
        console.warn(`⚠️ Account does not exist: ${mintAddress}`);
        return null;
      }

      // Check if it's owned by SPL Token Program
      const SPL_TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
      if (accountInfo.owner.toString() !== SPL_TOKEN_PROGRAM_ID) {
        console.warn(`⚠️ Account not owned by SPL Token Program: ${mintAddress}`);
        return null;
      }

      // Parse mint account data manually (mint account is 82 bytes)
      if (accountInfo.data.length < 82) {
        console.warn(`⚠️ Invalid mint account data length: ${accountInfo.data.length}`);
        return null;
      }

      const data = accountInfo.data;
      
      // Parse mint account structure:
      // - Supply (8 bytes, BigInt)
      // - Decimals (1 byte)
      // - IsInitialized (1 byte)
      // - MintAuthority (32 bytes, optional)
      // - FreezeAuthority (32 bytes, optional)
      
      const supply = data.readBigUInt64LE(0);
      const decimals = data.readUInt8(8);
      const isInitialized = data.readUInt8(9) === 1;
      
      if (!isInitialized) {
        console.warn(`⚠️ Mint account not initialized: ${mintAddress}`);
        return null;
      }

      // Get token metadata from known tokens or use fallbacks
      const tokenInfo = this.getKnownTokenInfo(mintAddress, decimals, Number(supply));
      
      console.log(`✅ Token info fetched:`, tokenInfo);
      return tokenInfo;

    } catch (error) {
      console.error(`❌ Error fetching token info for ${mintAddress}:`, error);
      return null;
    }
  }

  /**
   * Get token holders using program accounts
   */
  async getTokenHolders(mintAddress: string, minBalance: number = 0): Promise<TokenHolder[]> {
    try {
      console.log(`🔍 Fetching token holders for: ${mintAddress} (min balance: ${minBalance})`);
      
      const tokenInfo = await this.getTokenInfo(mintAddress);
      if (!tokenInfo) {
        console.warn(`⚠️ Cannot fetch token info for holders: ${mintAddress}`);
        return [];
      }

      const mintPublicKey = new PublicKey(mintAddress);
      
      // Get all token accounts for this mint
      const tokenAccounts = await this.connection.getProgramAccounts(
        new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        {
          filters: [
            {
              dataSize: 165, // Token account data size
            },
            {
              memcmp: {
                offset: 0, // Mint address offset
                bytes: mintPublicKey.toBase58(),
              },
            },
          ],
        }
      );

      console.log(`📊 Found ${tokenAccounts.length} token accounts`);

      const holders: TokenHolder[] = [];
      let totalSupply = 0;

      // Parse each token account
      for (const account of tokenAccounts) {
        try {
          const accountInfo = await this.connection.getParsedAccountInfo(account.pubkey);
          
          if (accountInfo.value?.data && 'parsed' in accountInfo.value.data) {
            const parsedData = accountInfo.value.data.parsed;
            const owner = parsedData.info.owner;
            const amount = parsedData.info.tokenAmount.uiAmount || 0;
            const rawAmount = parsedData.info.tokenAmount.amount;

            if (amount >= minBalance) {
              holders.push({
                walletAddress: owner,
                balance: rawAmount,
                balanceFormatted: amount,
                percentage: 0 // Will calculate later
              });
              totalSupply += amount;
            }
          }
        } catch (error) {
          console.warn(`⚠️ Error parsing token account ${account.pubkey.toString()}:`, error);
        }
      }

      // Calculate percentages
      holders.forEach(holder => {
        holder.percentage = totalSupply > 0 ? (holder.balanceFormatted / totalSupply) * 100 : 0;
      });

      // Sort by balance (descending)
      holders.sort((a, b) => b.balanceFormatted - a.balanceFormatted);

      console.log(`✅ Found ${holders.length} token holders`);
      return holders;

    } catch (error) {
      console.error(`❌ Error fetching token holders for ${mintAddress}:`, error);
      return [];
    }
  }

  /**
   * Get known token information or fallback
   */
  private getKnownTokenInfo(mintAddress: string, decimals: number, supply: number): AnalosTokenInfo {
    // Known tokens database
    const knownTokens: Record<string, Partial<AnalosTokenInfo>> = {
      'ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6': {
        symbol: 'LOL',
        name: 'Launch On LOS Token',
        description: 'The official token of the Launch On LOS ecosystem',
        image: 'https://gateway.pinata.cloud/ipfs/bafkreih6zcd4y4fhyp2zu77ugduxbw5j647oqxz64x3l23vctycs36rddm',
        website: 'https://launchonlos.com'
      }
    };

    const knownToken = knownTokens[mintAddress];
    
    if (knownToken) {
      return {
        mint: mintAddress,
        symbol: knownToken.symbol || this.generateSymbolFromMint(mintAddress),
        name: knownToken.name || this.generateNameFromMint(mintAddress),
        decimals,
        supply,
        description: knownToken.description,
        image: knownToken.image,
        website: knownToken.website
      };
    }

    // Fallback for unknown tokens
    return {
      mint: mintAddress,
      symbol: this.generateSymbolFromMint(mintAddress),
      name: this.generateNameFromMint(mintAddress),
      decimals,
      supply,
      description: `Token ${mintAddress.slice(0, 8)}`
    };
  }

  private generateSymbolFromMint(mintAddress: string): string {
    const shortMint = mintAddress.slice(0, 4).toUpperCase();
    return `${shortMint}...`;
  }

  private generateNameFromMint(mintAddress: string): string {
    const shortMint = mintAddress.slice(0, 8).toUpperCase();
    return `Token ${shortMint}`;
  }

  /**
   * Get token balance for a specific wallet
   */
  async getWalletTokenBalance(walletAddress: string, mintAddress: string): Promise<number> {
    try {
      const ownerPublicKey = new PublicKey(walletAddress);
      const mintPublicKey = new PublicKey(mintAddress);

      const tokenAccounts = await this.connection.getTokenAccountsByOwner(ownerPublicKey, {
        mint: mintPublicKey
      });

      let totalBalance = 0;
      for (const account of tokenAccounts.value) {
        const accountInfo = await this.connection.getParsedAccountInfo(account.pubkey);
        if (accountInfo.value?.data && 'parsed' in accountInfo.value.data) {
          const amount = accountInfo.value.data.parsed.info.tokenAmount.uiAmount || 0;
          totalBalance += amount;
        }
      }

      return totalBalance;
    } catch (error) {
      console.error(`Error fetching wallet balance for ${walletAddress}:`, error);
      return 0;
    }
  }
}

export const analosTokenService = new AnalosTokenService();
