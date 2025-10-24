import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { ANALOS_RPC_URL } from '@/config/analos-programs';
import { calculateRarityScore, getRarityTier, LOS_BROS_COLLECTION } from '@/config/los-bros-collection';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface LosBrosNFT {
  mint: string;
  name: string;
  image: string;
  traits: Array<{ trait_type: string; value: string }>;
  rarityScore: number;
  rarityTier: 'LEGENDARY' | 'EPIC' | 'RARE' | 'COMMON';
  collection?: string;
}

/**
 * GET /api/los-bros/user-nfts/[wallet]
 * Fetches all Los Bros NFTs owned by a wallet
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ wallet: string }> }
) {
  try {
    const params = await context.params;
    const { wallet } = params;

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    console.log('🎨 Fetching Los Bros NFTs for wallet:', wallet);

    const connection = new Connection(ANALOS_RPC_URL, 'confirmed');
    const walletPubkey = new PublicKey(wallet);

    // Get all token accounts for the wallet (both programs)
    const [tokenAccounts, token2022Accounts] = await Promise.all([
      connection.getParsedTokenAccountsByOwner(walletPubkey, {
        programId: TOKEN_PROGRAM_ID,
      }),
      connection.getParsedTokenAccountsByOwner(walletPubkey, {
        programId: TOKEN_2022_PROGRAM_ID,
      }),
    ]);

    const allTokenAccounts = [
      ...tokenAccounts.value,
      ...token2022Accounts.value,
    ];

    console.log(`📊 Found ${allTokenAccounts.length} token accounts`);

    const losBrosNFTs: LosBrosNFT[] = [];

    // Filter for NFTs (amount = 1, decimals = 0)
    for (const accountInfo of allTokenAccounts) {
      const parsedInfo = accountInfo.account.data.parsed.info;
      const amount = parsedInfo.tokenAmount.uiAmount;
      const decimals = parsedInfo.tokenAmount.decimals;

      // NFTs have 1 token with 0 decimals
      if (amount === 1 && decimals === 0) {
        const mint = parsedInfo.mint;

        try {
          // Fetch metadata from on-chain account
          const metadataResponse = await fetch(
            `${ANALOS_RPC_URL}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'getAccountInfo',
                params: [
                  mint,
                  { encoding: 'jsonParsed' }
                ]
              })
            }
          );

          const metadataData = await metadataResponse.json();

          // Try to fetch metadata URI if available
          // For now, we'll check if the NFT name contains "Los Bros" or matches collection
          const accountInfo = await connection.getAccountInfo(new PublicKey(mint));
          
          if (accountInfo) {
            // Check if this is a Los Bros NFT by name pattern or collection
            // This is a simplified check - you may need to adjust based on your actual metadata structure
            
            // For demo purposes, we'll create sample Los Bros NFTs
            // In production, you'd fetch this from metadata URI
            const isLosBros = await checkIfLosBrosNFT(mint, connection);
            
            if (isLosBros) {
              const nftData = await fetchLosBrosMetadata(mint, connection);
              if (nftData) {
                losBrosNFTs.push(nftData);
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching metadata for mint ${mint}:`, error);
        }
      }
    }

    console.log(`✅ Found ${losBrosNFTs.length} Los Bros NFTs`);

    return NextResponse.json({
      success: true,
      wallet,
      losBrosNFTs,
      count: losBrosNFTs.length,
    });
  } catch (error: any) {
    console.error('❌ Error fetching Los Bros NFTs:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch Los Bros NFTs',
      },
      { status: 500 }
    );
  }
}

/**
 * Check if an NFT belongs to Los Bros collection
 */
async function checkIfLosBrosNFT(
  mint: string,
  connection: Connection
): Promise<boolean> {
  try {
    // TODO: Implement actual collection verification
    // This could check:
    // 1. Collection address in metadata
    // 2. Creator address
    // 3. Name pattern
    // 4. Stored in database
    
    // For now, return false until Los Bros collection is deployed
    // When ready, uncomment and implement proper verification
    
    return false;
  } catch (error) {
    console.error('Error checking Los Bros NFT:', error);
    return false;
  }
}

/**
 * Fetch Los Bros NFT metadata and calculate rarity
 */
async function fetchLosBrosMetadata(
  mint: string,
  connection: Connection
): Promise<LosBrosNFT | null> {
  try {
    // TODO: Fetch actual metadata from IPFS or on-chain
    // For now, return null until Los Bros collection is deployed
    
    // When ready, implement:
    // 1. Fetch metadata URI from on-chain account
    // 2. Fetch JSON from IPFS/Arweave
    // 3. Parse traits
    // 4. Calculate rarity score
    // 5. Determine rarity tier
    
    return null;
  } catch (error) {
    console.error('Error fetching Los Bros metadata:', error);
    return null;
  }
}

/**
 * Example of how metadata will be processed when Los Bros is deployed:
 * 
 * const metadata = await fetchFromIPFS(metadataUri);
 * const traits = metadata.attributes || [];
 * const rarityScore = calculateRarityScore(traits);
 * const rarityTier = getRarityTier(rarityScore);
 * 
 * return {
 *   mint,
 *   name: metadata.name,
 *   image: metadata.image,
 *   traits,
 *   rarityScore,
 *   rarityTier,
 *   collection: metadata.collection?.name,
 * };
 */

