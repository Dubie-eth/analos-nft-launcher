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

      // Check if it's owned by SPL Token Program or Token-2022
      const SPL_TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
      const TOKEN_2022_PROGRAM_ID = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
      
      const isSPLToken = accountInfo.owner.toString() === SPL_TOKEN_PROGRAM_ID;
      const isToken2022 = accountInfo.owner.toString() === TOKEN_2022_PROGRAM_ID;
      
      if (!isSPLToken && !isToken2022) {
        console.warn(`⚠️ Account not owned by SPL Token Program or Token-2022: ${mintAddress}`);
        console.warn(`🔍 Actual owner: ${accountInfo.owner.toString()}`);
        return null;
      }
      
      console.log(`✅ Token is ${isSPLToken ? 'SPL Token' : 'Token-2022'}`);

      // Parse mint account data manually
      // Token-2022 mint accounts can be larger than 82 bytes due to extensions
      const data = accountInfo.data;
      
      if (data.length < 82) {
        console.warn(`⚠️ Invalid mint account data length: ${accountInfo.data.length}`);
        return null;
      }
      
      // Parse mint account structure:
      // - Supply (8 bytes, BigInt)
      // - Decimals (1 byte)
      // - IsInitialized (1 byte)
      // - MintAuthority (32 bytes, optional)
      // - FreezeAuthority (32 bytes, optional)
      // - Token-2022 may have additional extensions
      
      const supply = data.readBigUInt64LE(0);
      const decimals = data.readUInt8(8);
      const isInitialized = data.readUInt8(9) === 1;
      
      console.log(`📊 Mint account data:`, {
        dataLength: data.length,
        supply: supply.toString(),
        decimals,
        isInitialized,
        isToken2022
      });
      
      // For Token-2022, we'll be more lenient with initialization check
      if (!isInitialized && isSPLToken) {
        console.warn(`⚠️ SPL Token mint account not initialized: ${mintAddress}`);
        return null;
      } else if (!isInitialized && isToken2022) {
        console.warn(`⚠️ Token-2022 mint account appears uninitialized, but proceeding anyway: ${mintAddress}`);
        // Continue with fallback values for Token-2022
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
      
      // Get the token program from the mint account
      const mintAccountInfo = await this.connection.getAccountInfo(mintPublicKey);
      const tokenProgramId = mintAccountInfo.owner.toString();
      
      console.log(`🔍 Using token program: ${tokenProgramId}`);
      console.log(`🔍 Mint address: ${mintAddress}`);
      console.log(`🔍 Token program ID: ${tokenProgramId}`);
      
      // Get all token accounts for this mint
      const tokenAccounts = await this.connection.getProgramAccounts(
        new PublicKey(tokenProgramId),
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
      
      if (tokenAccounts.length === 0) {
        console.log('⚠️ No token accounts found. This might be because:');
        console.log('  1. The token has no holders yet');
        console.log('  2. Token accounts use a different data size');
        console.log('  3. The mint address is incorrect');
        console.log('  4. The token program ID is wrong');
        return [];
      }

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
